import React from 'react';
import {
  Folder,
  FileText,
  Calculator,
  Globe,
  Activity,
  PlayCircle,
  Calendar,
  Palette,
  Terminal,
  Trash2,
  Settings,
  HelpCircle,
  File,
} from 'lucide-react';

interface AppIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const WindowsLogo: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M2.5 3.5h8.8v8.4H2.5zm9.8 0H21.5v8.4h-9.2zM2.5 12.9h8.8v8.4H2.5zm9.8 0H21.5v8.4h-9.2z" />
  </svg>
);

export const AppIcon: React.FC<AppIconProps> = ({ name, className = '', size = 24 }) => {
  switch (name) {
    case 'windows':
      return <WindowsLogo size={size} className={className} />;
    case 'folder':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Folder size={size} className={`text-amber-500 fill-amber-400/30 ${className}`} />
        </div>
      );
    case 'file-text':
      return (
        <div className="relative inline-flex items-center justify-center">
          <FileText size={size} className={`text-blue-500 fill-blue-100 dark:fill-blue-950 ${className}`} />
        </div>
      );
    case 'calculator':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Calculator size={size} className={`text-emerald-500 ${className}`} />
        </div>
      );
    case 'globe':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Globe size={size} className={`text-cyan-500 ${className}`} />
        </div>
      );
    case 'activity':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Activity size={size} className={`text-teal-500 ${className}`} />
        </div>
      );
    case 'play-circle':
      return (
        <div className="relative inline-flex items-center justify-center">
          <PlayCircle size={size} className={`text-rose-500 fill-rose-500/20 ${className}`} />
        </div>
      );
    case 'calendar':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Calendar size={size} className={`text-indigo-500 ${className}`} />
        </div>
      );
    case 'palette':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Palette size={size} className={`text-fuchsia-500 ${className}`} />
        </div>
      );
    case 'terminal':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Terminal size={size} className={`text-slate-800 dark:text-slate-200 ${className}`} />
        </div>
      );
    case 'trash-2':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Trash2 size={size} className={`text-slate-600 dark:text-slate-400 ${className}`} />
        </div>
      );
    case 'settings':
      return (
        <div className="relative inline-flex items-center justify-center">
          <Settings size={size} className={`text-slate-700 dark:text-slate-300 ${className}`} />
        </div>
      );
    case 'file':
      return (
        <div className="relative inline-flex items-center justify-center">
          <File size={size} className={`text-slate-500 ${className}`} />
        </div>
      );
    default:
      return <HelpCircle size={size} className={`text-slate-500 ${className}`} />;
  }
};
