import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { FileSystemService } from '../../services/fileSystemService';
import { auth } from '../../services/firebase';
import { syncService } from '../../services/firebaseSyncService';
import {
  Pencil,
  Eraser,
  Minus,
  Square,
  Circle,
  PaintBucket,
  RotateCcw,
  Trash2,
  Download,
  Save,
  Palette,
} from 'lucide-react';

type Tool = 'pencil' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'fill';

const COLOR_PALETTE = [
  '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
  '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
];

export const PaintApp: React.FC = () => {
  const { addNotification, refreshFiles } = useOS();

  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [history, setHistory] = useState<ImageData[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 900;
    canvas.height = 600;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial history
    const initialSnap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialSnap]);
  }, []);

  const saveStateToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-15), snap]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextHistory = [...history];
    nextHistory.pop(); // Remove current
    const previous = nextHistory[nextHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(nextHistory);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveStateToHistory();
  };

  // Mouse drawing handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    isDrawingRef.current = true;
    startPosRef.current = coords;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (activeTool === 'fill') {
      ctx.fillStyle = currentColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      isDrawingRef.current = false;
      saveStateToHistory();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : currentColor;
    ctx.lineWidth = activeTool === 'eraser' ? brushSize * 2.5 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (snapshotRef.current) {
      // Put initial snapshot back
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';

      if (activeTool === 'line') {
        ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      } else if (activeTool === 'rectangle') {
        const width = coords.x - startPosRef.current.x;
        const height = coords.y - startPosRef.current.y;
        ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, width, height);
      } else if (activeTool === 'circle') {
        const radiusX = Math.abs(coords.x - startPosRef.current.x) / 2;
        const radiusY = Math.abs(coords.y - startPosRef.current.y) / 2;
        const centerX = startPosRef.current.x + (coords.x - startPosRef.current.x) / 2;
        const centerY = startPosRef.current.y + (coords.y - startPosRef.current.y) / 2;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      saveStateToHistory();
    }
  };

  // Download drawing
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `dibujo_${Date.now()}.png`;
    a.click();
    addNotification('Descarga completa', 'Tu dibujo se ha guardado como archivo PNG.', 'Paint');
  };

  // Save to Virtual File System & Firebase Storage
  const handleSaveToOS = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const fileName = `dibujo_${Date.now()}.png`;

    try {
      if (auth.currentUser) {
        // Upload to Firebase Storage
        const downloadUrl = await syncService.uploadDataUrl(auth.currentUser.uid, `paint/${fileName}`, dataUrl);
        FileSystemService.createFile('folder_pictures', fileName, downloadUrl, 'png');
        addNotification('Guardado en la nube', `Dibujo guardado en Imágenes y subido a Firebase Storage.`, 'Paint');
      } else {
        FileSystemService.createFile('folder_pictures', fileName, dataUrl, 'png');
        addNotification('Guardado en el sistema', `Dibujo guardado en la carpeta Imágenes como "${fileName}"`, 'Paint');
      }
      refreshFiles();
    } catch (e) {
      console.warn('Storage upload error, saving locally:', e);
      FileSystemService.createFile('folder_pictures', fileName, dataUrl, 'png');
      refreshFiles();
      addNotification('Guardado en el sistema', `Dibujo guardado en la carpeta Imágenes como "${fileName}"`, 'Paint');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none text-xs">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80">
        {/* Tools Section */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTool('pencil')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'pencil' ? 'bg-blue-500 text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Lápiz"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'eraser' ? 'bg-blue-500 text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Borrador"
          >
            <Eraser size={15} />
          </button>
          <button
            onClick={() => setActiveTool('fill')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'fill' ? 'bg-blue-500 text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Rellenar lienzo"
          >
            <PaintBucket size={15} />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700" />

        {/* Shapes */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTool('line')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'line' ? 'bg-blue-500 text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Línea recta"
          >
            <Minus size={15} />
          </button>
          <button
            onClick={() => setActiveTool('rectangle')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'rectangle' ? 'bg-blue-500 text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Rectángulo"
          >
            <Square size={15} />
          </button>
          <button
            onClick={() => setActiveTool('circle')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTool === 'circle' ? 'bg-blue-500 text-white shadow-xs' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Círculo"
          >
            <Circle size={15} />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700" />

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Grosor:</span>
          <input
            type="range"
            min={1}
            max={36}
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="font-mono text-[11px] w-5 text-right">{brushSize}px</span>
        </div>

        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700" />

        {/* Palette Grid */}
        <div className="flex items-center gap-2">
          {/* Current color circle */}
          <div className="relative">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div
              className="w-7 h-7 rounded-lg border-2 border-white shadow-md ring-1 ring-slate-300 cursor-pointer"
              style={{ backgroundColor: currentColor }}
              title="Seleccionar color personalizado"
            />
          </div>

          <div className="grid grid-cols-10 gap-1">
            {COLOR_PALETTE.map((c, i) => (
              <button
                key={i}
                onClick={() => setCurrentColor(c)}
                className={`w-4 h-4 rounded-xs border border-black/20 transition-transform ${
                  currentColor === c ? 'scale-125 ring-2 ring-blue-500' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Actions (Undo, Clear, Save, Download) */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
            title="Deshacer"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
            title="Limpiar lienzo"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={handleSaveToOS}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors"
            title="Guardar en carpeta Imágenes de Windows"
          >
            <Save size={14} />
            <span>Guardar</span>
          </button>
          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs transition-colors"
            title="Descargar como archivo PNG"
          >
            <Download size={14} />
            <span>Descargar PNG</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 overflow-auto bg-slate-200/80 dark:bg-slate-950 p-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-white shadow-2xl rounded cursor-crosshair border border-slate-300/80 dark:border-slate-800"
          style={{ width: '900px', height: '600px', maxWidth: '100%' }}
        />
      </div>

      {/* Canvas Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
        <span>Lienzo: 900 x 600 px</span>
        <span>Herramienta: {activeTool.toUpperCase()} | Color: {currentColor}</span>
      </div>
    </div>
  );
};
