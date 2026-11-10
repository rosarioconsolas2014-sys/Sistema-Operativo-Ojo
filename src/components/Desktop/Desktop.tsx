import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { DesktopIcon } from './DesktopIcon';
import { ContextMenu } from './ContextMenu';
import { ContextMenuOption } from '../../types/os';
import { FileSystemService } from '../../services/fileSystemService';
import {
  Eye,
  ArrowUpDown,
  RefreshCw,
  Plus,
  FolderPlus,
  FilePlus,
  Monitor,
  Sparkles,
} from 'lucide-react';

interface IconPosMap {
  [id: string]: { x: number; y: number };
}

const DESKTOP_ICON_POS_KEY = 'win11_desktop_icon_positions_v1';

export const Desktop: React.FC = () => {
  const {
    settings,
    updateSettings,
    desktopFiles,
    refreshFiles,
    openContextMenu,
    setSelectedDesktopIconIds,
    openApp,
    addNotification,
    desktopSortBy,
    setDesktopSortBy,
    iconPositions,
    handleIconMove,
  } = useOS();

  // Marquee selection box
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null>(null);

  const desktopRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only left click on empty background
    if (e.button !== 0 || e.target !== desktopRef.current) return;
    setSelectedDesktopIconIds([]);
    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isSelecting: true,
    });
  };

  useEffect(() => {
    if (!selectionBox?.isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      setSelectionBox(prev => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));
    };

    const handleMouseUp = () => {
      setSelectionBox(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectionBox?.isSelecting]);

  // Context Menu on Desktop empty space
  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    if (e.target !== desktopRef.current && (e.target as HTMLElement).id !== 'desktop-icons-area') {
      return;
    }

    const options: ContextMenuOption[] = [
      {
        id: 'view',
        label: 'Ver',
        icon: <Eye size={14} />,
        submenu: [
          {
            id: 'v_large',
            label: `${settings.iconSize === 'large' ? '✓ ' : '  '}Iconos grandes`,
            action: () => updateSettings({ iconSize: 'large' }),
          },
          {
            id: 'v_med',
            label: `${settings.iconSize === 'medium' ? '✓ ' : '  '}Iconos medianos`,
            action: () => updateSettings({ iconSize: 'medium' }),
          },
          {
            id: 'v_small',
            label: `${settings.iconSize === 'small' ? '✓ ' : '  '}Iconos pequeños`,
            action: () => updateSettings({ iconSize: 'small' }),
          },
          { divider: true, id: 'd_v1', label: '' },
          {
            id: 'v_auto',
            label: `${settings.autoArrangeIcons ? '✓ ' : '  '}Organizar iconos automáticamente`,
            action: () => updateSettings({ autoArrangeIcons: !settings.autoArrangeIcons }),
          },
          {
            id: 'v_labels',
            label: `${settings.showIconLabels ? '✓ ' : '  '}Mostrar nombres de iconos`,
            action: () => updateSettings({ showIconLabels: !settings.showIconLabels }),
          },
        ],
      },
      {
        id: 'sort',
        label: 'Ordenar por',
        icon: <ArrowUpDown size={14} />,
        submenu: [
          {
            id: 's_name',
            label: `${desktopSortBy === 'name' ? '✓ ' : '  '}Nombre`,
            action: () => setDesktopSortBy('name'),
          },
          {
            id: 's_type',
            label: `${desktopSortBy === 'type' ? '✓ ' : '  '}Tipo de elemento`,
            action: () => setDesktopSortBy('type'),
          },
          {
            id: 's_date',
            label: `${desktopSortBy === 'date' ? '✓ ' : '  '}Fecha de modificación`,
            action: () => setDesktopSortBy('date'),
          },
        ],
      },
      {
        id: 'refresh',
        label: 'Actualizar',
        icon: <RefreshCw size={14} />,
        action: () => {
          refreshFiles();
          addNotification('Escritorio actualizado', 'Vista de iconos sincronizada.', 'Escritorio');
        },
      },
      { divider: true, id: 'd_desk_1', label: '' },
      {
        id: 'new',
        label: 'Nuevo',
        icon: <Plus size={14} />,
        submenu: [
          {
            id: 'new_folder',
            label: 'Carpeta',
            icon: <FolderPlus size={14} className="text-amber-500" />,
            action: () => {
              FileSystemService.createFolder('folder_desktop', 'Nueva carpeta');
              refreshFiles();
              addNotification('Carpeta creada', 'Se ha creado "Nueva carpeta" en el escritorio.', 'Explorador');
            },
          },
          {
            id: 'new_file',
            label: 'Documento de texto',
            icon: <FilePlus size={14} className="text-blue-500" />,
            action: () => {
              FileSystemService.createFile('folder_desktop', 'Nuevo documento de texto', '', 'txt');
              refreshFiles();
              addNotification('Archivo creado', 'Se ha creado "Nuevo documento de texto.txt"', 'Explorador');
            },
          },
        ],
      },
      { divider: true, id: 'd_desk_2', label: '' },
      {
        id: 'display',
        label: 'Configuración de pantalla',
        icon: <Monitor size={14} />,
        action: () => openApp('settings', { tab: 'display' }),
      },
      {
        id: 'personalize',
        label: 'Personalizar',
        icon: <Sparkles size={14} />,
        action: () => openApp('settings', { tab: 'personalization' }),
      },
    ];

    openContextMenu(e, options);
  };

  // Base system apps on desktop
  const systemDesktopApps = [
    { id: 'app_explorer', name: 'Este Equipo', iconName: 'folder', appId: 'explorer' },
    { id: 'app_recyclebin', name: 'Papelera de reciclaje', iconName: 'trash-2', appId: 'recyclebin' },
    { id: 'app_browser', name: 'Microsoft Edge', iconName: 'globe', appId: 'browser' },
    { id: 'app_notepad', name: 'Bloc de notas', iconName: 'file-text', appId: 'notepad' },
    { id: 'app_calculator', name: 'Calculadora', iconName: 'calculator', appId: 'calculator' },
    { id: 'app_paint', name: 'Paint', iconName: 'palette', appId: 'paint' },
    { id: 'app_terminal', name: 'Terminal', iconName: 'terminal', appId: 'terminal' },
    { id: 'app_settings', name: 'Configuración', iconName: 'settings', appId: 'settings' },
  ];

  // Sorted user files
  const sortedFiles = [...desktopFiles].sort((a, b) => {
    if (desktopSortBy === 'name') return a.name.localeCompare(b.name);
    if (desktopSortBy === 'type') return a.type.localeCompare(b.type);
    if (desktopSortBy === 'date') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return 0;
  });

  // Calculate selection box geometry
  const boxStyles = selectionBox?.isSelecting
    ? {
        left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
        top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
        width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
        height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
      }
    : null;

  // Wallpaper styles
  const getWallpaperStyles = (): React.CSSProperties => {
    const { wallpaper } = settings;
    if (wallpaper.type === 'solid') {
      return { backgroundColor: wallpaper.value };
    }
    if (wallpaper.type === 'gradient') {
      return { background: wallpaper.value };
    }
    return {
      backgroundImage: `url(${wallpaper.value})`,
      backgroundSize: wallpaper.fit || 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: wallpaper.fit === 'tile' ? 'repeat' : 'no-repeat',
    };
  };

  return (
    <div
      ref={desktopRef}
      id="desktop-main"
      onMouseDown={handleMouseDown}
      onContextMenu={handleDesktopContextMenu}
      className="absolute inset-0 select-none overflow-hidden transition-all duration-500"
      style={getWallpaperStyles()}
    >
      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-black/20" />

      {/* Grid or freeform container of Desktop icons */}
      <div
        id="desktop-icons-area"
        className={`absolute inset-0 p-4 pb-16 ${
          settings.autoArrangeIcons
            ? 'flex flex-col flex-wrap content-start items-start gap-2 max-h-[calc(100vh-64px)]'
            : ''
        }`}
        onClick={() => setSelectedDesktopIconIds([])}
      >
        {/* System Apps */}
        {systemDesktopApps.map((app, index) => (
          <DesktopIcon
            key={app.id}
            id={app.id}
            name={app.name}
            iconName={app.iconName}
            isApp
            appId={app.appId}
            position={
              !settings.autoArrangeIcons
                ? iconPositions[app.id] || { x: 20, y: 20 + index * 96 }
                : undefined
            }
            onMove={handleIconMove}
          />
        ))}

        {/* User Desktop Files and Folders */}
        {sortedFiles.map((file, fIndex) => (
          <DesktopIcon
            key={file.id}
            id={file.id}
            name={file.name}
            iconName={file.type === 'folder' ? 'folder' : 'file-text'}
            fileItem={file}
            position={
              !settings.autoArrangeIcons
                ? iconPositions[file.id] || {
                    x: 120,
                    y: 20 + fIndex * 96,
                  }
                : undefined
            }
            onMove={handleIconMove}
          />
        ))}
      </div>

      {/* Rubber band selection box */}
      {selectionBox?.isSelecting && (
        <div
          className="absolute border border-blue-400 bg-blue-500/20 rounded pointer-events-none z-50 backdrop-blur-[1px]"
          style={boxStyles || {}}
        />
      )}

      {/* Context Menu Component */}
      <ContextMenu />
    </div>
  );
};
