import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bell,
  Trash2,
  X,
  BellOff,
} from 'lucide-react';

export const CalendarFlyout: React.FC = () => {
  const {
    calendarFlyoutOpen,
    setCalendarFlyoutOpen,
    notifications,
    removeNotification,
    clearNotifications,
    settings,
    updateSettings,
    openApp,
  } = useOS();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(true);

  const flyoutRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        calendarFlyoutOpen &&
        flyoutRef.current &&
        !flyoutRef.current.contains(e.target as HTMLElement)
      ) {
        const clockBtn = document.getElementById('taskbar-clock-btn');
        if (clockBtn && clockBtn.contains(e.target as HTMLElement)) return;
        setCalendarFlyoutOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [calendarFlyoutOpen, setCalendarFlyoutOpen]);

  if (!calendarFlyoutOpen) return null;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div
      ref={flyoutRef}
      className="fixed z-[999990] bottom-14 right-3 w-88 rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 win-acrylic-light dark:win-acrylic-dark text-slate-800 dark:text-slate-100 flex flex-col animate-in slide-in-from-bottom-2 zoom-in-98 duration-150 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Notifications Section */}
      <div className="p-3.5 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs">Notificaciones</span>
            {notifications.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateSettings({ doNotDisturb: !settings.doNotDisturb })}
              className={`p-1 rounded-md transition-colors ${
                settings.doNotDisturb ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 hover:text-slate-600'
              }`}
              title={settings.doNotDisturb ? 'No molestar activado' : 'Activar No molestar'}
            >
              <BellOff size={14} />
            </button>

            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Borrar todo</span>
              </button>
            )}

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              {showNotifications ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Notifications list */}
        {showNotifications && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-[11px]">
                No hay notificaciones nuevas
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-black/5 dark:border-white/5 relative group"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-[11px] text-blue-600 dark:text-blue-400">
                      {notif.appName}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">{notif.time}</span>
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="font-medium text-xs text-slate-800 dark:text-slate-100">
                    {notif.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    {notif.message}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Date & Time Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs text-slate-500 capitalize">
            {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <button
          onClick={() => {
            openApp('calendar');
            setCalendarFlyoutOpen(false);
          }}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Abrir Calendario
        </button>
      </div>

      {/* Mini Month Grid */}
      <div className="p-4 pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-xs">
            {monthNames[month]} {year}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Days header */}
        <div className="grid grid-cols-7 gap-1 text-center font-medium text-slate-400 text-[10px] mb-1">
          <span>D</span>
          <span>L</span>
          <span>M</span>
          <span>M</span>
          <span>J</span>
          <span>V</span>
          <span>S</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calendarDays.map((d, idx) => {
            if (d === null) return <div key={`emp_${idx}`} className="h-7 w-7" />;
            const isToday = isCurrentMonth && d === today.getDate();

            return (
              <button
                key={`d_${d}`}
                onClick={() => {
                  openApp('calendar');
                  setCalendarFlyoutOpen(false);
                }}
                className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center font-medium transition-colors ${
                  isToday
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
