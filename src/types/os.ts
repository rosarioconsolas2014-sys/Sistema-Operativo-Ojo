export type WindowState = 'normal' | 'minimized' | 'maximized';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowItem {
  id: string;
  appId: string;
  title: string;
  icon: string;
  state: WindowState;
  position: WindowPosition;
  size: WindowSize;
  prevPosition?: WindowPosition;
  prevSize?: WindowSize;
  zIndex: number;
  meta?: Record<string, any>;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string; // Lucide icon or custom key
  category: 'productivity' | 'system' | 'utilities' | 'media';
  defaultSize: WindowSize;
  minSize: WindowSize;
  allowMultiple: boolean;
  description: string;
  pinnedToTaskbar?: boolean;
  pinnedToStart?: boolean;
}

export type FileType = 'folder' | 'file';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  path: string;
  content?: string;
  extension?: string;
  size?: number; // in bytes
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  isSystem?: boolean;
  icon?: string;
}

export type WallpaperType = 'image' | 'solid' | 'gradient';

export interface OSSettings {
  wallpaper: {
    type: WallpaperType;
    value: string;
    fit: 'cover' | 'contain' | 'tile';
  };
  theme: 'light' | 'dark';
  accentColor: string;
  windowTransparency: boolean;
  acrylicIntensity: number; // 0-100
  iconSize: 'small' | 'medium' | 'large';
  showIconLabels: boolean;
  autoArrangeIcons: boolean;
  taskbarAlignment: 'center' | 'left';
  showSearchInTaskbar: boolean;
  showWidgets: boolean;
  soundVolume: number;
  brightness: number;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  airplaneMode: boolean;
  nightLight: boolean;
  batterySaver: boolean;
  doNotDisturb: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  color: string;
  description?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  appName: string;
  icon?: string;
  read: boolean;
}

export interface ContextMenuOption {
  id: string;
  label: string;
  icon?: any;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
  submenu?: ContextMenuOption[];
}

export type PowerState = 'normal' | 'locked' | 'restarting' | 'sleep' | 'shutdown';
