import React, { useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  Plane,
  Moon,
  BatteryCharging,
  Volume2,
  VolumeX,
  Sun,
  Settings,
  BellOff,
  ExternalLink,
} from 'lucide-react';

export const QuickSettingsFlyout: React.FC = () => {
  const {
    quickSettingsOpen,
    setQuickSettingsOpen,
    settings,
    updateSettings,
    openApp,
  } = useOS();

  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        quickSettingsOpen &&
        flyoutRef.current &&
        !flyoutRef.current.contains(e.target as HTMLElement)
      ) {
        const trayBtn = document.getElementById('taskbar-system-tray-btn');
        if (trayBtn && trayBtn.contains(e.target as HTMLElement)) return;
        setQuickSettingsOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [quickSettingsOpen, setQuickSettingsOpen]);

  if (!quickSettingsOpen) return null;

  return (
    <div
      ref={flyoutRef}
      className="fixed z-[999990] bottom-14 right-3 w-84 p-4 rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 win-acrylic-light dark:win-acrylic-dark text-slate-800 dark:text-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom-2 zoom-in-98 duration-150 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 6 Quick Action Grid Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {/* Wi-Fi */}
        <button
          onClick={() => updateSettings({ wifiEnabled: !settings.wifiEnabled })}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            settings.wifiEnabled
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}
        >
          {settings.wifiEnabled ? <Wifi size={20} /> : <WifiOff size={20} />}
          <span className="text-[11px] font-medium mt-1.5">Wi-Fi</span>
        </button>

        {/* Bluetooth */}
        <button
          onClick={() => updateSettings({ bluetoothEnabled: !settings.bluetoothEnabled })}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            settings.bluetoothEnabled
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Bluetooth size={20} />
          <span className="text-[11px] font-medium mt-1.5">Bluetooth</span>
        </button>

        {/* Airplane Mode */}
        <button
          onClick={() => updateSettings({ airplaneMode: !settings.airplaneMode })}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            settings.airplaneMode
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Plane size={20} />
          <span className="text-[11px] font-medium mt-1.5">Modo avión</span>
        </button>

        {/* Battery Saver */}
        <button
          onClick={() => updateSettings({ batterySaver: !settings.batterySaver })}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            settings.batterySaver
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}
        >
          <BatteryCharging size={20} />
          <span className="text-[11px] font-medium mt-1.5">Ahorro bat.</span>
        </button>

        {/* Night Light */}
        <button
          onClick={() => updateSettings({ nightLight: !settings.nightLight })}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            settings.nightLight
              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Moon size={20} />
          <span className="text-[11px] font-medium mt-1.5">Luz nocturna</span>
        </button>

        {/* Do Not Disturb */}
        <button
          onClick={() => updateSettings({ doNotDisturb: !settings.doNotDisturb })}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
            settings.doNotDisturb
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}
        >
          <BellOff size={20} />
          <span className="text-[11px] font-medium mt-1.5">No molestar</span>
        </button>
      </div>

      {/* Volume Slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Volumen</span>
          <span>{settings.soundVolume}%</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => updateSettings({ soundVolume: settings.soundVolume === 0 ? 80 : 0 })}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {settings.soundVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.soundVolume}
            onChange={(e) => updateSettings({ soundVolume: parseInt(e.target.value) })}
            className="flex-1 h-1.5 bg-black/10 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Brightness Slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Brillo</span>
          <span>{settings.brightness}%</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Sun size={16} className="text-slate-500 shrink-0" />
          <input
            type="range"
            min={20}
            max={100}
            value={settings.brightness}
            onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
            className="flex-1 h-1.5 bg-black/10 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Battery status & link to all settings */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
          <BatteryCharging size={15} className="text-emerald-500" />
          <span>94% disponible</span>
        </div>

        <button
          onClick={() => {
            openApp('settings');
            setQuickSettingsOpen(false);
          }}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors"
          title="Abrir configuración completa"
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
};
