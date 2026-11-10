import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { FileSystemService } from '../../services/fileSystemService';

interface TerminalAppProps {
  windowId: string;
}

interface CommandLog {
  id: string;
  type: 'input' | 'output' | 'error';
  text: string;
}

export const TerminalApp: React.FC<TerminalAppProps> = ({ windowId }) => {
  const { openApp, closeWindow } = useOS();

  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'init_1',
      type: 'output',
      text: 'Microsoft Windows [Versión 11.0.26100.1742]\n(c) Microsoft Corporation. Todos los derechos reservados.\n\nEscriba "help" para ver la lista de comandos disponibles.\n',
    },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [fontColor, setFontColor] = useState('#cccccc');
  const [currentPath, setCurrentPath] = useState('C:\\Users\\Usuario');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setCurrentInput(history[history.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCurrentInput(history[history.length - 1 - nextIdx] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  const executeCommand = (cmdLine: string) => {
    const trimmed = cmdLine.trim();
    const promptLine = `${currentPath}> ${cmdLine}`;

    const newLogs: CommandLog[] = [
      ...logs,
      { id: `in_${Date.now()}`, type: 'input', text: promptLine },
    ];

    if (trimmed) {
      setHistory(prev => [...prev, trimmed]);
      setHistoryIndex(-1);
    }

    const parts = trimmed.split(' ');
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case '':
        break;

      case 'help':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `Comandos disponibles en el simulador:
  help            Muestra esta lista de comandos.
  dir             Muestra los archivos y carpetas del sistema.
  cls / clear     Limpia la pantalla de la consola.
  date            Muestra la fecha actual del sistema.
  time            Muestra la hora actual del sistema.
  ver             Muestra la versión de Windows.
  whoami          Muestra el usuario actual de la sesión.
  echo [texto]    Muestra un mensaje en pantalla.
  color [nombre]  Cambia el color de la fuente (green, cyan, yellow, white, red, matrix).
  calculator      Abre la aplicación Calculadora.
  calc            Alias para la Calculadora.
  notepad [arch]  Abre el Bloc de notas (opcionalmente con nombre de archivo).
  explorer [dir]  Abre el Explorador de archivos.
  taskmgr         Abre el Administrador de tareas.
  systeminfo      Muestra información del sistema operativo.
  tree            Muestra la estructura jerárquica de carpetas.
  type [archivo]  Muestra el contenido de un archivo de texto.
  exit            Cierra la ventana de la terminal.`,
        });
        break;

      case 'cls':
      case 'clear':
        setLogs([]);
        setCurrentInput('');
        return;

      case 'dir': {
        const files = FileSystemService.getAllFiles().filter(f => !f.isDeleted);
        let output = ` El volumen de la unidad C no tiene etiqueta.\n El número de serie del volumen es 8A3F-29B1\n\n Directorio de ${currentPath}\n\n`;
        files.forEach(f => {
          const dateStr = new Date(f.updatedAt).toLocaleDateString();
          const timeStr = new Date(f.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dirTag = f.type === 'folder' ? '<DIR>         ' : '              ';
          const sizeStr = f.size ? f.size.toString().padStart(8, ' ') : '        ';
          output += `${dateStr}  ${timeStr}    ${dirTag} ${sizeStr} ${f.name}\n`;
        });
        output += `\n               ${files.length} archivos\n`;
        newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: output });
        break;
      }

      case 'date':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `La fecha actual es: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        });
        break;

      case 'time':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `La hora actual es: ${new Date().toLocaleTimeString()}`,
        });
        break;

      case 'ver':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: 'Microsoft Windows [Versión 11.0.26100.1742 Pro 64-bit]',
        });
        break;

      case 'whoami':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: 'DESKTOP-SIMULATOR\\Usuario',
        });
        break;

      case 'echo':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: args.join(' '),
        });
        break;

      case 'color': {
        const col = args[0]?.toLowerCase();
        if (col === 'green' || col === 'a') setFontColor('#22c55e');
        else if (col === 'cyan' || col === 'b') setFontColor('#06b6d4');
        else if (col === 'yellow' || col === 'e') setFontColor('#eab308');
        else if (col === 'white' || col === 'f') setFontColor('#ffffff');
        else if (col === 'red' || col === 'c') setFontColor('#ef4444');
        else if (col === 'matrix') setFontColor('#00ff66');
        else {
          setFontColor('#cccccc');
          newLogs.push({
            id: `out_${Date.now()}`,
            type: 'output',
            text: 'Color restablecido. Colores disponibles: green, cyan, yellow, white, red, matrix.',
          });
          break;
        }
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `Color de terminal cambiado a: ${col}`,
        });
        break;
      }

      case 'calc':
      case 'calculator':
        openApp('calculator');
        newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: 'Iniciando Calculadora de Windows...' });
        break;

      case 'notepad':
        if (args.length > 0) {
          const fname = args.join(' ');
          const found = FileSystemService.getAllFiles().find(f => f.name.toLowerCase() === fname.toLowerCase());
          openApp('notepad', { initialFileId: found?.id, initialTitle: fname, initialContent: found?.content || '' });
          newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: `Abriendo "${fname}" en el Bloc de notas...` });
        } else {
          openApp('notepad');
          newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: 'Iniciando Bloc de notas...' });
        }
        break;

      case 'open':
        if (args[0]?.toLowerCase() === 'notepad') {
          openApp('notepad');
          newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: 'Iniciando Bloc de notas...' });
        } else if (args[0]?.toLowerCase() === 'explorer') {
          openApp('explorer');
          newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: 'Iniciando Explorador de archivos...' });
        } else {
          newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: `Uso: open notepad | open explorer` });
        }
        break;

      case 'explorer':
        openApp('explorer');
        newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: 'Iniciando Explorador de archivos...' });
        break;

      case 'taskmgr':
        openApp('taskmanager');
        newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: 'Iniciando Administrador de tareas...' });
        break;

      case 'systeminfo':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `Nombre del host:             DESKTOP-SIMULATOR
Nombre del SO:               Microsoft Windows 11 Pro
Versión del SO:              10.0.26100 Compilación 26100
Fabricante del SO:           Microsoft Corporation
Configuración del SO:        Estación de trabajo independiente
Tipo de compilación del SO:  Multiprocessor Free
Propiedad registrada de:     Usuario Windows
Procesador(es):              1 procesador(es) simulado virtual a 3.40 GHz
Memoria física total:        16,384 MB RAM
Memoria física disponible:   9,980 MB
Directorio de Windows:       C:\\Windows
Directorio del sistema:      C:\\Windows\\system32
Ubicación de red:            Dominio LOCALHOST`,
        });
        break;

      case 'tree':
        newLogs.push({
          id: `out_${Date.now()}`,
          type: 'output',
          text: `Listado de rutas de carpetas
C:.
├───Escritorio
│   └───Mis Proyectos
├───Documentos
├───Descargas
├───Imágenes
└───Música`,
        });
        break;

      case 'type':
      case 'cat': {
        const targetName = args.join(' ');
        if (!targetName) {
          newLogs.push({ id: `err_${Date.now()}`, type: 'error', text: 'Sintaxis del comando no válida. Uso: type [archivo]' });
        } else {
          const file = FileSystemService.getAllFiles().find(f => f.name.toLowerCase() === targetName.toLowerCase() && !f.isDeleted);
          if (file) {
            newLogs.push({ id: `out_${Date.now()}`, type: 'output', text: file.content || '(Archivo vacío)' });
          } else {
            newLogs.push({ id: `err_${Date.now()}`, type: 'error', text: `El sistema no puede encontrar el archivo especificado: ${targetName}` });
          }
        }
        break;
      }

      case 'exit':
        closeWindow(windowId);
        return;

      default:
        newLogs.push({
          id: `err_${Date.now()}`,
          type: 'error',
          text: `"${command}" no se reconoce como un comando interno o externo,\nprograma o archivo por lotes ejecutable. Escriba "help" para ver la ayuda.`,
        });
        break;
    }

    setLogs(newLogs);
    setCurrentInput('');
  };

  return (
    <div
      ref={containerRef}
      onClick={() => inputRef.current?.focus()}
      className="flex-1 flex flex-col h-full bg-[#0c0c0c] p-3 overflow-y-auto font-mono text-[13px] leading-relaxed select-text"
      style={{ color: fontColor }}
    >
      {/* Logs */}
      {logs.map((log) => (
        <div key={log.id} className="whitespace-pre-wrap break-all mb-1">
          {log.type === 'error' ? (
            <span className="text-red-400">{log.text}</span>
          ) : log.type === 'input' ? (
            <span className="text-slate-400 font-semibold">{log.text}</span>
          ) : (
            <span>{log.text}</span>
          )}
        </div>
      ))}

      {/* Input line */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-slate-400 font-semibold shrink-0">{currentPath}&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none border-none p-0 font-mono text-[13px]"
          style={{ color: fontColor }}
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};
