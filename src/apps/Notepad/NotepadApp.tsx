import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { FileSystemService } from '../../services/fileSystemService';
import {
  FileText,
  Save,
  FolderOpen,
  FilePlus,
  Search,
  X,
  Type,
  Check,
  Download,
} from 'lucide-react';

interface NotepadProps {
  windowId: string;
  meta?: {
    initialFileId?: string;
    initialTitle?: string;
    initialContent?: string;
  };
}

export const NotepadApp: React.FC<NotepadProps> = ({ windowId, meta }) => {
  const { addNotification, refreshFiles, closeWindow } = useOS();

  const [fileId, setFileId] = useState<string | null>(meta?.initialFileId || null);
  const [fileName, setFileName] = useState<string>(meta?.initialTitle || 'Sin título.txt');
  const [content, setContent] = useState<string>(meta?.initialContent || '');
  const [originalContent, setOriginalContent] = useState<string>(meta?.initialContent || '');
  const [isDirty, setIsDirty] = useState(false);

  // Formatting options
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // Find dialog
  const [showFind, setShowFind] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cursor position
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsDirty(content !== originalContent);
  }, [content, originalContent]);

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;
    const lines = text.substring(0, selStart).split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const handleSave = () => {
    if (fileId) {
      FileSystemService.updateFileContent(fileId, content);
      setOriginalContent(content);
      setIsDirty(false);
      refreshFiles();
      addNotification('Archivo guardado', `Se guardaron los cambios en "${fileName}"`, 'Bloc de notas');
    } else {
      const newFile = FileSystemService.createFile('folder_desktop', fileName, content, 'txt');
      setFileId(newFile.id);
      setFileName(newFile.name);
      setOriginalContent(content);
      setIsDirty(false);
      refreshFiles();
      addNotification('Archivo guardado', `Se creó "${newFile.name}" en el Escritorio`, 'Bloc de notas');
    }
  };

  const handleSaveAs = () => {
    const inputName = prompt('Ingrese el nombre del archivo:', fileName);
    if (!inputName) return;
    const newFile = FileSystemService.createFile('folder_desktop', inputName, content, 'txt');
    setFileId(newFile.id);
    setFileName(newFile.name);
    setOriginalContent(content);
    setIsDirty(false);
    refreshFiles();
    addNotification('Guardado como', `Guardado como "${newFile.name}" en el Escritorio`, 'Bloc de notas');
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    addNotification('Descarga iniciada', `Descargando "${fileName}" a tu equipo`, 'Bloc de notas');
  };

  const handleNew = () => {
    if (isDirty) {
      if (!confirm('¿Desea descartar los cambios sin guardar?')) return;
    }
    setFileId(null);
    setFileName('Sin título.txt');
    setContent('');
    setOriginalContent('');
    setIsDirty(false);
  };

  const handleFindNext = () => {
    if (!searchQuery || !textareaRef.current) return;
    const index = content.toLowerCase().indexOf(searchQuery.toLowerCase(), textareaRef.current.selectionEnd);
    if (index !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + searchQuery.length);
    } else {
      // Loop from start
      const firstIndex = content.toLowerCase().indexOf(searchQuery.toLowerCase());
      if (firstIndex !== -1) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(firstIndex, firstIndex + searchQuery.length);
      } else {
        alert(`No se encontró "${searchQuery}"`);
      }
    }
  };

  const fontSizeClass = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
  }[fontSize];

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Menu Bar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/60 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Nuevo (Ctrl+N)"
          >
            <FilePlus size={13} />
            <span>Nuevo</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Guardar (Ctrl+S)"
          >
            <Save size={13} className={isDirty ? 'text-blue-500 font-bold' : ''} />
            <span className={isDirty ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}>
              Guardar{isDirty ? ' *' : ''}
            </span>
          </button>

          <button
            onClick={handleSaveAs}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span>Guardar como...</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Descargar archivo a tu PC"
          >
            <Download size={13} />
            <span>Descargar</span>
          </button>

          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

          <button
            onClick={() => setShowFind(!showFind)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
              showFind ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Search size={13} />
            <span>Buscar</span>
          </button>

          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
              wordWrap ? 'bg-slate-200/80 dark:bg-slate-700' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Ajuste de línea"
          >
            <Type size={13} />
            <span>Ajuste de línea</span>
          </button>

          {/* Font size picker */}
          <div className="flex items-center gap-1 ml-2 text-[11px] text-slate-500">
            <span>Fuente:</span>
            <button
              onClick={() => setFontSize('sm')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'sm' ? 'bg-blue-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'base' ? 'bg-blue-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-1.5 py-0.5 rounded ${fontSize === 'lg' ? 'bg-blue-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Floating Find Bar */}
      {showFind && (
        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-1 text-xs">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar texto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFindNext()}
            className="flex-1 max-w-xs px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleFindNext}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            Siguiente
          </button>
          <button
            onClick={() => setShowFind(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          spellCheck={false}
          className={`w-full h-full p-4 bg-transparent outline-none border-0 resize-none font-mono selection:bg-blue-500/30 dark:selection:bg-blue-500/50 ${fontSizeClass} ${
            wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
          }`}
          placeholder="Comienza a escribir aquí..."
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>{fileName}{isDirty ? ' (Modificado)' : ''}</span>
          <span>{content.length} caracteres</span>
        </div>
        <div className="flex items-center gap-5">
          <span>Lín. {cursorPos.line}, Col. {cursorPos.col}</span>
          <span>100%</span>
          <span>Windows (CRLF)</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
