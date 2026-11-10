import React from 'react';
import { useOS } from '../../context/OSContext';
import { Window } from './Window';
import { ExplorerApp } from '../../apps/Explorer/ExplorerApp';
import { NotepadApp } from '../../apps/Notepad/NotepadApp';
import { CalculatorApp } from '../../apps/Calculator/CalculatorApp';
import { BrowserApp } from '../../apps/Browser/BrowserApp';
import { TaskManagerApp } from '../../apps/TaskManager/TaskManagerApp';
import { MediaPlayerApp } from '../../apps/MediaPlayer/MediaPlayerApp';
import { CalendarApp } from '../../apps/Calendar/CalendarApp';
import { PaintApp } from '../../apps/Paint/PaintApp';
import { TerminalApp } from '../../apps/Terminal/TerminalApp';
import { RecycleBinApp } from '../../apps/RecycleBin/RecycleBinApp';
import { SettingsApp } from '../../apps/Settings/SettingsApp';

export const WindowManager: React.FC = () => {
  const { windows } = useOS();

  const renderAppContent = (win: typeof windows[0]) => {
    switch (win.appId) {
      case 'explorer':
        return <ExplorerApp windowId={win.id} meta={win.meta} />;
      case 'notepad':
        return <NotepadApp windowId={win.id} meta={win.meta} />;
      case 'calculator':
        return <CalculatorApp />;
      case 'browser':
        return <BrowserApp />;
      case 'taskmanager':
        return <TaskManagerApp />;
      case 'mediaplayer':
        return <MediaPlayerApp meta={win.meta} />;
      case 'calendar':
        return <CalendarApp />;
      case 'paint':
        return <PaintApp />;
      case 'terminal':
        return <TerminalApp windowId={win.id} />;
      case 'recyclebin':
        return <RecycleBinApp />;
      case 'settings':
        return <SettingsApp meta={win.meta} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-6 text-slate-500">
            Aplicación no encontrada
          </div>
        );
    }
  };

  return (
    <div id="window-manager-root" className="pointer-events-none">
      {windows.map((win) => (
        <div key={win.id} className="pointer-events-auto">
          <Window window={win}>
            {renderAppContent(win)}
          </Window>
        </div>
      ))}
    </div>
  );
};
