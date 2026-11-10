import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Plus,
  X,
  Lock,
  Star,
  ExternalLink,
  Globe,
  Search,
  ShieldCheck,
  Bookmark,
  History,
} from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  canIframe: boolean;
}

const DEFAULT_BOOKMARKS = [
  { name: 'Wikipedia', url: 'https://es.m.wikipedia.org', canIframe: true },
  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/export/embed.html?bbox=-3.72%2C40.40%2C-3.68%2C40.44&layer=mapnik', canIframe: true },
  { name: 'Internet Archive', url: 'https://archive.org', canIframe: true },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', canIframe: false },
  { name: 'Bing', url: 'https://www.bing.com', canIframe: false },
  { name: 'GitHub', url: 'https://github.com', canIframe: false },
];

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 'tab_1',
      title: 'Página de inicio - Edge',
      url: 'edge://newtab',
      canIframe: true,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');
  const [urlInput, setUrlInput] = useState<string>('edge://newtab');
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);
  const [historyList, setHistoryList] = useState<string[]>(['edge://newtab']);
  const [showHistory, setShowHistory] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Switch tab
  const handleSelectTab = (tab: Tab) => {
    setActiveTabId(tab.id);
    setUrlInput(tab.url);
  };

  // Add tab
  const handleAddTab = () => {
    const newId = `tab_${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'Nueva pestaña',
      url: 'edge://newtab',
      canIframe: true,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput('edge://newtab');
  };

  // Close tab
  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // Keep at least one tab
      setTabs([
        {
          id: `tab_${Date.now()}`,
          title: 'Nueva pestaña',
          url: 'edge://newtab',
          canIframe: true,
        },
      ]);
      setUrlInput('edge://newtab');
      return;
    }
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[0].id);
      setUrlInput(filtered[0].url);
    }
  };

  // Navigate to URL
  const handleNavigate = (input: string) => {
    let finalUrl = input.trim();
    if (!finalUrl) return;

    if (finalUrl === 'edge://newtab' || finalUrl === 'about:blank') {
      updateActiveTab(finalUrl, 'Nueva pestaña', true);
      return;
    }

    // Check if search query or url
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        // Search via duckduckgo or wikipedia
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    // Known iframe policy
    const isStrictDomain = ['github.com', 'bing.com', 'google.com', 'twitter.com', 'x.com', 'facebook.com', 'duckduckgo.com'].some(d =>
      finalUrl.includes(d)
    );

    const title = finalUrl.replace(/^https?:\/\//, '').split('/')[0];
    updateActiveTab(finalUrl, title, !isStrictDomain);
    setHistoryList(prev => [finalUrl, ...prev.slice(0, 30)]);
  };

  const updateActiveTab = (url: string, title: string, canIframe: boolean) => {
    setTabs(prev =>
      prev.map(t => (t.id === activeTabId ? { ...t, url, title, canIframe } : t))
    );
    setUrlInput(url);
    setIframeKey(k => k + 1);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* Tab strip */}
      <div className="flex items-end px-2 pt-1.5 gap-1 bg-slate-200/80 dark:bg-slate-950/80 border-b border-slate-300 dark:border-slate-800 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => handleSelectTab(tab)}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg max-w-[200px] cursor-pointer text-xs transition-colors ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/50'
              }`}
            >
              <Globe size={13} className="text-blue-500 shrink-0" />
              <span className="truncate flex-1">{tab.title}</span>
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <button
          onClick={handleAddTab}
          className="p-1.5 rounded-full hover:bg-slate-300/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 mb-0.5"
          title="Nueva pestaña"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Navigation Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => updateActiveTab('edge://newtab', 'Página de inicio', true)}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Atrás"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          className="p-1 rounded opacity-40 cursor-not-allowed"
          title="Adelante"
        >
          <ArrowRight size={14} />
        </button>
        <button
          onClick={() => setIframeKey(k => k + 1)}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Recargar (F5)"
        >
          <RotateCw size={14} />
        </button>
        <button
          onClick={() => updateActiveTab('edge://newtab', 'Página de inicio', true)}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Página de inicio"
        >
          <Home size={14} />
        </button>

        {/* Address Bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <Lock size={12} className="text-emerald-500 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate(urlInput)}
            placeholder="Buscar en la web o escribir una dirección URL"
            className="flex-1 bg-transparent text-xs outline-none text-slate-800 dark:text-slate-100"
          />
          <button
            onClick={() => {
              if (!bookmarks.some(b => b.url === activeTab.url)) {
                setBookmarks(prev => [...prev, { name: activeTab.title, url: activeTab.url, canIframe: activeTab.canIframe }]);
              }
            }}
            className="p-0.5 text-slate-400 hover:text-amber-500 transition-colors"
            title="Agregar a favoritos"
          >
            <Star size={13} />
          </button>
        </div>

        {/* History Toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
            showHistory ? 'text-blue-500' : 'text-slate-600 dark:text-slate-400'
          }`}
          title="Historial"
        >
          <History size={15} />
        </button>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] overflow-x-auto">
        <Bookmark size={12} className="text-slate-400 shrink-0 mr-1" />
        {bookmarks.map((bm, bIdx) => (
          <button
            key={bIdx}
            onClick={() => handleNavigate(bm.url)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap transition-colors"
          >
            <span>{bm.name}</span>
          </button>
        ))}
      </div>

      {/* Viewport Content */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-950">
        {activeTab.url === 'edge://newtab' ? (
          /* Modern Win11 Start Page */
          <div className="h-full w-full overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-4">
              <Globe size={36} />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Microsoft Edge</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6">
              Navega en internet, accede a tus marcadores rápidos y explora contenido dentro del simulador.
            </p>

            {/* Quick search input */}
            <div className="w-full max-w-md flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md focus-within:ring-2 focus-within:ring-blue-500 mb-8">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar o escribir una dirección web..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNavigate((e.target as HTMLInputElement).value);
                  }
                }}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>

            {/* Quick links grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-xl w-full">
              {DEFAULT_BOOKMARKS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNavigate(item.url)}
                  className="flex flex-col items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform mb-1.5">
                    <Globe size={20} />
                  </div>
                  <span className="text-xs font-medium truncate w-full">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : activeTab.canIframe ? (
          /* Iframe Viewer */
          <iframe
            key={iframeKey}
            src={activeTab.url}
            title={activeTab.title}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          /* Iframe Block Notice with External Open Fallback */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                El sitio web restringe la inserción en marcos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Por políticas de seguridad (X-Frame-Options), <strong>{activeTab.url}</strong> no permite ser mostrado dentro de un contenedor iframe.
              </p>
            </div>

            <div className="flex gap-2">
              <a
                href={activeTab.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow transition-colors"
              >
                <span>Abrir en nueva pestaña real</span>
                <ExternalLink size={13} />
              </a>
              <button
                onClick={() => updateActiveTab('edge://newtab', 'Página de inicio', true)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}

        {/* History overlay sidebar */}
        {showHistory && (
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-800 p-3 shadow-xl z-20 flex flex-col animate-in slide-in-from-right duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-xs">Historial de navegación</span>
              <button onClick={() => setShowHistory(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 space-y-1">
              {historyList.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    handleNavigate(h);
                    setShowHistory(false);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xs truncate block text-slate-700 dark:text-slate-300"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
