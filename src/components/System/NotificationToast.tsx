import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { X, Bell } from 'lucide-react';
import { SystemNotification } from '../../types/os';

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useOS();
  const [activeToast, setActiveToast] = useState<SystemNotification | null>(null);

  // When a new notification arrives, show toast for 4.5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setActiveToast(latest);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!activeToast) return null;

  return (
    <div
      onClick={() => setActiveToast(null)}
      className="fixed z-[999980] bottom-14 right-3 max-w-xs w-80 p-3.5 rounded-xl shadow-2xl win-acrylic-light dark:win-acrylic-dark text-slate-800 dark:text-slate-100 border border-black/10 dark:border-white/10 flex flex-col gap-1 cursor-pointer animate-in slide-in-from-right-4 duration-200 select-none"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
          <Bell size={12} />
          <span>{activeToast.appName}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={12} />
        </button>
      </div>

      <div className="text-xs font-semibold text-slate-900 dark:text-white">
        {activeToast.title}
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-300 leading-tight">
        {activeToast.message}
      </div>
    </div>
  );
};
