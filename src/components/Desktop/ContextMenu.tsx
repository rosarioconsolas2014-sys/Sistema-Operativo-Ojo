import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { ChevronRight } from 'lucide-react';
import { ContextMenuOption } from '../../types/os';

export const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu } = useOS();
  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);

  if (!contextMenu.isOpen) return null;

  return (
    <div
      className="fixed z-[999999] min-w-[220px] py-1.5 px-1 rounded-xl shadow-2xl transition-opacity animate-in fade-in zoom-in-95 duration-100 win-acrylic-light dark:win-acrylic-dark text-slate-800 dark:text-slate-100 text-[13px] border border-black/10 dark:border-white/10"
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.options.map((option, idx) => {
        if (option.divider) {
          return <div key={`div_${idx}`} className="my-1.5 border-t border-slate-200/80 dark:border-slate-700/80" />;
        }

        const hasSubmenu = option.submenu && option.submenu.length > 0;
        const isSubmenuActive = activeSubmenuIndex === idx;

        return (
          <div
            key={option.id || idx}
            className="relative"
            onMouseEnter={() => hasSubmenu && setActiveSubmenuIndex(idx)}
            onMouseLeave={() => hasSubmenu && setActiveSubmenuIndex(null)}
          >
            <button
              disabled={option.disabled}
              onClick={() => {
                if (option.action) {
                  option.action();
                  closeContextMenu();
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors ${
                option.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                {option.icon && <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-80">{option.icon}</span>}
                <span className="truncate">{option.label}</span>
              </div>
              {hasSubmenu && <ChevronRight size={14} className="opacity-60 ml-2 shrink-0" />}
            </button>

            {/* Submenu */}
            {hasSubmenu && isSubmenuActive && (
              <div
                className="absolute left-full top-0 ml-1 min-w-[180px] py-1.5 px-1 rounded-xl shadow-2xl win-acrylic-light dark:win-acrylic-dark text-slate-800 dark:text-slate-100 text-[13px] border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-75"
              >
                {option.submenu!.map((sub, sIdx) => {
                  if (sub.divider) {
                    return <div key={`sdiv_${sIdx}`} className="my-1.5 border-t border-slate-200 dark:border-slate-700" />;
                  }
                  return (
                    <button
                      key={sub.id || sIdx}
                      onClick={() => {
                        if (sub.action) {
                          sub.action();
                          closeContextMenu();
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      {sub.icon && <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-80">{sub.icon}</span>}
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
