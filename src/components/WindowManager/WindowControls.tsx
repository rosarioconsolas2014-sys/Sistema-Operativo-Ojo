import React from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { WindowState } from '../../types/os';

interface WindowControlsProps {
  state: WindowState;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  state,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  return (
    <div className="flex items-center h-full select-none" onMouseDown={(e) => e.stopPropagation()}>
      {/* Minimize */}
      <button
        onClick={onMinimize}
        className="h-8 w-11 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors"
        title="Minimizar"
      >
        <Minus size={13} strokeWidth={2} />
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={onMaximize}
        className="h-8 w-11 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors"
        title={state === 'maximized' ? 'Restaurar' : 'Maximizar'}
      >
        {state === 'maximized' ? (
          <Copy size={11} strokeWidth={2} className="rotate-180" />
        ) : (
          <Square size={11} strokeWidth={2} />
        )}
      </button>

      {/* Close */}
      <button
        onClick={onClose}
        className="h-8 w-12 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-red-500 hover:text-white active:bg-red-600 transition-colors"
        title="Cerrar"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
};
