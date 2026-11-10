import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { APPS_REGISTRY } from '../../apps/registry';
import { AppIcon } from '../UI/AppIcon';
import { FileSystemService } from '../../services/fileSystemService';
import {
  Search,
  Power,
  ChevronRight,
  RotateCw,
  Moon,
  Lock,
  LogOut,
  Folder,
  FileText,
  Sparkles,
  LogIn,
} from 'lucide-react';

export const StartMenu: React.FC = () => {
  const {
    startMenuOpen,
    setStartMenuOpen,
    openApp,
    settings,
    setPowerState,
    desktopFiles,
    currentUser,
    logout,
    openAuthModal,
  } = useOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAllApps, setShowAllApps] = useState(false);
  const [powerDropdownOpen, setPowerDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const startMenuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        startMenuOpen &&
        startMenuRef.current &&
        !startMenuRef.current.contains(e.target as HTMLElement)
      ) {
        // Also check if clicked on start button in taskbar
        const taskbarStartBtn = document.getElementById('taskbar-start-button');
        if (taskbarStartBtn && taskbarStartBtn.contains(e.target as HTMLElement)) {
          return;
        }
        setStartMenuOpen(false);
        setPowerDropdownOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [startMenuOpen, setStartMenuOpen]);

  if (!startMenuOpen) return null;

  const allAppsList = Object.values(APPS_REGISTRY);

  // Filtered apps by search
  const filteredApps = allAppsList.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pinned apps
  const pinnedApps = allAppsList.filter(app => app.pinnedToStart);

  // Recommended files from filesystem
  const recommendedFiles = FileSystemService.getAllFiles()
    .filter(f => f.type === 'file' && !f.isDeleted)
    .slice(0, 6);

  return (
    <div
      ref={startMenuRef}
      className={`fixed z-[999990] bottom-14 rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 win-acrylic-light dark:win-acrylic-dark text-slate-800 dark:text-slate-100 flex flex-col animate-in slide-in-from-bottom-2 zoom-in-98 duration-150 ${
        settings.taskbarAlignment === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-3'
      }`}
      style={{
        width: '560px',
        maxWidth: 'calc(100vw - 24px)',
        height: '620px',
        maxHeight: 'calc(100vh - 80px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Input Bar */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 shadow-inner focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Escribe aquí para buscar aplicaciones, archivos o configuración..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            autoFocus
          />
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {searchQuery ? (
          /* Search Results */
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Resultados de la búsqueda ({filteredApps.length})
            </span>
            <div className="space-y-1">
              {filteredApps.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No se encontraron resultados para "{searchQuery}"
                </div>
              ) : (
                filteredApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      openApp(app.id);
                      setStartMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="p-1">
                      <AppIcon name={app.icon} size={28} />
                    </div>
                    <div className="truncate flex-1">
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">{app.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{app.description}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : showAllApps ? (
          /* All Apps List */
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold">Todas las aplicaciones</span>
              <button
                onClick={() => setShowAllApps(false)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Volver a ancladas
              </button>
            </div>
            <div className="space-y-1">
              {allAppsList.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    openApp(app.id);
                    setStartMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
                >
                  <AppIcon name={app.icon} size={24} />
                  <span className="font-medium text-xs">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Pinned & Recommended */
          <div className="space-y-5">
            {/* Pinned Section */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold">Anclado</span>
                <button
                  onClick={() => setShowAllApps(true)}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors font-medium"
                >
                  <span>Todas las apps</span>
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {pinnedApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      openApp(app.id);
                      setStartMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-transform active:scale-95 group text-center"
                  >
                    <div className="p-1 mb-1 transition-transform group-hover:scale-110">
                      <AppIcon name={app.icon} size={32} />
                    </div>
                    <span className="text-[11px] font-medium leading-tight truncate w-full text-slate-700 dark:text-slate-200">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended Section */}
            <div>
              <div className="mb-2 px-1">
                <span className="text-xs font-semibold">Recomendado</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {recommendedFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      openApp('notepad', { initialFileId: file.id, initialTitle: file.name, initialContent: file.content });
                      setStartMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
                  >
                    <AppIcon name="file-text" size={24} />
                    <div className="truncate flex-1">
                      <div className="font-medium text-xs truncate text-slate-800 dark:text-slate-200">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-500">Reciente</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer User Profile & Power Controls */}
      <div className="relative p-3.5 px-6 bg-black/5 dark:bg-black/30 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
        {/* User Profile */}
        <div className="relative">
          <div
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {currentUser?.email ? currentUser.email[0].toUpperCase() : 'U'}
            </div>
            <div className="text-left">
              <span className="font-semibold text-xs block truncate max-w-[170px]">
                {currentUser?.email ? currentUser.email.split('@')[0] : 'Usuario Local'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[170px]">
                {currentUser ? 'Cuenta en la nube' : 'Modo local'}
              </span>
            </div>
          </div>

          {/* User Account Dropdown */}
          {userDropdownOpen && (
            <div className="absolute left-0 bottom-12 min-w-[210px] py-1.5 px-1 rounded-xl shadow-2xl win-acrylic-light dark:win-acrylic-dark border border-black/10 dark:border-white/10 z-50 text-xs animate-in fade-in zoom-in-95">
              {currentUser ? (
                <>
                  <div className="px-3 py-1.5 border-b border-black/5 dark:border-white/10 text-[11px] text-slate-400">
                    Conectado como <strong className="text-slate-200 block truncate">{currentUser.email}</strong>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      setStartMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors text-left font-medium mt-1"
                  >
                    <LogOut size={14} />
                    <span>Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal();
                    setUserDropdownOpen(false);
                    setStartMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors text-left font-medium"
                >
                  <LogIn size={14} />
                  <span>Iniciar sesión con Firebase</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Power Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPowerDropdownOpen(!powerDropdownOpen)}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors text-slate-700 dark:text-slate-200"
            title="Inicio / Apagado"
          >
            <Power size={18} />
          </button>

          {/* Power Options Dropdown */}
          {powerDropdownOpen && (
            <div className="absolute right-0 bottom-12 min-w-[170px] py-1.5 px-1 rounded-xl shadow-2xl win-acrylic-light dark:win-acrylic-dark border border-black/10 dark:border-white/10 z-50 text-xs animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setPowerState('sleep');
                  setStartMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
              >
                <Moon size={14} className="text-indigo-400" />
                <span>Suspender</span>
              </button>
              <button
                onClick={() => {
                  setPowerState('locked');
                  setStartMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
              >
                <Lock size={14} className="text-amber-400" />
                <span>Bloquear sesión</span>
              </button>
              <button
                onClick={() => {
                  setPowerState('restarting');
                  setStartMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
              >
                <RotateCw size={14} className="text-blue-400" />
                <span>Reiniciar</span>
              </button>
              <button
                onClick={() => {
                  setPowerState('shutdown');
                  setStartMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors text-left"
              >
                <Power size={14} />
                <span>Apagar equipo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
