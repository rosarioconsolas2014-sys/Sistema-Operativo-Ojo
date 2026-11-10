import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  WindowItem,
  OSSettings,
  SystemNotification,
  ContextMenuOption,
  PowerState,
  FileItem,
  WindowPosition,
  WindowSize,
} from '../types/os';
import { APPS_REGISTRY } from '../apps/registry';
import { FileSystemService } from '../services/fileSystemService';
import { auth, signOutUser, testConnection } from '../services/firebase';
import { syncService, SyncStatus } from '../services/firebaseSyncService';
import { onAuthStateChanged, User } from 'firebase/auth';

const SETTINGS_STORAGE_KEY = 'win11_settings_v1';
const NOTIFICATIONS_STORAGE_KEY = 'win11_notifications_v1';
const DESKTOP_ICON_POS_KEY = 'win11_desktop_icon_positions_v1';

export interface WallpaperPreset {
  id: string;
  name: string;
  category: 'tecnologia' | 'santa_fe' | 'windows';
  url?: string;
  gradient?: string;
  theme: 'light' | 'dark';
  description?: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  // --- TECNOLOGÍA E INNOVACIÓN ---
  {
    id: 'tech_circuits',
    name: 'Circuitos y Microchips',
    category: 'tecnologia',
    url: '/src/assets/images/tech_circuits_wallpaper_1794315652439.jpg',
    theme: 'dark',
    description: 'Tecnología digital, microprocesadores y circuitos integrados',
  },
  {
    id: 'tech_ai',
    name: 'Inteligencia Artificial y Redes',
    category: 'tecnologia',
    url: '/src/assets/images/ai_neural_wallpaper_1794315652942.jpg',
    theme: 'dark',
    description: 'Redes neuronales y algoritmos de inteligencia artificial',
  },
  {
    id: 'tech_cybersecurity',
    name: 'Ciberseguridad y Escudo Digital',
    category: 'tecnologia',
    url: '/src/assets/images/cyber_security_wallpaper_1794315652612.jpg',
    theme: 'dark',
    description: 'Criptografía, cortafuegos y seguridad de la información',
  },
  {
    id: 'tech_software',
    name: 'Código y Desarrollo de Software',
    category: 'tecnologia',
    url: '/src/assets/images/code_software_wallpaper_1794315665300.jpg',
    theme: 'dark',
    description: 'Programación moderna, código limpio y desarrollo de software',
  },
  {
    id: 'tech_datacenter',
    name: 'Datacenter y Servidores Cloud',
    category: 'tecnologia',
    url: '/src/assets/images/datacenter_servers_wallpaper_1794315708979.jpg',
    theme: 'dark',
    description: 'Infraestructura de servidores, nube y conectividad global',
  },
  {
    id: 'tech_smartcity',
    name: 'Ciudades Inteligentes y Conectividad',
    category: 'tecnologia',
    url: '/src/assets/images/smart_city_wallpaper_1794315665846.jpg',
    theme: 'dark',
    description: 'Transformación digital urbana e infraestructura inteligente',
  },
  {
    id: 'tech_datascience',
    name: 'Ciencia de Datos y Analytics',
    category: 'tecnologia',
    url: '/src/assets/images/data_science_wallpaper_1794315665999.jpg',
    theme: 'dark',
    description: 'Modelos de datos masivos, telemetría y visualización analítica',
  },
  {
    id: 'tech_monitoring',
    name: 'Centro de Monitoreo y Videovigilancia',
    category: 'tecnologia',
    url: '/src/assets/images/monitoring_center_wallpaper_1794315679864.jpg',
    theme: 'dark',
    description: 'Centro de operaciones de seguridad y respuesta tecnológica',
  },

  // --- GOBIERNO DE SANTA FE ---
  {
    id: 'sf_bandera',
    name: 'Colores de Santa Fe Institucional',
    category: 'santa_fe',
    url: '/src/assets/images/santafe_flag_wallpaper_1794315693381.jpg',
    theme: 'dark',
    description: 'Composición institucional inspirada en la bandera de la Provincia',
  },
  {
    id: 'sf_mapa',
    name: 'Santa Fe - Red Digital Provincial',
    category: 'santa_fe',
    url: '/src/assets/images/santafe_map_wallpaper_1794315695628.jpg',
    theme: 'dark',
    description: 'Geografía santafesina, nodos de telecomunicación y ciudades conectadas',
  },
  {
    id: 'sf_monumento',
    name: 'Monumento a la Bandera (Rosario)',
    category: 'santa_fe',
    url: '/src/assets/images/monumento_bandera_wallpaper_1794315679975.jpg',
    theme: 'light',
    description: 'El emblema patrio y arquitectónico más representativo de Rosario',
  },
  {
    id: 'sf_puente',
    name: 'Puente Rosario - Victoria',
    category: 'santa_fe',
    url: '/src/assets/images/puente_rosario_wallpaper_1794315679656.jpg',
    theme: 'dark',
    description: 'Puente atirantado sobre las aguas del Río Paraná al atardecer',
  },
  {
    id: 'sf_parana',
    name: 'Río Paraná y Humedales',
    category: 'santa_fe',
    url: '/src/assets/images/rio_parana_wallpaper_1794315695040.jpg',
    theme: 'light',
    description: 'Vista panorámica de la cuenca hídrica y naturaleza santafesina',
  },
  {
    id: 'sf_gobierno',
    name: 'Modernización del Estado Santafesino',
    category: 'santa_fe',
    url: '/src/assets/images/gobierno_moderno_wallpaper_1794315708711.jpg',
    theme: 'light',
    description: 'Gestión pública moderna, servicios digitales y arquitectura cívica',
  },

  // --- WINDOWS ORIGINALES ---
  {
    id: 'bloom_light',
    name: 'Windows 11 Bloom (Luz)',
    category: 'windows',
    url: '/src/assets/images/win11_bloom_light_1794310927808.jpg',
    theme: 'light',
    description: 'Fondo oficial claro de Windows 11',
  },
  {
    id: 'bloom_dark',
    name: 'Windows 11 Bloom (Oscuro)',
    category: 'windows',
    url: '/src/assets/images/win11_bloom_dark_1794310928656.jpg',
    theme: 'dark',
    description: 'Fondo oficial oscuro de Windows 11',
  },
  {
    id: 'sunrise',
    name: 'Amanecer en las Montañas',
    category: 'windows',
    url: '/src/assets/images/win11_sunrise_landscape_1794310929885.jpg',
    theme: 'light',
    description: 'Fotografía escénica de naturaleza y luz solar',
  },
  {
    id: 'grad_fluent',
    name: 'Degradado Fluent Azul',
    category: 'windows',
    gradient: 'linear-gradient(135deg, #091e3a 0%, #2f80ed 50%, #2d9cdb 100%)',
    theme: 'dark',
    description: 'Gradiente azul moderno de estética fluida',
  },
  {
    id: 'grad_sunset',
    name: 'Atardecer Púrpura',
    category: 'windows',
    gradient: 'linear-gradient(135deg, #2b1055 0%, #7597de 100%)',
    theme: 'dark',
    description: 'Gradiente púrpura crepuscular suave',
  },
];

const DEFAULT_SETTINGS: OSSettings = {
  wallpaper: {
    type: 'image',
    value: '/src/assets/images/win11_bloom_light_1794310927808.jpg',
    fit: 'cover',
  },
  theme: 'light',
  accentColor: '#0078d4', // Windows Blue
  windowTransparency: true,
  acrylicIntensity: 85,
  iconSize: 'medium',
  showIconLabels: true,
  autoArrangeIcons: true,
  taskbarAlignment: 'center',
  showSearchInTaskbar: true,
  showWidgets: true,
  soundVolume: 80,
  brightness: 100,
  wifiEnabled: true,
  bluetoothEnabled: true,
  airplaneMode: false,
  nightLight: false,
  batterySaver: false,
  doNotDisturb: false,
};

interface OSContextType {
  // Auth & Sync
  currentUser: User | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;

  windows: WindowItem[];
  activeWindowId: string | null;
  openApp: (appId: string, meta?: Record<string, any>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  updateWindowPosition: (id: string, position: WindowPosition) => void;
  updateWindowSize: (id: string, size: WindowSize) => void;

  settings: OSSettings;
  updateSettings: (partial: Partial<OSSettings>) => void;
  resetAllSettings: () => void;

  notifications: SystemNotification[];
  addNotification: (title: string, message: string, appName: string, icon?: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  startMenuOpen: boolean;
  toggleStartMenu: () => void;
  setStartMenuOpen: (open: boolean) => void;

  quickSettingsOpen: boolean;
  toggleQuickSettings: () => void;
  setQuickSettingsOpen: (open: boolean) => void;

  calendarFlyoutOpen: boolean;
  toggleCalendarFlyout: () => void;
  setCalendarFlyoutOpen: (open: boolean) => void;

  searchFlyoutOpen: boolean;
  toggleSearchFlyout: () => void;
  setSearchFlyoutOpen: (open: boolean) => void;

  powerState: PowerState;
  setPowerState: (state: PowerState) => void;

  desktopFiles: FileItem[];
  refreshFiles: () => void;

  contextMenu: {
    isOpen: boolean;
    x: number;
    y: number;
    options: ContextMenuOption[];
  };
  openContextMenu: (e: React.MouseEvent, options: ContextMenuOption[]) => void;
  closeContextMenu: () => void;

  selectedDesktopIconIds: string[];
  setSelectedDesktopIconIds: (ids: string[]) => void;
  desktopSortBy: 'name' | 'type' | 'date';
  setDesktopSortBy: (sort: 'name' | 'type' | 'date') => void;

  iconPositions: Record<string, { x: number; y: number }>;
  handleIconMove: (id: string, x: number, y: number) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Settings
  const [settings, setSettings] = useState<OSSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error reading settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Windows State
  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [topZIndex, setTopZIndex] = useState<number>(100);

  // Desktop files
  const [desktopFiles, setDesktopFiles] = useState<FileItem[]>(() =>
    FileSystemService.getDesktopItems()
  );
  const [selectedDesktopIconIds, setSelectedDesktopIconIds] = useState<string[]>([]);
  const [desktopSortBy, setDesktopSortBy] = useState<'name' | 'type' | 'date'>('name');

  // Desktop Icon Positions
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const stored = localStorage.getItem(DESKTOP_ICON_POS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading notifications from localStorage:', e);
    }
    return [
      {
        id: 'notif_welcome',
        title: '¡Bienvenido a Windows 11!',
        message: 'Explora el nuevo menú de inicio, ventanas flotantes y tus aplicaciones favoritas.',
        time: 'Hace un momento',
        appName: 'Sistema',
        read: false,
      },
    ];
  });

  // Flyouts
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [calendarFlyoutOpen, setCalendarFlyoutOpen] = useState(false);
  const [searchFlyoutOpen, setSearchFlyoutOpen] = useState(false);

  // Power state
  const [powerState, setPowerState] = useState<PowerState>('normal');

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    options: ContextMenuOption[];
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    options: [],
  });

  // Test connection to Firestore on initial load
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to sync status
  useEffect(() => {
    return syncService.onSyncStatusChange(setSyncStatus);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setIsAuthModalOpen(false);
        FileSystemService.setCurrentUserId(user.uid);

        // Load data from Firestore
        const cloudData = await syncService.loadUserData(user.uid);
        if (cloudData) {
          if (cloudData.settings) {
            setSettings(cloudData.settings);
          } else {
            // First time user: save initial settings
            syncService.saveSettings(user.uid, settings);
          }

          if (cloudData.iconPositions) {
            setIconPositions(cloudData.iconPositions);
          }
          if (cloudData.desktopSortBy) {
            setDesktopSortBy(cloudData.desktopSortBy);
          }

          if (cloudData.files && cloudData.files.length > 0) {
            FileSystemService.setStoredFiles(cloudData.files);
            setDesktopFiles(FileSystemService.getDesktopItems());
          } else {
            // First time user: upload initial default files
            const initialFiles = FileSystemService.getAllFiles();
            syncService.saveAllFiles(user.uid, initialFiles);
          }
        }
      } else {
        FileSystemService.setCurrentUserId(null);
        setDesktopFiles(FileSystemService.getDesktopItems());
      }
    });

    return () => unsubscribe();
  }, []);

  // Update theme class on document.documentElement
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Persist settings
  const updateSettings = useCallback((partial: Partial<OSSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving settings:', e);
      }
      if (currentUser) {
        syncService.saveSettings(currentUser.uid, updated);
      }
      return updated;
    });
  }, [currentUser]);

  // Handle icon move
  const handleIconMove = useCallback((id: string, x: number, y: number) => {
    setIconPositions(prev => {
      const next = { ...prev, [id]: { x, y } };
      try {
        localStorage.setItem(DESKTOP_ICON_POS_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      if (currentUser) {
        syncService.saveDesktopLayout(currentUser.uid, next, desktopSortBy);
      }
      return next;
    });
  }, [currentUser, desktopSortBy]);

  const handleSetDesktopSortBy = useCallback((sortBy: 'name' | 'type' | 'date') => {
    setDesktopSortBy(sortBy);
    if (currentUser) {
      syncService.saveDesktopLayout(currentUser.uid, iconPositions, sortBy);
    }
  }, [currentUser, iconPositions]);

  const resetAllSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      FileSystemService.resetToDefault();
    } catch (e) {
      console.error(e);
    }
    const defFiles = FileSystemService.getDesktopItems();
    setDesktopFiles(defFiles);
    if (currentUser) {
      syncService.saveSettings(currentUser.uid, DEFAULT_SETTINGS);
      syncService.saveAllFiles(currentUser.uid, FileSystemService.getAllFiles());
    }
    addNotification('Configuración restablecida', 'Se han restaurado los valores de fábrica con éxito.', 'Configuración');
  }, [currentUser]);

  const logout = useCallback(async () => {
    await signOutUser();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
    addNotification('Sesión finalizada', 'Has cerrado sesión correctamente.', 'Seguridad');
  }, []);

  // Notifications logic
  const addNotification = useCallback((title: string, message: string, appName: string, icon?: string) => {
    const newNotif: SystemNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      time: 'Ahora',
      appName,
      icon,
      read: false,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshFiles = useCallback(() => {
    const updated = FileSystemService.getDesktopItems();
    setDesktopFiles(updated);
    if (currentUser) {
      // Keep Firestore in sync
      const allFiles = FileSystemService.getAllFiles();
      syncService.saveAllFiles(currentUser.uid, allFiles);
    }
  }, [currentUser]);

  // Close menus on global click outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(prev => (prev.isOpen ? { ...prev, isOpen: false } : prev));
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Context menu trigger
  const openContextMenu = useCallback((e: React.MouseEvent, options: ContextMenuOption[]) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 240;
    const menuHeight = options.length * 36 + 20;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight - 50) {
      y = window.innerHeight - 50 - menuHeight;
    }

    setContextMenu({
      isOpen: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      options,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Bring window to front
  const bringToFront = useCallback((id: string) => {
    setTopZIndex(prev => {
      const nextZ = prev + 1;
      setWindows(curr =>
        curr.map(w => (w.id === id ? { ...w, zIndex: nextZ, state: w.state === 'minimized' ? 'normal' : w.state } : w))
      );
      return nextZ;
    });
    setActiveWindowId(id);
  }, []);

  // Open App
  const openApp = useCallback((appId: string, meta?: Record<string, any>) => {
    const appDef = APPS_REGISTRY[appId];
    if (!appDef) return;

    setStartMenuOpen(false);
    setSearchFlyoutOpen(false);

    if (!appDef.allowMultiple) {
      const existing = windows.find(w => w.appId === appId);
      if (existing) {
        if (existing.state === 'minimized') {
          restoreWindow(existing.id);
        } else {
          bringToFront(existing.id);
        }
        return;
      }
    }

    const offset = (windows.length % 6) * 28;
    const defaultX = Math.max(40, Math.min(window.innerWidth - appDef.defaultSize.width - 40, 80 + offset));
    const defaultY = Math.max(30, Math.min(window.innerHeight - appDef.defaultSize.height - 80, 50 + offset));

    setTopZIndex(prev => {
      const newZ = prev + 1;
      const newWindow: WindowItem = {
        id: `win_${appId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        appId,
        title: meta?.customTitle || appDef.name,
        icon: appDef.icon,
        state: 'normal',
        position: { x: defaultX, y: defaultY },
        size: { ...appDef.defaultSize },
        zIndex: newZ,
        meta,
      };

      setWindows(curr => [...curr, newWindow]);
      setActiveWindowId(newWindow.id);
      return newZ;
    });
  }, [windows, bringToFront]);

  // Close window
  const closeWindow = useCallback((id: string) => {
    setWindows(curr => {
      const next = curr.filter(w => w.id !== id);
      if (activeWindowId === id) {
        const sorted = [...next].filter(w => w.state !== 'minimized').sort((a, b) => b.zIndex - a.zIndex);
        setActiveWindowId(sorted.length > 0 ? sorted[0].id : null);
      }
      return next;
    });
  }, [activeWindowId]);

  // Minimize window
  const minimizeWindow = useCallback((id: string) => {
    setWindows(curr =>
      curr.map(w => (w.id === id ? { ...w, state: 'minimized' } : w))
    );
    if (activeWindowId === id) {
      const visible = windows.filter(w => w.id !== id && w.state !== 'minimized').sort((a, b) => b.zIndex - a.zIndex);
      setActiveWindowId(visible.length > 0 ? visible[0].id : null);
    }
  }, [activeWindowId, windows]);

  // Maximize window
  const maximizeWindow = useCallback((id: string) => {
    setWindows(curr =>
      curr.map(w => {
        if (w.id === id) {
          if (w.state === 'maximized') {
            return {
              ...w,
              state: 'normal',
              position: w.prevPosition || w.position,
              size: w.prevSize || w.size,
            };
          } else {
            return {
              ...w,
              state: 'maximized',
              prevPosition: w.position,
              prevSize: w.size,
            };
          }
        }
        return w;
      })
    );
    bringToFront(id);
  }, [bringToFront]);

  // Restore window
  const restoreWindow = useCallback((id: string) => {
    setWindows(curr =>
      curr.map(w => (w.id === id ? { ...w, state: 'normal' } : w))
    );
    bringToFront(id);
  }, [bringToFront]);

  // Update position
  const updateWindowPosition = useCallback((id: string, position: WindowPosition) => {
    setWindows(curr =>
      curr.map(w => (w.id === id ? { ...w, position } : w))
    );
  }, []);

  // Update size
  const updateWindowSize = useCallback((id: string, size: WindowSize) => {
    setWindows(curr =>
      curr.map(w => (w.id === id ? { ...w, size } : w))
    );
  }, []);

  // Flyout toggles
  const toggleStartMenu = useCallback(() => {
    setStartMenuOpen(p => !p);
    setQuickSettingsOpen(false);
    setCalendarFlyoutOpen(false);
    setSearchFlyoutOpen(false);
  }, []);

  const toggleQuickSettings = useCallback(() => {
    setQuickSettingsOpen(p => !p);
    setStartMenuOpen(false);
    setCalendarFlyoutOpen(false);
    setSearchFlyoutOpen(false);
  }, []);

  const toggleCalendarFlyout = useCallback(() => {
    setCalendarFlyoutOpen(p => !p);
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    setSearchFlyoutOpen(false);
  }, []);

  const toggleSearchFlyout = useCallback(() => {
    setSearchFlyoutOpen(p => !p);
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    setCalendarFlyoutOpen(false);
  }, []);

  return (
    <OSContext.Provider
      value={{
        currentUser,
        authLoading,
        syncStatus,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        logout,

        windows,
        activeWindowId,
        openApp,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,

        settings,
        updateSettings,
        resetAllSettings,

        notifications,
        addNotification,
        removeNotification,
        clearNotifications,

        startMenuOpen,
        toggleStartMenu,
        setStartMenuOpen,

        quickSettingsOpen,
        toggleQuickSettings,
        setQuickSettingsOpen,

        calendarFlyoutOpen,
        toggleCalendarFlyout,
        setCalendarFlyoutOpen,

        searchFlyoutOpen,
        toggleSearchFlyout,
        setSearchFlyoutOpen,

        powerState,
        setPowerState,

        desktopFiles,
        refreshFiles,

        contextMenu,
        openContextMenu,
        closeContextMenu,

        selectedDesktopIconIds,
        setSelectedDesktopIconIds,
        desktopSortBy,
        setDesktopSortBy: handleSetDesktopSortBy,

        iconPositions,
        handleIconMove,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
