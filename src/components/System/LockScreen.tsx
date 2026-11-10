import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { ArrowRight, User } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { powerState, setPowerState, settings } = useOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (powerState !== 'locked') return null;

  const handleUnlock = () => {
    setPowerState('normal');
    setShowLogin(false);
  };

  const timeFormatted = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = currentTime.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div
      onClick={() => setShowLogin(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (showLogin) handleUnlock();
          else setShowLogin(true);
        }
      }}
      tabIndex={0}
      className="fixed inset-0 z-[9999999] flex flex-col items-center justify-between p-12 text-white bg-cover bg-center select-none backdrop-blur-md transition-all duration-300 outline-none"
      style={{
        backgroundImage: `url(${settings.wallpaper.value})`,
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Top / Center Clock */}
      <div className="relative z-10 text-center mt-12 animate-in fade-in duration-500">
        <h1 className="text-7xl sm:text-8xl font-light tracking-tight font-mono drop-shadow-lg">
          {timeFormatted}
        </h1>
        <p className="text-xl sm:text-2xl font-normal capitalize mt-2 drop-shadow-md text-slate-200">
          {dateFormatted}
        </p>
      </div>

      {/* Login Card or Unlock prompt */}
      <div className="relative z-10 mb-16 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
        {!showLogin ? (
          <p className="text-sm font-medium tracking-wide text-slate-300 animate-pulse drop-shadow">
            Haga clic o presione una tecla para desbloquear
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl">
              <User size={40} />
            </div>

            <span className="text-lg font-semibold tracking-tight">Usuario</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnlock();
              }}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs shadow-lg transition-all"
            >
              <span>Iniciar sesión</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
