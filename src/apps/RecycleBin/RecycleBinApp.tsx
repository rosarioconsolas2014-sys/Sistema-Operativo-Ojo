import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { FileItem } from '../../types/os';
import { FileSystemService } from '../../services/fileSystemService';
import { AppIcon } from '../../components/UI/AppIcon';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  XCircle,
  Folder,
} from 'lucide-react';

export const RecycleBinApp: React.FC = () => {
  const { refreshFiles, addNotification } = useOS();

  const [items, setItems] = useState<FileItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadItems = () => {
    setItems(FileSystemService.getRecycleBinItems());
    setSelectedId(null);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleRestore = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    FileSystemService.restoreFromRecycleBin(id);
    loadItems();
    refreshFiles();
    addNotification('Elemento restaurado', `"${item.name}" se restauró a su ubicación original`, 'Papelera');
  };

  const handleDeletePermanent = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (confirm(`¿Está seguro de que desea eliminar definitivamente "${item.name}"?`)) {
      FileSystemService.deletePermanently(id);
      loadItems();
      refreshFiles();
      addNotification('Eliminado permanentemente', `"${item.name}" ha sido borrado del disco.`, 'Papelera');
    }
  };

  const handleEmptyRecycleBin = () => {
    if (items.length === 0) return;
    if (confirm('¿Desea vaciar todos los elementos de la Papelera de reciclaje? Esta acción no se puede deshacer.')) {
      FileSystemService.emptyRecycleBin();
      loadItems();
      refreshFiles();
      addNotification('Papelera vaciada', 'Todos los elementos han sido eliminados de forma definitiva.', 'Papelera');
    }
  };

  const totalBytes = items.reduce((acc, curr) => acc + (curr.size || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none text-xs">
      {/* Ribbon / Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80">
        <button
          onClick={handleEmptyRecycleBin}
          disabled={items.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 disabled:opacity-40 font-medium transition-colors"
        >
          <Trash2 size={15} />
          <span>Vaciar papelera de reciclaje</span>
        </button>

        {selectedId && (
          <>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
            <button
              onClick={() => handleRestore(selectedId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
            >
              <RotateCcw size={15} className="text-blue-500" />
              <span>Restaurar este elemento</span>
            </button>
            <button
              onClick={() => handleDeletePermanent(selectedId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 font-medium transition-colors"
            >
              <XCircle size={15} />
              <span>Eliminar definitivamente</span>
            </button>
          </>
        )}

        <div className="ml-auto text-slate-500 text-[11px]">
          {items.length} elemento{items.length !== 1 ? 's' : ''} ({totalBytes} bytes)
        </div>
      </div>

      {/* Items list */}
      <div
        className="flex-1 p-3 overflow-y-auto bg-white dark:bg-slate-900"
        onClick={() => setSelectedId(null)}
      >
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
            <Trash2 size={48} className="stroke-[1.2] opacity-30" />
            <p className="text-sm">La papelera de reciclaje está vacía</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
                <th className="pb-1.5 pl-2">Nombre</th>
                <th className="pb-1.5">Ubicación original</th>
                <th className="pb-1.5">Fecha de eliminación</th>
                <th className="pb-1.5 pr-2 text-right">Tamaño</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(item.id);
                    }}
                    onDoubleClick={() => handleRestore(item.id)}
                    className={`cursor-pointer rounded border-b border-slate-100 dark:border-slate-800/40 text-[12px] transition-colors ${
                      isSelected
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2 pl-2 flex items-center gap-2">
                      <AppIcon name={item.type === 'folder' ? 'folder' : 'file-text'} size={18} />
                      <span className="font-medium truncate max-w-xs">{item.name}</span>
                    </td>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {item.path}
                    </td>
                    <td className="py-2 text-slate-500 dark:text-slate-400">
                      {new Date(item.updatedAt).toLocaleDateString()} {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 pr-2 text-right text-slate-500 dark:text-slate-400 font-mono">
                      {item.size ? `${item.size} B` : item.type === 'folder' ? '-' : '0 B'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
        <span>Haga doble clic en un elemento para restaurarlo inmediatamente.</span>
        <span>Papelera de reciclaje</span>
      </div>
    </div>
  );
};
