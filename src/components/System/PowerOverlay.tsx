import React, { useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { Power, RotateCw } from 'lucide-react';

export const PowerOverlay: React.FC = () => {
  const { powerState, setPowerState } = useOS();

  useEffect(() => {
    if (powerState === 'restarting') {
      const timer = setTimeout(() => {
        setPowerState('normal');
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [powerState, setPowerState]);

  if (powerState === 'normal' || powerState === 'locked') return null;

  if (powerState === 'restarting') {
    return (
      <div className="fixed inset-0 z-[99999999] bg-[#005a9e] text-white flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200">
        <RotateCw size={48} className="animate-spin mb-4" />
        <h2 className="text-xl font-normal tracking-wide">Reiniciando...</h2>
      </div>
    );
  }

  if (powerState === 'sleep') {
    return (
      <div
        onClick={() => setPowerState('normal')}
        className="fixed inset-0 z-[99999999] bg-black/90 text-white flex flex-col items-center justify-center p-6 select-none cursor-pointer"
      >
        <p className="text-xs text-slate-400 animate-pulse">
          El equipo está en modo suspensión. Haga clic para reanudar.
        </p>
      </div>
    );
  }

  if (powerState === 'shutdown') {
    return (
      <div
        onClick={() => setPowerState('normal')}
        className="fixed inset-0 z-[99999999] bg-black text-white flex flex-col items-center justify-center p-6 select-none cursor-pointer space-y-4"
      >
        <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-400 transition-colors">
          <Power size={32} />
        </div>
        <p className="text-xs text-slate-500">
          El equipo se ha apagado. Haga clic para encender el simulador.
        </p>
      </div>
    );
  }

  return null;
};
