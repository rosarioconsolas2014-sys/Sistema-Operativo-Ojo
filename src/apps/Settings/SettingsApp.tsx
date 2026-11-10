import React, { useState, useRef, useEffect } from 'react';
import { useOS, WALLPAPER_PRESETS, WallpaperPreset } from '../../context/OSContext';
import { auth, deleteUserFile } from '../../services/firebase';
import { syncService } from '../../services/firebaseSyncService';
import {
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Layout,
  HardDrive,
  RotateCcw,
  Upload,
  Check,
  CheckCircle2,
  Trash2,
  Eye,
  Search,
  Cpu,
  Landmark,
  Image as ImageIcon,
  X,
  Maximize2,
  Cloud,
  CheckCheck,
} from 'lucide-react';

interface SettingsProps {
  meta?: {
    tab?: 'personalization' | 'display' | 'taskbar' | 'system';
  };
}

interface CustomWallpaperItem {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  storagePath?: string;
  theme?: 'light' | 'dark';
}

interface UnifiedWallpaper {
  id: string;
  name: string;
  category: 'tecnologia' | 'santa_fe' | 'windows' | 'custom';
  url?: string;
  gradient?: string;
  theme?: 'light' | 'dark';
  description?: string;
  isCustom?: boolean;
  storagePath?: string;
}

const CUSTOM_WALLPAPERS_STORAGE_KEY = 'win11_custom_wallpapers_v1';

export const SettingsApp: React.FC<SettingsProps> = ({ meta }) => {
  const { settings, updateSettings, resetAllSettings, addNotification } = useOS();
  const [activeTab, setActiveTab] = useState<'personalization' | 'display' | 'taskbar' | 'system'>(
    meta?.tab || 'personalization'
  );

  // Gallery filters and search
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tecnologia' | 'santa_fe' | 'windows' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  // Custom user uploaded wallpapers
  const [customWallpapers, setCustomWallpapers] = useState<CustomWallpaperItem[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_WALLPAPERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modal preview state for high-res enlarged inspection
  const [previewItem, setPreviewItem] = useState<{
    id: string;
    name: string;
    category: string;
    url?: string;
    gradient?: string;
    description?: string;
    theme?: 'light' | 'dark';
    isCustom?: boolean;
    storagePath?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync custom wallpapers to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_WALLPAPERS_STORAGE_KEY, JSON.stringify(customWallpapers));
    } catch (e) {
      console.warn('Failed to persist custom wallpapers to localStorage', e);
    }
  }, [customWallpapers]);

  // Apply a wallpaper immediately and save to state + Firebase
  const applyWallpaper = (item: {
    name: string;
    url?: string;
    gradient?: string;
    theme?: 'light' | 'dark';
  }) => {
    const val = item.url || item.gradient || '';
    updateSettings({
      wallpaper: {
        type: item.url ? 'image' : 'gradient',
        value: val,
        fit: settings.wallpaper.fit || 'cover',
      },
      theme: item.theme || settings.theme,
    });
    addNotification('Fondo de pantalla aplicado', `Se ha aplicado "${item.name}" y guardado en Firebase.`, 'Configuración');
  };

  // Upload custom wallpaper to Firebase Storage or local
  const handleCustomWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileNameClean = file.name.replace(/\.[^/.]+$/, '').slice(0, 30);

    try {
      if (auth.currentUser) {
        addNotification('Subiendo fondo...', 'Guardando fondo de pantalla en Firebase Storage...', 'Configuración');
        const storagePath = `wallpapers/wp_${Date.now()}_${file.name}`;
        const downloadUrl = await syncService.uploadBinary(
          auth.currentUser.uid,
          storagePath,
          file
        );

        const newCustom: CustomWallpaperItem = {
          id: `custom_${Date.now()}`,
          name: fileNameClean || 'Fondo personalizado',
          url: downloadUrl,
          createdAt: new Date().toISOString(),
          storagePath,
          theme: 'dark',
        };

        setCustomWallpapers((prev) => [newCustom, ...prev]);
        applyWallpaper(newCustom);
        addNotification('Fondo en la nube', 'Fondo guardado en Firebase Storage y aplicado exitosamente.', 'Configuración');
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const newCustom: CustomWallpaperItem = {
            id: `custom_${Date.now()}`,
            name: fileNameClean || 'Fondo personalizado',
            url: result,
            createdAt: new Date().toISOString(),
            theme: 'dark',
          };

          setCustomWallpapers((prev) => [newCustom, ...prev]);
          applyWallpaper(newCustom);
          addNotification('Fondo aplicado', 'Se ha guardado localmente como fondo de pantalla.', 'Configuración');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Failed to upload to storage, using local data URL fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newCustom: CustomWallpaperItem = {
          id: `custom_${Date.now()}`,
          name: fileNameClean || 'Fondo personalizado',
          url: result,
          createdAt: new Date().toISOString(),
          theme: 'dark',
        };
        setCustomWallpapers((prev) => [newCustom, ...prev]);
        applyWallpaper(newCustom);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete a custom user wallpaper
  const handleDeleteCustomWallpaper = async (
    item: { id: string; name: string; url?: string; storagePath?: string },
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();

    if (!confirm(`¿Deseas eliminar el fondo personalizado "${item.name}"?`)) {
      return;
    }

    // If currently active, reset to standard Windows Bloom Light
    if (item.url && settings.wallpaper.value === item.url) {
      const fallback = WALLPAPER_PRESETS[0];
      applyWallpaper(fallback);
    }

    setCustomWallpapers((prev) => prev.filter((wp) => wp.id !== item.id));

    // Remove from storage if path exists
    if (auth.currentUser && item.storagePath) {
      try {
        await deleteUserFile(auth.currentUser.uid, item.storagePath);
      } catch (err) {
        console.warn('Could not delete file from Firebase Storage:', err);
      }
    }

    if (previewItem?.id === item.id) {
      setPreviewItem(null);
    }

    addNotification('Fondo eliminado', `Se eliminó "${item.name}" de tus fondos personalizados.`, 'Configuración');
  };

  // Filtered wallpaper list
  const filteredWallpapers: UnifiedWallpaper[] = [
    // Predefined Wallpapers
    ...WALLPAPER_PRESETS.filter((wp) => {
      if (selectedCategory === 'custom') return false;
      if (selectedCategory !== 'all' && wp.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          wp.name.toLowerCase().includes(q) ||
          (wp.description && wp.description.toLowerCase().includes(q))
        );
      }
      return true;
    }).map((wp) => ({
      ...wp,
      isCustom: false,
    })),
    // User custom wallpapers
    ...customWallpapers
      .filter(() => selectedCategory === 'all' || selectedCategory === 'custom')
      .filter((wp) => {
        if (searchQuery.trim()) {
          return wp.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .map((wp) => ({
        id: wp.id,
        name: wp.name,
        category: 'custom' as const,
        url: wp.url,
        gradient: undefined,
        theme: wp.theme || 'dark',
        description: 'Fondo personalizado cargado por el usuario',
        isCustom: true,
        storagePath: wp.storagePath,
      })),
  ];

  const counts = {
    all: WALLPAPER_PRESETS.length + customWallpapers.length,
    tecnologia: WALLPAPER_PRESETS.filter((w) => w.category === 'tecnologia').length,
    santa_fe: WALLPAPER_PRESETS.filter((w) => w.category === 'santa_fe').length,
    windows: WALLPAPER_PRESETS.filter((w) => w.category === 'windows').length,
    custom: customWallpapers.length,
  };

  const accentColors = [
    { name: 'Azul Windows', value: '#0078d4' },
    { name: 'Púrpura Místico', value: '#8764b8' },
    { name: 'Verde Esmeralda', value: '#107c41' },
    { name: 'Rosa Fucsia', value: '#e3008c' },
    { name: 'Naranja Fuego', value: '#d83b01' },
    { name: 'Azul Marino', value: '#004e8c' },
  ];

  return (
    <div className="flex-1 flex h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none text-xs relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCustomWallpaperUpload}
      />

      {/* Sidebar navigation */}
      <div className="w-52 shrink-0 bg-slate-100/80 dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col space-y-1">
        <div className="flex items-center gap-2 px-2 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            {auth.currentUser ? (auth.currentUser.displayName?.[0] || 'U').toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            <div className="font-semibold text-xs truncate">
              {auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Usuario') : 'Usuario Local'}
            </div>
            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
              {auth.currentUser ? (
                <>
                  <Cloud size={10} className="text-blue-500 shrink-0" />
                  <span>Sincronizado</span>
                </>
              ) : (
                'Modo invitado / Local'
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('personalization')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors font-medium ${
            activeTab === 'personalization'
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
          }`}
        >
          <Sparkles size={16} className="text-blue-500" />
          <span>Personalización</span>
        </button>

        <button
          onClick={() => setActiveTab('display')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors font-medium ${
            activeTab === 'display'
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
          }`}
        >
          <Monitor size={16} className="text-purple-500" />
          <span>Pantalla e Iconos</span>
        </button>

        <button
          onClick={() => setActiveTab('taskbar')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors font-medium ${
            activeTab === 'taskbar'
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
          }`}
        >
          <Layout size={16} className="text-amber-500" />
          <span>Barra de tareas</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors font-medium ${
            activeTab === 'system'
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
          }`}
        >
          <HardDrive size={16} className="text-emerald-500" />
          <span>Sistema y Acerca de</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
        {/* TAB: Personalización */}
        {activeTab === 'personalization' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-1">Personalización y Fondos de Escritorio</h2>
              <p className="text-xs text-slate-500">
                Galería visual de fondos en alta definición (1920 × 1080, 16:9) sobre Tecnología, Innovación y el Gobierno de Santa Fe.
              </p>
            </div>

            {/* Current Wallpaper Preview Hero Card */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs flex items-center gap-2">
                  <span>Vista previa del fondo actual</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-500/20">
                    En uso
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <CheckCheck size={13} className="text-emerald-500" />
                  <span>Sincronizado con Firebase</span>
                </span>
              </div>

              {/* Realistic Desktop Mockup in 16:9 proportion */}
              <div
                className="w-full aspect-[21/9] sm:aspect-[24/9] rounded-xl shadow-inner border border-black/10 dark:border-white/10 relative overflow-hidden transition-all duration-300"
                style={{
                  background:
                    settings.wallpaper.type === 'image'
                      ? `url(${settings.wallpaper.value}) center/${settings.wallpaper.fit || 'cover'} no-repeat`
                      : settings.wallpaper.value,
                }}
              >
                {/* Mini desktop icons mockup on the left */}
                <div className="absolute top-2.5 left-2.5 space-y-1.5 pointer-events-none opacity-80">
                  <div className="w-5 h-4 bg-white/30 backdrop-blur-xs rounded-xs border border-white/20" />
                  <div className="w-5 h-4 bg-white/30 backdrop-blur-xs rounded-xs border border-white/20" />
                  <div className="w-5 h-4 bg-white/30 backdrop-blur-xs rounded-xs border border-white/20" />
                </div>

                {/* Mini Windows 11 Taskbar mockup */}
                <div className="absolute bottom-0 inset-x-0 h-6 bg-slate-900/60 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-1.5 px-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-xs" />
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-xs" />
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-xs" />
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-xs" />
                </div>
              </div>

              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Ajuste de pantalla:</span>
                  <select
                    value={settings.wallpaper.fit}
                    onChange={(e) =>
                      updateSettings({
                        wallpaper: {
                          ...settings.wallpaper,
                          fit: e.target.value as 'cover' | 'contain' | 'tile',
                        },
                      })
                    }
                    className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  >
                    <option value="cover">Rellenar pantalla (Cover - 16:9)</option>
                    <option value="contain">Ajustar centrado (Contain)</option>
                    <option value="tile">Mosaico continuo (Tile)</option>
                  </select>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-98 disabled:opacity-50"
                >
                  <Upload size={13} />
                  <span>{uploading ? 'Subiendo a Firebase...' : 'Subir fondo propio'}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills & Search Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>Todos</span>
                    <span className="text-[10px] opacity-75">({counts.all})</span>
                  </button>

                  <button
                    onClick={() => setSelectedCategory('tecnologia')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selectedCategory === 'tecnologia'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Cpu size={13} className="text-cyan-400" />
                    <span>Tecnología e Innovación</span>
                    <span className="text-[10px] opacity-75">({counts.tecnologia})</span>
                  </button>

                  <button
                    onClick={() => setSelectedCategory('santa_fe')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selectedCategory === 'santa_fe'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Landmark size={13} className="text-amber-400" />
                    <span>Gobierno de Santa Fe</span>
                    <span className="text-[10px] opacity-75">({counts.santa_fe})</span>
                  </button>

                  <button
                    onClick={() => setSelectedCategory('windows')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selectedCategory === 'windows'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Monitor size={13} />
                    <span>Windows 11</span>
                    <span className="text-[10px] opacity-75">({counts.windows})</span>
                  </button>

                  {counts.custom > 0 && (
                    <button
                      onClick={() => setSelectedCategory('custom')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedCategory === 'custom'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Upload size={13} className="text-emerald-400" />
                      <span>Mis Fondos</span>
                      <span className="text-[10px] opacity-75">({counts.custom})</span>
                    </button>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative flex items-center w-full sm:w-48">
                  <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar fondo..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Wallpaper Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                {filteredWallpapers.map((wp) => {
                  const wallpaperValue = wp.url || wp.gradient || '';
                  const isCurrent = settings.wallpaper.value === wallpaperValue;

                  // Category styling
                  let categoryLabel = 'Windows';
                  let categoryColor = 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30';
                  if (wp.category === 'tecnologia') {
                    categoryLabel = 'Tecnología';
                    categoryColor = 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
                  } else if (wp.category === 'santa_fe') {
                    categoryLabel = 'Santa Fe';
                    categoryColor = 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border-blue-600/30';
                  } else if (wp.category === 'custom') {
                    categoryLabel = 'Personalizado';
                    categoryColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
                  }

                  return (
                    <div
                      key={wp.id}
                      className={`group relative rounded-xl overflow-hidden border-2 transition-all flex flex-col bg-white dark:bg-slate-800/80 shadow-xs ${
                        isCurrent
                          ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Image Thumbnail with Aspect 16:9 */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        <div
                          className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                          style={{
                            background: wp.url ? `url(${wp.url}) center/cover no-repeat` : wp.gradient,
                          }}
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-md ${categoryColor}`}
                          >
                            {categoryLabel}
                          </span>

                          <span className="px-1.5 py-0.5 rounded-md bg-black/50 text-[9.5px] font-mono text-white/90 backdrop-blur-md">
                            16:9 • 1080p
                          </span>
                        </div>

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-xs flex items-center justify-center gap-2 p-2">
                          <button
                            onClick={() => applyWallpaper(wp)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <Check size={13} />
                            <span>Aplicar</span>
                          </button>

                          <button
                            onClick={() => setPreviewItem(wp)}
                            title="Previsualizar ampliado"
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white shadow-md transition-all active:scale-95"
                          >
                            <Eye size={15} />
                          </button>

                          {wp.isCustom && (
                            <button
                              onClick={(e) => handleDeleteCustomWallpaper(wp, e)}
                              title="Eliminar fondo personalizado"
                              className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white shadow-md transition-all active:scale-95"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        {/* Active Checkmark Pill on Thumbnail */}
                        {isCurrent && (
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center gap-1 shadow-md">
                            <CheckCircle2 size={12} />
                            <span>Activo</span>
                          </div>
                        )}
                      </div>

                      {/* Card Content & Description */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="font-semibold text-xs leading-snug line-clamp-1">{wp.name}</span>
                          </div>
                          {wp.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {wp.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-400 capitalize">
                            Tema {wp.theme === 'dark' ? 'Oscuro' : 'Claro'}
                          </span>
                          {!isCurrent ? (
                            <button
                              onClick={() => applyWallpaper(wp)}
                              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                            >
                              Aplicar
                            </button>
                          ) : (
                            <span className="text-emerald-500 font-medium flex items-center gap-1">
                              <Check size={11} />
                              <span>En uso</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredWallpapers.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <ImageIcon size={32} className="mx-auto text-slate-400" />
                  <p className="text-xs text-slate-500">No se encontraron fondos que coincidan con la búsqueda.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-blue-500 font-semibold hover:underline"
                  >
                    Restablecer filtros
                  </button>
                </div>
              )}
            </div>

            {/* Theme & Accent Color */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-4">
              <div>
                <span className="font-semibold text-xs block mb-2">Modo de color del sistema</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                      settings.theme === 'light'
                        ? 'bg-white border-blue-500 text-blue-600 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun size={16} />
                    <span>Claro</span>
                  </button>

                  <button
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-blue-500 text-blue-400 shadow-sm ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon size={16} />
                    <span>Oscuro</span>
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-xs block mb-2">Color de énfasis</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {accentColors.map((color) => {
                    const isSelected = settings.accentColor === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => updateSettings({ accentColor: color.value })}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                          isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {isSelected && <Check size={16} className="text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transparency Toggle */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs block">Efectos de transparencia</span>
                  <span className="text-[11px] text-slate-500">
                    Aplica efecto acrílico y desenfoque en ventanas y barra de tareas.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.windowTransparency}
                  onChange={(e) => updateSettings({ windowTransparency: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: Pantalla e Iconos */}
        {activeTab === 'display' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-1">Pantalla e Iconos</h2>
              <p className="text-xs text-slate-500">
                Ajusta las dimensiones de los iconos, su disposición y alineación en el escritorio.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-4">
              {/* Icon Size */}
              <div>
                <span className="font-semibold text-xs block mb-2">Tamaño de los iconos</span>
                <div className="grid grid-cols-3 gap-3">
                  {(['small', 'medium', 'large'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => updateSettings({ iconSize: sz })}
                      className={`p-3 rounded-lg border text-xs font-medium text-center capitalize transition-all ${
                        settings.iconSize === sz
                          ? 'border-blue-500 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {sz === 'small' ? 'Pequeños' : sz === 'medium' ? 'Medianos' : 'Grandes'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs block">Organizar iconos automáticamente</span>
                    <span className="text-[11px] text-slate-500">
                      Alinea los iconos en cuadrícula regular. Desactívalo para moverlos libremente.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoArrangeIcons}
                    onChange={(e) => updateSettings({ autoArrangeIcons: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs block">Mostrar nombres de los iconos</span>
                    <span className="text-[11px] text-slate-500">
                      Muestra u oculta la etiqueta de texto debajo de cada icono del escritorio.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showIconLabels}
                    onChange={(e) => updateSettings({ showIconLabels: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Barra de Tareas */}
        {activeTab === 'taskbar' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-1">Comportamiento de la barra de tareas</h2>
              <p className="text-xs text-slate-500">
                Personaliza la alineación y los elementos visibles en la barra de tareas inferior.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-4">
              {/* Alignment */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs block">Alineación de la barra de tareas</span>
                  <span className="text-[11px] text-slate-500">
                    Windows 11 por defecto ubica los iconos al centro, o estilo clásico a la izquierda.
                  </span>
                </div>
                <select
                  value={settings.taskbarAlignment}
                  onChange={(e) => updateSettings({ taskbarAlignment: e.target.value as 'center' | 'left' })}
                  className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                >
                  <option value="center">Centro</option>
                  <option value="left">Izquierda</option>
                </select>
              </div>

              {/* Elements Toggles */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs block">Cuadro o icono de búsqueda</span>
                    <span className="text-[11px] text-slate-500">Mostrar botón de búsqueda junto al botón de inicio</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showSearchInTaskbar}
                    onChange={(e) => updateSettings({ showSearchInTaskbar: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs block">Icono de widgets del clima</span>
                    <span className="text-[11px] text-slate-500">Mostrar resumen meteorológico en la esquina izquierda</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showWidgets}
                    onChange={(e) => updateSettings({ showWidgets: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Sistema y Acerca de */}
        {activeTab === 'system' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-1">Información del Sistema</h2>
              <p className="text-xs text-slate-500">
                Detalles del entorno operativo virtual y opciones de restablecimiento.
              </p>
            </div>

            {/* Specifications Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
              <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">Especificaciones de Windows</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Edición</span>
                  <span className="font-medium">Windows 11 Pro Simulator</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Versión</span>
                  <span className="font-medium">24H2 (Santa Fe & Tech Edition)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Compilación del SO</span>
                  <span className="font-medium font-mono">26100.1742</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Motor de Render</span>
                  <span className="font-medium">React 19 + Vite + Tailwind CSS</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Almacenamiento Virtual</span>
                  <span className="font-medium">Cloud Firestore + Firebase Storage</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Estado del Sistema</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Totalmente Operativo</span>
                </div>
              </div>
            </div>

            {/* Factory Reset Card */}
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 space-y-3">
              <div>
                <h4 className="font-semibold text-xs text-red-600 dark:text-red-400">Restablecer valores de fábrica</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Esta acción restaurará el fondo predeterminado, el tema claro, los archivos de muestra del escritorio y limpiará las configuraciones personalizadas.
                </p>
              </div>

              <button
                onClick={() => {
                  if (confirm('¿Está seguro de que desea restaurar los valores de fábrica del sistema operativo?')) {
                    resetAllSettings();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
              >
                <RotateCcw size={13} />
                <span>Restablecer sistema ahora</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enlarged Wallpaper Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-blue-500" />
                <span className="font-semibold text-xs">{previewItem.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 capitalize">
                  {previewItem.category.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Enlarged 16:9 Preview */}
            <div className="aspect-video w-full bg-slate-950 relative overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  background: previewItem.url
                    ? `url(${previewItem.url}) center/cover no-repeat`
                    : previewItem.gradient,
                }}
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-mono backdrop-blur-md">
                Resolución: 1920 × 1080 • Formato: 16:9
              </div>
            </div>

            {/* Footer and Info */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {previewItem.description || 'Fondo de pantalla oficial en formato panorámico'}
                </p>
                <span className="text-[11px] text-slate-400">
                  Optimizado para visualización de iconos de escritorio
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    applyWallpaper(previewItem);
                    setPreviewItem(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Aplicar fondo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
