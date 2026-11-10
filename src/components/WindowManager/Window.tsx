import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { WindowItem } from '../../types/os';
import { WindowControls } from './WindowControls';
import { AppIcon } from '../UI/AppIcon';
import { APPS_REGISTRY } from '../../apps/registry';

interface WindowProps {
  window: WindowItem;
  children: React.ReactNode;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const Window: React.FC<WindowProps> = ({ window: win, children }) => {
  const {
    activeWindowId,
    bringToFront,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    updateWindowPosition,
    updateWindowSize,
    settings,
  } = useOS();

  const isActive = activeWindowId === win.id;
  const isMinimized = win.state === 'minimized';
  const isMaximized = win.state === 'maximized';

  const appDef = APPS_REGISTRY[win.appId];
  const minWidth = appDef?.minSize.width || 320;
  const minHeight = appDef?.minSize.height || 240;

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; winX: number; winY: number }>({
    mouseX: 0,
    mouseY: 0,
    winX: 0,
    winY: 0,
  });

  // Resizing state
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    winX: number;
    winY: number;
    winWidth: number;
    winHeight: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    winX: 0,
    winY: 0,
    winWidth: 0,
    winHeight: 0,
  });

  // Start dragging
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized || e.button !== 0) return;
    bringToFront(win.id);
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.position.x,
      winY: win.position.y,
    };
  };

  // Start resizing
  const handleResizeStart = (e: React.MouseEvent, dir: ResizeDirection) => {
    if (isMaximized || e.button !== 0) return;
    e.stopPropagation();
    bringToFront(win.id);
    setResizeDirection(dir);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.position.x,
      winY: win.position.y,
      winWidth: win.size.width,
      winHeight: win.size.height,
    };
  };

  // Mouse move and up handler for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.mouseX;
        const deltaY = e.clientY - dragStartRef.current.mouseY;

        const newX = Math.max(-win.size.width + 100, Math.min(window.innerWidth - 80, dragStartRef.current.winX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - 80, dragStartRef.current.winY + deltaY));

        updateWindowPosition(win.id, { x: newX, y: newY });
      } else if (resizeDirection) {
        const deltaX = e.clientX - resizeStartRef.current.mouseX;
        const deltaY = e.clientY - resizeStartRef.current.mouseY;
        const { winX, winY, winWidth, winHeight } = resizeStartRef.current;

        let newWidth = winWidth;
        let newHeight = winHeight;
        let newX = winX;
        let newY = winY;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(minWidth, winWidth + deltaX);
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(minHeight, winHeight + deltaY);
        }
        if (resizeDirection.includes('w')) {
          const possibleWidth = winWidth - deltaX;
          if (possibleWidth >= minWidth) {
            newWidth = possibleWidth;
            newX = winX + deltaX;
          }
        }
        if (resizeDirection.includes('n')) {
          const possibleHeight = winHeight - deltaY;
          if (possibleHeight >= minHeight) {
            newHeight = possibleHeight;
            newY = winY + deltaY;
          }
        }

        updateWindowPosition(win.id, { x: newX, y: newY });
        updateWindowSize(win.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizeDirection(null);
    };

    if (isDragging || resizeDirection) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizeDirection, win.id, win.size.width, minWidth, minHeight, updateWindowPosition, updateWindowSize]);

  if (isMinimized) return null;

  return (
    <div
      onMouseDown={() => bringToFront(win.id)}
      className={`fixed flex flex-col overflow-hidden transition-shadow select-none ${
        settings.theme === 'dark' ? 'win-window-dark text-slate-100' : 'win-window-light text-slate-800'
      } ${isMaximized ? 'rounded-none border-0' : 'rounded-xl border border-black/15 dark:border-white/15'}`}
      style={{
        zIndex: win.zIndex,
        left: isMaximized ? 0 : `${win.position.x}px`,
        top: isMaximized ? 0 : `${win.position.y}px`,
        width: isMaximized ? '100vw' : `${win.size.width}px`,
        height: isMaximized ? 'calc(100vh - 48px)' : `${win.size.height}px`,
        boxShadow: isActive
          ? '0 24px 64px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 120, 212, 0.35)'
          : '0 12px 32px -8px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleDragStart}
        onDoubleClick={() => maximizeWindow(win.id)}
        className={`h-9 shrink-0 flex items-center justify-between pl-3 pr-0 cursor-default border-b transition-colors ${
          isActive
            ? 'bg-slate-100/70 dark:bg-slate-800/80 border-black/10 dark:border-white/10'
            : 'bg-slate-100/40 dark:bg-slate-900/60 border-black/5 dark:border-white/5 opacity-90'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate pointer-events-none">
          <AppIcon name={win.icon} size={16} />
          <span className="text-[12.5px] font-medium tracking-tight truncate select-none">
            {win.title}
          </span>
        </div>

        <WindowControls
          state={win.state}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onClose={() => closeWindow(win.id)}
        />
      </div>

      {/* Window Content Container */}
      <div className="relative flex-1 overflow-hidden bg-white/95 dark:bg-slate-900/95 flex flex-col">
        {children}
      </div>

      {/* 8-Direction Resize Handles (when not maximized) */}
      {!isMaximized && (
        <>
          <div
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            className="absolute top-0 left-2 right-2 h-1.5 cursor-ns-resize hover:bg-blue-500/20"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 's')}
            className="absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize hover:bg-blue-500/20"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            className="absolute top-2 bottom-2 left-0 w-1.5 cursor-ew-resize hover:bg-blue-500/20"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            className="absolute top-2 bottom-2 right-0 w-1.5 cursor-ew-resize hover:bg-blue-500/20"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize hover:bg-blue-500/30"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize hover:bg-blue-500/30"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize hover:bg-blue-500/30"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize hover:bg-blue-500/30"
          />
        </>
      )}
    </div>
  );
};
