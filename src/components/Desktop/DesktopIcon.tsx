import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { AppIcon } from '../UI/AppIcon';
import { FileItem, ContextMenuOption } from '../../types/os';
import { FileSystemService } from '../../services/fileSystemService';
import {
  ExternalLink,
  Edit2,
  Trash2,
  Info,
  Copy,
} from 'lucide-react';

interface DesktopIconProps {
  id: string;
  name: string;
  iconName: string;
  isApp?: boolean;
  appId?: string;
  fileItem?: FileItem;
  position?: { x: number; y: number };
  onMove?: (id: string, x: number, y: number) => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  name,
  iconName,
  isApp = false,
  appId,
  fileItem,
  position,
  onMove,
}) => {
  const {
    openApp,
    settings,
    openContextMenu,
    selectedDesktopIconIds,
    setSelectedDesktopIconIds,
    refreshFiles,
    addNotification,
  } = useOS();

  const [isRenaming, setIsRenaming] = useState(false);
  const [currentName, setCurrentName] = useState(name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Dragging icon state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState(position || { x: 0, y: 0 });

  const isSelected = selectedDesktopIconIds.includes(id);

  useEffect(() => {
    if (position) setCurrentPos(position);
  }, [position]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleOpen = () => {
    if (isApp && appId) {
      openApp(appId);
    } else if (fileItem) {
      if (fileItem.type === 'folder') {
        openApp('explorer', { initialFolderId: fileItem.id });
      } else if (fileItem.extension === 'txt' || !fileItem.extension) {
        openApp('notepad', { initialFileId: fileItem.id, initialContent: fileItem.content, initialTitle: fileItem.name });
      } else {
        openApp('explorer', { initialFolderId: fileItem.parentId });
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    setSelectedDesktopIconIds([id]);

    const options: ContextMenuOption[] = [
      {
        id: 'open',
        label: 'Abrir',
        icon: <ExternalLink size={14} />,
        action: handleOpen,
      },
      { divider: true, id: 'd1', label: '' },
      {
        id: 'rename',
        label: 'Cambiar nombre',
        icon: <Edit2 size={14} />,
        action: () => setIsRenaming(true),
      },
      {
        id: 'shortcut',
        label: 'Crear acceso directo',
        icon: <Copy size={14} />,
        action: () => {
          if (fileItem) {
            FileSystemService.createFile('folder_desktop', `Acceso directo a ${fileItem.name}.lnk`, `Shortcut -> ${fileItem.path}`, 'lnk');
            refreshFiles();
            addNotification('Acceso directo creado', `Se ha creado el acceso directo a "${fileItem.name}"`, 'Escritorio');
          } else {
            addNotification('Acceso directo', `Acceso directo creado para ${name}`, 'Escritorio');
          }
        },
      },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: <Trash2 size={14} className="text-red-500" />,
        action: () => {
          if (fileItem) {
            FileSystemService.moveToRecycleBin(fileItem.id);
            refreshFiles();
            addNotification('Elemento eliminado', `"${fileItem.name}" se movió a la papelera de reciclaje`, 'Papelera');
          } else {
            addNotification('Aviso del sistema', `No se pueden eliminar las aplicaciones del sistema.`, 'Sistema');
          }
        },
      },
      { divider: true, id: 'd2', label: '' },
      {
        id: 'props',
        label: 'Propiedades',
        icon: <Info size={14} />,
        action: () => {
          const info = fileItem
            ? `Tipo: ${fileItem.type === 'folder' ? 'Carpeta de archivos' : fileItem.extension?.toUpperCase() + ' Documento'}\nUbicación: ${fileItem.path}\nTamaño: ${fileItem.size ? `${fileItem.size} bytes` : '0 bytes'}\nModificado: ${new Date(fileItem.updatedAt).toLocaleString()}`
            : `Aplicación de Windows 11\nNombre: ${name}\nEstado: Sistema Integrado`;
          addNotification(`Propiedades de ${name}`, info, 'Propiedades');
        },
      },
    ];

    openContextMenu(e, options);
  };

  const handleFinishRename = () => {
    setIsRenaming(false);
    if (!currentName.trim()) {
      setCurrentName(name);
      return;
    }
    if (fileItem && currentName !== name) {
      FileSystemService.renameItem(fileItem.id, currentName.trim());
      refreshFiles();
      addNotification('Nombre actualizado', `Se renombró a "${currentName.trim()}"`, 'Explorador');
    }
  };

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isRenaming) return;
    setSelectedDesktopIconIds([id]);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
      setCurrentPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onMove) {
        onMove(id, currentPos.x, currentPos.y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, currentPos, id, onMove]);

  // Size styling
  const sizeClasses = {
    small: { box: 'w-18 py-1.5', icon: 34, text: 'text-[11px]' },
    medium: { box: 'w-22 py-2', icon: 44, text: 'text-[12px]' },
    large: { box: 'w-26 py-2.5', icon: 54, text: 'text-[13px]' },
  }[settings.iconSize];

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedDesktopIconIds([id]);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}
      onContextMenu={handleRightClick}
      className={`group flex flex-col items-center justify-start rounded-lg cursor-pointer transition-all ${sizeClasses.box} ${
        isSelected
          ? 'bg-blue-500/25 border border-blue-400/40 shadow-sm backdrop-blur-xs'
          : 'hover:bg-white/15 dark:hover:bg-white/10 border border-transparent'
      }`}
      style={
        settings.autoArrangeIcons
          ? {}
          : {
              position: 'absolute',
              left: `${currentPos.x}px`,
              top: `${currentPos.y}px`,
            }
      }
    >
      <div className="relative flex items-center justify-center p-1 drop-shadow-md transition-transform group-hover:scale-105 group-active:scale-95">
        <AppIcon name={iconName} size={sizeClasses.icon} />
      </div>

      {settings.showIconLabels && (
        <div className="mt-1 px-1.5 w-full text-center">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishRename();
                if (e.key === 'Escape') {
                  setCurrentName(name);
                  setIsRenaming(false);
                }
              }}
              className="w-full text-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-blue-500 rounded px-1 py-0.5 text-xs outline-none shadow-md"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={`block truncate leading-tight font-normal text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)] ${sizeClasses.text}`}
              title={name}
            >
              {name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
