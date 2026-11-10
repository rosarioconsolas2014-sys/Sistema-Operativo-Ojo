import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { FileItem } from '../../types/os';
import { FileSystemService } from '../../services/fileSystemService';
import { AppIcon } from '../../components/UI/AppIcon';
import { auth } from '../../services/firebase';
import { syncService } from '../../services/firebaseSyncService';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
  Search,
  FolderPlus,
  FilePlus,
  Upload,
  Trash2,
  Edit2,
  Grid,
  List,
  HardDrive,
  Folder,
  Monitor,
  FileText,
  Download,
  Image as ImageIcon,
  Music,
} from 'lucide-react';

interface ExplorerProps {
  windowId: string;
  meta?: { initialFolderId?: string };
}

export const ExplorerApp: React.FC<ExplorerProps> = ({ meta }) => {
  const { openApp, refreshFiles, addNotification } = useOS();

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(meta?.initialFolderId || 'folder_desktop');
  const [history, setHistory] = useState<(string | null)[]>([meta?.initialFolderId || 'folder_desktop']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [items, setItems] = useState<FileItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Inline rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  const loadFolder = (folderId: string | null) => {
    const list = FileSystemService.getFolderItems(folderId);
    setItems(list);
    setSelectedItemId(null);
  };

  useEffect(() => {
    loadFolder(currentFolderId);
  }, [currentFolderId]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const navigateTo = (folderId: string | null) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(folderId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentFolderId(folderId);
    setSearchQuery('');
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentFolderId(target);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentFolderId(target);
    }
  };

  const goUp = () => {
    if (!currentFolderId) return;
    const current = FileSystemService.getItemById(currentFolderId);
    if (current && current.parentId) {
      navigateTo(current.parentId);
    } else {
      navigateTo(null);
    }
  };

  // Actions
  const handleCreateFolder = () => {
    const newF = FileSystemService.createFolder(currentFolderId, 'Nueva carpeta');
    loadFolder(currentFolderId);
    refreshFiles();
    setRenamingId(newF.id);
    setRenameValue(newF.name);
    addNotification('Carpeta creada', 'Nueva carpeta añadida.', 'Explorador');
  };

  const handleCreateFile = () => {
    const newF = FileSystemService.createFile(currentFolderId, 'Nuevo documento', '', 'txt');
    loadFolder(currentFolderId);
    refreshFiles();
    setRenamingId(newF.id);
    setRenameValue(newF.name);
    addNotification('Archivo creado', 'Nuevo documento de texto creado.', 'Explorador');
  };

  const handleFinishRename = () => {
    if (!renamingId) return;
    if (renameValue.trim()) {
      FileSystemService.renameItem(renamingId, renameValue.trim());
      loadFolder(currentFolderId);
      refreshFiles();
    }
    setRenamingId(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedItemId) return;
    const item = FileSystemService.getItemById(selectedItemId);
    if (!item) return;

    if (item.isSystem) {
      addNotification('Aviso', 'No se pueden eliminar las carpetas del sistema.', 'Explorador');
      return;
    }

    FileSystemService.moveToRecycleBin(selectedItemId);
    loadFolder(currentFolderId);
    refreshFiles();
    addNotification('Elemento eliminado', `"${item.name}" se movió a la papelera.`, 'Papelera');
    setSelectedItemId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop() || 'txt';
    const isBinary = file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.size > 20000;

    try {
      if (auth.currentUser && isBinary) {
        addNotification('Subiendo a la nube...', `Subiendo "${file.name}" a Firebase Storage...`, 'Explorador');
        const storageUrl = await syncService.uploadBinary(
          auth.currentUser.uid,
          `explorer/${Date.now()}_${file.name}`,
          file
        );
        FileSystemService.createFile(currentFolderId, file.name, storageUrl, ext);
        loadFolder(currentFolderId);
        refreshFiles();
        addNotification('Archivo en la nube', `"${file.name}" almacenado en Firebase Storage.`, 'Explorador');
        return;
      }
    } catch (err) {
      console.warn('Firebase Storage upload failed, falling back to local reader:', err);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      FileSystemService.createFile(currentFolderId, file.name, content, ext);
      loadFolder(currentFolderId);
      refreshFiles();
      addNotification('Archivo cargado', `"${file.name}" se guardó en el explorador.`, 'Explorador');
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      navigateTo(item.id);
    } else {
      if (item.extension === 'txt' || !item.extension) {
        openApp('notepad', { initialFileId: item.id, initialTitle: item.name, initialContent: item.content });
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'wav', 'mp4'].includes(item.extension?.toLowerCase() || '')) {
        openApp('mediaplayer', { fileUrl: item.content, fileName: item.name });
      } else {
        openApp('notepad', { initialFileId: item.id, initialTitle: item.name, initialContent: item.content });
      }
    }
  };

  // Filter items by search
  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Current folder display name
  const currentFolder = currentFolderId ? FileSystemService.getItemById(currentFolderId) : null;
  const currentFolderName = currentFolder ? currentFolder.name : 'Este Equipo';

  const selectedItem = selectedItemId ? FileSystemService.getItemById(selectedItemId) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs overflow-hidden select-none">
      {/* Hidden file input for upload */}
      <input
        ref={fileUploadInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Ribbon / Toolbar */}
      <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/60 overflow-x-auto">
        <button
          onClick={handleCreateFolder}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 transition-colors"
          title="Nueva carpeta"
        >
          <FolderPlus size={15} className="text-amber-500" />
          <span className="font-medium whitespace-nowrap">Nueva carpeta</span>
        </button>

        <button
          onClick={handleCreateFile}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 transition-colors"
          title="Nuevo archivo de texto"
        >
          <FilePlus size={15} className="text-blue-500" />
          <span className="font-medium whitespace-nowrap">Nuevo archivo</span>
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

        <button
          onClick={() => fileUploadInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 transition-colors"
          title="Cargar archivo desde tu computadora"
        >
          <Upload size={15} className="text-emerald-500" />
          <span className="font-medium whitespace-nowrap">Subir archivo</span>
        </button>

        {selectedItemId && (
          <>
            <button
              onClick={() => {
                setRenamingId(selectedItemId);
                setRenameValue(selectedItem?.name || '');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 transition-colors"
              title="Cambiar nombre"
            >
              <Edit2 size={15} className="text-blue-400" />
              <span className="font-medium whitespace-nowrap">Renombrar</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 active:bg-red-100 transition-colors"
              title="Mover a la papelera"
            >
              <Trash2 size={15} />
              <span className="font-medium whitespace-nowrap">Eliminar</span>
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={viewMode === 'grid' ? 'Cambiar a vista de lista' : 'Cambiar a vista de cuadrícula'}
          >
            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation / Address / Search Bar */}
      <div className="flex items-center gap-2 p-2 bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-0.5">
          <button
            onClick={goBack}
            disabled={historyIndex <= 0}
            className={`p-1.5 rounded-md ${historyIndex <= 0 ? 'opacity-30' : 'hover:bg-white dark:hover:bg-slate-700'}`}
            title="Atrás"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 rounded-md ${historyIndex >= history.length - 1 ? 'opacity-30' : 'hover:bg-white dark:hover:bg-slate-700'}`}
            title="Adelante"
          >
            <ArrowRight size={14} />
          </button>
          <button
            onClick={goUp}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700"
            title="Subir de nivel"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => loadFolder(currentFolderId)}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700"
            title="Actualizar"
          >
            <RotateCw size={13} />
          </button>
        </div>

        {/* Breadcrumb Path Bar */}
        <div className="flex-1 flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md shadow-inner truncate">
          <HardDrive size={13} className="text-blue-500 shrink-0" />
          <span className="text-slate-400">/</span>
          <span className="font-medium truncate">{currentFolderName}</span>
        </div>

        {/* Search Bar */}
        <div className="relative w-48 shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Buscar en ${currentFolderName}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 shrink-0 bg-slate-100/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 p-2 overflow-y-auto space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase px-2 py-1 tracking-wider">
            Acceso Rápido
          </div>

          <button
            onClick={() => navigateTo('folder_desktop')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors ${
              currentFolderId === 'folder_desktop'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Monitor size={15} className="text-blue-500" />
            <span>Escritorio</span>
          </button>

          <button
            onClick={() => navigateTo('folder_documents')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors ${
              currentFolderId === 'folder_documents'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={15} className="text-amber-500" />
            <span>Documentos</span>
          </button>

          <button
            onClick={() => navigateTo('folder_downloads')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors ${
              currentFolderId === 'folder_downloads'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Download size={15} className="text-green-500" />
            <span>Descargas</span>
          </button>

          <button
            onClick={() => navigateTo('folder_pictures')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors ${
              currentFolderId === 'folder_pictures'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <ImageIcon size={15} className="text-indigo-500" />
            <span>Imágenes</span>
          </button>

          <button
            onClick={() => navigateTo('folder_music')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors ${
              currentFolderId === 'folder_music'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Music size={15} className="text-pink-500" />
            <span>Música</span>
          </button>

          <div className="pt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase px-2 py-1 tracking-wider">
            Este Equipo
          </div>

          <button
            onClick={() => navigateTo(null)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-colors ${
              currentFolderId === null
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <HardDrive size={15} className="text-slate-500" />
            <span>Disco Local (C:)</span>
          </button>

          <button
            onClick={() => openApp('recyclebin')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 size={15} className="text-slate-500" />
            <span>Papelera de reciclaje</span>
          </button>
        </div>

        {/* Files Grid / List View */}
        <div
          className="flex-1 p-3 overflow-y-auto bg-white dark:bg-slate-900"
          onClick={() => setSelectedItemId(null)}
        >
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
              <Folder size={44} className="stroke-[1.2] opacity-40" />
              <p className="text-sm">Esta carpeta está vacía</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
              {filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const isItemRenaming = renamingId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItemId(item.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleItemDoubleClick(item);
                    }}
                    className={`flex flex-col items-center justify-start p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-400/50 shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="p-1 mb-1">
                      <AppIcon
                        name={item.type === 'folder' ? 'folder' : 'file-text'}
                        size={38}
                      />
                    </div>

                    <div className="w-full text-center">
                      {isItemRenaming ? (
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={handleFinishRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFinishRename();
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="w-full text-center bg-white dark:bg-slate-800 border border-blue-500 rounded px-1 py-0.5 text-xs outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="block truncate text-[11.5px] leading-tight" title={item.name}>
                          {item.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
                    <th className="pb-1.5 pl-2">Nombre</th>
                    <th className="pb-1.5">Fecha de modificación</th>
                    <th className="pb-1.5">Tipo</th>
                    <th className="pb-1.5 pr-2 text-right">Tamaño</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(item.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleItemDoubleClick(item);
                        }}
                        className={`cursor-pointer rounded border-b border-slate-100 dark:border-slate-800/40 text-[12px] ${
                          isSelected
                            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-1.5 pl-2 flex items-center gap-2">
                          <AppIcon name={item.type === 'folder' ? 'folder' : 'file-text'} size={18} />
                          <span className="truncate max-w-[240px]">{item.name}</span>
                        </td>
                        <td className="py-1.5 text-slate-500 dark:text-slate-400">
                          {new Date(item.updatedAt).toLocaleDateString()} {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-1.5 text-slate-500 dark:text-slate-400">
                          {item.type === 'folder' ? 'Carpeta de archivos' : `${item.extension?.toUpperCase() || 'TXT'} Archivo`}
                        </td>
                        <td className="py-1.5 pr-2 text-right text-slate-500 dark:text-slate-400 font-mono">
                          {item.size ? `${item.size} B` : item.type === 'folder' ? '-' : '0 B'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
        <div>
          {filteredItems.length} elementos
          {selectedItem && (
            <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">
              1 elemento seleccionado ({selectedItem.size ? `${selectedItem.size} bytes` : 'Carpeta'})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Sistema de archivos virtual de Windows 11</span>
        </div>
      </div>
    </div>
  );
};
