import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { APPS_REGISTRY } from '../../apps/registry';
import { AppIcon, WindowsLogo } from '../UI/AppIcon';
import { StartMenu } from './StartMenu';
import { QuickSettingsFlyout } from './QuickSettingsFlyout';
import { CalendarFlyout } from './CalendarFlyout';
import {
  Search,
  Wifi,
  Volume2,
  VolumeX,
  Battery,
  Bell,
  SunMedium,
  CloudSun,
  Cloud,
  RotateCw,
  Check,
  AlertCircle,
} from 'lucide-react';

export const Taskbar: React.FC = () => {
  const {
    windows,
    activeWindowId,
    openApp,
    bringToFront,
    minimizeWindow,
    restoreWindow,
    settings,
    startMenuOpen,
    toggleStartMenu,
    toggleQuickSettings,
    toggleCalendarFlyout,
    notifications,
    syncStatus,
    currentUser,
    openAuthModal,
  } = useOS();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show desktop toggle
  const handleShowDesktop = () => {
    const anyNormal = windows.some(w => w.state !== 'minimized');
    if (anyNormal) {
      windows.forEach(w => minimizeWindow(w.id));
    } else {
      windows.forEach(w => restoreWindow(w.id));
    }
  };

  // Pinned taskbar apps
  const pinnedAppIds = ['explorer', 'browser', 'notepad', 'calculator', 'paint', 'terminal', 'settings'];

  // Handle click on app icon in taskbar
  const handleAppClick = (appId: string) => {
    // Find if there's an open window for this app
    const openWins = windows.filter(w => w.appId === appId);

    if (openWins.length === 0) {
      // Open new instance
      openApp(appId);
    } else if (openWins.length === 1) {
      const win = openWins[0];
      if (win.state === 'minimized') {
        restoreWindow(win.id);
      } else if (win.id === activeWindowId) {
        minimizeWindow(win.id);
      } else {
        bringToFront(win.id);
      }
    } else {
      // Multiple instances: cycle or bring active
      const activeIdx = openWins.findIndex(w => w.id === activeWindowId);
      if (activeIdx !== -1 && openWins[activeIdx].state !== 'minimized') {
        minimizeWindow(openWins[activeIdx].id);
      } else {
        const next = openWins.find(w => w.id !== activeWindowId) || openWins[0];
        if (next.state === 'minimized') restoreWindow(next.id);
        else bringToFront(next.id);
      }
    }
  };

  // Collect all unique apps to render on taskbar:
  // Starts with pinned, then adds any open windows not already in pinned list
  const renderedAppIds = [...pinnedAppIds];
  windows.forEach(w => {
    if (!renderedAppIds.includes(w.appId)) {
      renderedAppIds.push(w.appId);
    }
  });

  return (
    <>
      {/* Flyout Overlays */}
      <StartMenu />
      <QuickSettingsFlyout />
      <CalendarFlyout />

      {/* Taskbar Main Bar */}
      <footer
        id="taskbar-container"
        className={`fixed bottom-0 inset-x-0 h-12 z-[999900] select-none flex items-center justify-between px-2 transition-colors ${
          settings.theme === 'dark' ? 'win-taskbar-dark text-slate-100' : 'win-taskbar-light text-slate-800'
        }`}
      >
        {/* Left Side: Weather Widget (Windows 11 style) */}
        <div className="flex items-center min-w-[140px] pl-1">
          {settings.showWidgets && (
            <button
              onClick={() => openApp('browser')}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
              title="El tiempo en tu ciudad"
            >
              <CloudSun size={18} className="text-amber-500 shrink-0" />
              <div className="leading-tight">
                <span className="text-[11px] font-semibold block">22°C</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Soleado</span>
              </div>
            </button>
          )}
        </div>

        {/* Central / Left Aligned Apps Bar */}
        <div
          className={`flex items-center gap-1.5 ${
            settings.taskbarAlignment === 'center'
              ? 'absolute left-1/2 -translate-x-1/2'
              : 'justify-start'
          }`}
        >
          {/* Start Button */}
          <button
            id="taskbar-start-button"
            onClick={toggleStartMenu}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              startMenuOpen
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-inner'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-blue-500'
            }`}
            title="Inicio"
          >
            <WindowsLogo size={20} />
          </button>

          {/* Search Button / Bar */}
          {settings.showSearchInTaskbar && (
            <button
              onClick={toggleStartMenu}
              className="flex items-center gap-2 px-3 h-8 rounded-full bg-white/70 dark:bg-slate-800/80 border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-slate-800 transition-colors text-xs text-slate-500 dark:text-slate-400 shadow-xs"
              title="Buscar"
            >
              <Search size={14} />
              <span className="hidden md:inline pr-4">Buscar</span>
            </button>
          )}

          {/* Taskbar App Icons */}
          {renderedAppIds.map((appId) => {
            const appDef = APPS_REGISTRY[appId];
            if (!appDef) return null;

            const openWins = windows.filter(w => w.appId === appId);
            const isOpen = openWins.length > 0;
            const hasActiveWin = openWins.some(w => w.id === activeWindowId && w.state !== 'minimized');

            return (
              <button
                key={appId}
                onClick={() => handleAppClick(appId)}
                className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all group ${
                  hasActiveWin
                    ? 'bg-black/10 dark:bg-white/15'
                    : isOpen
                    ? 'bg-black/5 dark:bg-white/10'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={appDef.name}
              >
                <div className="transition-transform group-hover:scale-110 group-active:scale-95">
                  <AppIcon name={appDef.icon} size={24} />
                </div>

                {/* Windows 11 Running Indicator Pill */}
                {isOpen && (
                  <span
                    className={`absolute bottom-0.5 rounded-full transition-all ${
                      hasActiveWin
                        ? 'w-4 h-1 bg-blue-500 shadow-sm'
                        : 'w-1.5 h-1 bg-slate-400 dark:bg-slate-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: System Tray */}
        <div className="flex items-center gap-1 min-w-[140px] justify-end">
          {/* Cloud Sync Status Indicator */}
          <button
            onClick={currentUser ? undefined : openAuthModal}
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title={
              !currentUser
                ? 'Modo Local (Invitado). Haz clic para iniciar sesión con Firebase'
                : syncStatus === 'saving'
                ? 'Guardando cambios en Firebase...'
                : syncStatus === 'synced'
                ? 'Sincronizado con Firebase'
                : 'Error de sincronización con Firebase'
            }
          >
            {!currentUser ? (
              <Cloud size={14} className="text-slate-400 opacity-60" />
            ) : syncStatus === 'saving' ? (
              <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                <RotateCw size={12} className="animate-spin" />
                <span className="hidden lg:inline text-[9px]">Guardando</span>
              </div>
            ) : syncStatus === 'synced' ? (
              <div className="relative">
                <Cloud size={14} className="text-emerald-500" />
                <Check size={8} className="absolute inset-0 m-auto text-emerald-600 stroke-[3]" />
              </div>
            ) : (
              <div className="relative">
                <Cloud size={14} className="text-amber-500" />
                <AlertCircle size={8} className="absolute inset-0 m-auto text-amber-600 stroke-[3]" />
              </div>
            )}
          </button>

          {/* Language Selector */}
          <div className="px-1.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
            ESP
          </div>

          {/* Quick Settings Pill (Wi-Fi, Audio, Battery) */}
          <button
            id="taskbar-system-tray-btn"
            onClick={toggleQuickSettings}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Red, Sonido y Batería"
          >
            <Wifi size={14} className={settings.wifiEnabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'} />
            {settings.soundVolume === 0 ? (
              <VolumeX size={14} className="text-slate-400" />
            ) : (
              <Volume2 size={14} className="text-slate-700 dark:text-slate-300" />
            )}
            <Battery size={14} className="text-slate-700 dark:text-slate-300" />
          </button>

          {/* Clock & Date (opens Calendar Flyout) */}
          <button
            id="taskbar-clock-btn"
            onClick={toggleCalendarFlyout}
            className="flex flex-col items-end px-2 py-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors leading-tight"
            title="Fecha y hora"
          >
            <span className="text-[11.5px] font-medium font-mono">{timeStr}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{dateStr}</span>
          </button>

          {/* Notification Center Bell */}
          <button
            onClick={toggleCalendarFlyout}
            className="relative p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Centro de notificaciones"
          >
            <Bell size={14} className="text-slate-700 dark:text-slate-300" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>

          {/* Show Desktop Strip */}
          <button
            onClick={handleShowDesktop}
            className="w-1.5 h-7 border-l border-slate-300 dark:border-slate-700/60 hover:bg-blue-500/40 transition-colors ml-0.5"
            title="Mostrar escritorio"
          />
        </div>
      </footer>
    </>
  );
};
