import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { AppIcon } from '../../components/UI/AppIcon';
import {
  Activity,
  Cpu,
  Layers,
  HardDrive,
  Wifi,
  XCircle,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react';

export const TaskManagerApp: React.FC = () => {
  const { windows, closeWindow } = useOS();
  const [activeTab, setActiveTab] = useState<'processes' | 'performance' | 'startup'>('processes');

  // Simulated metrics
  const [cpuUsage, setCpuUsage] = useState(14);
  const [ramUsage, setRamUsage] = useState(38);
  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 18, 15, 22, 14, 16, 25, 20, 18, 14]);
  const [ramHistory, setRamHistory] = useState<number[]>([36, 37, 37, 38, 38, 39, 38, 38, 38, 38]);
  const [selectedWinId, setSelectedWinId] = useState<string | null>(null);

  // Background simulated processes
  const backgroundProcesses = [
    { name: 'Explorador de Windows', cpu: 1.2, ram: 48, status: 'Activo' },
    { name: 'Host de servicio: Audio de Windows', cpu: 0.3, ram: 14, status: 'En ejecución' },
    { name: 'Administrador de ventanas de escritorio (DWM)', cpu: 2.1, ram: 62, status: 'Activo' },
    { name: 'Antivirus Windows Defender', cpu: 0.5, ram: 86, status: 'Protegido' },
    { name: 'Aislamiento de gráficos de dispositivos', cpu: 0.1, ram: 12, status: 'En espera' },
    { name: 'Host de experiencia de Windows Shell', cpu: 0.8, ram: 34, status: 'En ejecución' },
  ];

  // Tick simulated numbers every 1.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const baseCpu = 8 + windows.length * 4;
      const jitter = (Math.random() * 8) - 4;
      const nextCpu = Math.max(5, Math.min(95, Math.round(baseCpu + jitter)));

      const baseRam = 32 + windows.length * 3;
      const ramJitter = (Math.random() * 2) - 1;
      const nextRam = Math.max(25, Math.min(90, Math.round(baseRam + ramJitter)));

      setCpuUsage(nextCpu);
      setRamUsage(nextRam);

      setCpuHistory(prev => [...prev.slice(1), nextCpu]);
      setRamHistory(prev => [...prev.slice(1), nextRam]);
    }, 1500);

    return () => clearInterval(timer);
  }, [windows.length]);

  const handleEndTask = () => {
    if (selectedWinId) {
      closeWindow(selectedWinId);
      setSelectedWinId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none text-xs">
      {/* Disclaimer banner */}
      <div className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-b border-blue-100 dark:border-blue-900/50 text-[11px] flex items-center justify-between">
        <span>* Métricas de CPU y memoria simuladas con fines interactivos.</span>
        <span className="font-mono text-[10px] opacity-80">Kernel Win11 Sim 26100</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('processes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-colors ${
            activeTab === 'processes'
              ? 'bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers size={13} />
          <span>Procesos</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-colors ${
            activeTab === 'performance'
              ? 'bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Activity size={13} />
          <span>Rendimiento</span>
        </button>

        <button
          onClick={() => setActiveTab('startup')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-colors ${
            activeTab === 'startup'
              ? 'bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Play size={13} />
          <span>Inicio</span>
        </button>

        {activeTab === 'processes' && selectedWinId && (
          <button
            onClick={handleEndTask}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium shadow-xs transition-colors mb-1"
          >
            <XCircle size={13} />
            <span>Finalizar tarea</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
        {activeTab === 'processes' && (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-700 z-10">
                <tr>
                  <th className="py-2 pl-3">Nombre</th>
                  <th className="py-2 w-24">Estado</th>
                  <th className="py-2 w-20 text-right">CPU</th>
                  <th className="py-2 w-24 text-right pr-4">Memoria</th>
                </tr>
              </thead>
              <tbody>
                {/* Apps Section */}
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400">
                  <td colSpan={4} className="py-1.5 pl-3">
                    Aplicaciones en primer plano ({windows.length})
                  </td>
                </tr>

                {windows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-slate-400 italic">
                      No hay aplicaciones abiertas en este momento
                    </td>
                  </tr>
                ) : (
                  windows.map((win, idx) => {
                    const isSelected = selectedWinId === win.id;
                    const simCpu = (3.5 + (idx % 3) * 1.8).toFixed(1);
                    const simRam = (42 + (idx % 4) * 26).toFixed(0);

                    return (
                      <tr
                        key={win.id}
                        onClick={() => setSelectedWinId(win.id)}
                        className={`cursor-pointer border-b border-slate-100 dark:border-slate-800/60 transition-colors ${
                          isSelected
                            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 pl-3 flex items-center gap-2.5">
                          <AppIcon name={win.icon} size={16} />
                          <span className="font-medium truncate max-w-xs">{win.title}</span>
                        </td>
                        <td className="py-2 text-slate-500 dark:text-slate-400">
                          {win.state === 'minimized' ? 'Minimizada' : 'En ejecución'}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-600 dark:text-slate-300">
                          {simCpu}%
                        </td>
                        <td className="py-2 text-right pr-4 font-mono text-slate-600 dark:text-slate-300">
                          {simRam} MB
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Background Processes */}
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400">
                  <td colSpan={4} className="py-1.5 pl-3">
                    Procesos en segundo plano ({backgroundProcesses.length})
                  </td>
                </tr>

                {backgroundProcesses.map((p, pIdx) => (
                  <tr
                    key={pIdx}
                    className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-1.5 pl-3 text-slate-700 dark:text-slate-300">
                      {p.name}
                    </td>
                    <td className="py-1.5 text-slate-400">{p.status}</td>
                    <td className="py-1.5 text-right font-mono text-slate-500">{p.cpu}%</td>
                    <td className="py-1.5 text-right pr-4 font-mono text-slate-500">{p.ram} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
            {/* CPU Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Cpu size={16} className="text-blue-500" />
                  <span>CPU (Procesador Virtual)</span>
                </div>
                <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                  {cpuUsage}%
                </span>
              </div>

              {/* Dynamic SVG chart */}
              <div className="h-28 w-full bg-slate-200/50 dark:bg-slate-900 rounded-lg p-1.5 flex items-end relative overflow-hidden border border-slate-300/40 dark:border-slate-800">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    points={`0,100 ${cpuHistory.map((val, i) => `${(i / (cpuHistory.length - 1)) * 100},${100 - val}`).join(' ')} 100,100`}
                  />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-500">
                <div>
                  <span className="block text-slate-400">Velocidad</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">3.40 GHz</span>
                </div>
                <div>
                  <span className="block text-slate-400">Procesos</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{112 + windows.length}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Subprocesos</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">1,842</span>
                </div>
              </div>
            </div>

            {/* RAM Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Layers size={16} className="text-purple-500" />
                  <span>Memoria RAM (Simulada)</span>
                </div>
                <span className="font-mono text-lg font-bold text-purple-600 dark:text-purple-400">
                  {ramUsage}% ({(ramUsage * 0.16).toFixed(1)} / 16.0 GB)
                </span>
              </div>

              {/* Dynamic SVG chart */}
              <div className="h-28 w-full bg-slate-200/50 dark:bg-slate-900 rounded-lg p-1.5 flex items-end relative overflow-hidden border border-slate-300/40 dark:border-slate-800">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline
                    fill="rgba(168, 85, 247, 0.15)"
                    stroke="#a855f7"
                    strokeWidth="2"
                    points={`0,100 ${ramHistory.map((val, i) => `${(i / (ramHistory.length - 1)) * 100},${100 - val}`).join(' ')} 100,100`}
                  />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-500">
                <div>
                  <span className="block text-slate-400">En uso</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{(ramUsage * 0.16).toFixed(1)} GB</span>
                </div>
                <div>
                  <span className="block text-slate-400">Disponible</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{(16 - (ramUsage * 0.16)).toFixed(1)} GB</span>
                </div>
                <div>
                  <span className="block text-slate-400">Velocidad</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">3200 MHz</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'startup' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <h4 className="font-semibold text-xs mb-3">Aplicaciones de inicio de sesión</h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 pl-3">Nombre</th>
                    <th className="py-2">Editor</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2 pr-3">Impacto de inicio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2 pl-3 font-medium">Windows Security Notifications</td>
                    <td className="py-2 text-slate-500">Microsoft Corporation</td>
                    <td className="py-2 text-emerald-600 font-medium">Habilitado</td>
                    <td className="py-2 pr-3 text-slate-500">Bajo</td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-3 font-medium">Microsoft OneDrive</td>
                    <td className="py-2 text-slate-500">Microsoft Corporation</td>
                    <td className="py-2 text-emerald-600 font-medium">Habilitado</td>
                    <td className="py-2 pr-3 text-amber-500">Medio</td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-3 font-medium">Edge Update Service</td>
                    <td className="py-2 text-slate-500">Microsoft Corporation</td>
                    <td className="py-2 text-slate-400">Deshabilitado</td>
                    <td className="py-2 pr-3 text-slate-500">Ninguno</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
        <div>Total de procesos: {backgroundProcesses.length + windows.length}</div>
        <div>Uptime del simulador: 0:42:15</div>
      </div>
    </div>
  );
};
