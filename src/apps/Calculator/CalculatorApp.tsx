import React, { useState, useEffect } from 'react';
import { History, Delete, RotateCcw } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [resetNext, setResetNext] = useState(false);

  // Number press
  const handleNumber = (n: string) => {
    if (resetNext || display === '0') {
      setDisplay(n);
      setResetNext(false);
    } else {
      if (display.length < 16) {
        setDisplay(display + n);
      }
    }
  };

  // Decimal
  const handleDecimal = () => {
    if (resetNext) {
      setDisplay('0.');
      setResetNext(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  // Operators: +, -, *, /
  const handleOperator = (op: string) => {
    setExpression(`${display} ${op}`);
    setResetNext(true);
  };

  // Calculate
  const handleEquals = () => {
    if (!expression) return;
    try {
      const parts = expression.trim().split(' ');
      const num1 = parseFloat(parts[0]);
      const op = parts[1];
      const num2 = parseFloat(display);

      let result = 0;
      switch (op) {
        case '+':
          result = num1 + num2;
          break;
        case '-':
          result = num1 - num2;
          break;
        case '×':
          result = num1 * num2;
          break;
        case '÷':
          if (num2 === 0) {
            setDisplay('No se puede dividir entre 0');
            setResetNext(true);
            return;
          }
          result = num1 / num2;
          break;
        default:
          return;
      }

      // Format result
      const formatted = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(8)).toString();
      const historyItem = `${expression} ${display} = ${formatted}`;
      setHistory(prev => [historyItem, ...prev.slice(0, 20)]);
      setDisplay(formatted);
      setExpression('');
      setResetNext(true);
    } catch {
      setDisplay('Error');
      setResetNext(true);
    }
  };

  // Clear
  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setResetNext(false);
  };

  const handleClearEntry = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  // Sign invert
  const handleNegate = () => {
    const val = parseFloat(display);
    if (val !== 0) {
      setDisplay((-val).toString());
    }
  };

  // Percentage
  const handlePercentage = () => {
    const val = parseFloat(display);
    setDisplay((val / 100).toString());
  };

  // Square
  const handleSquare = () => {
    const val = parseFloat(display);
    const res = val * val;
    setExpression(`sqr(${val})`);
    setDisplay(parseFloat(res.toFixed(8)).toString());
    setResetNext(true);
  };

  // Square root
  const handleSquareRoot = () => {
    const val = parseFloat(display);
    if (val < 0) {
      setDisplay('Entrada no válida');
      setResetNext(true);
      return;
    }
    const res = Math.sqrt(val);
    setExpression(`√(${val})`);
    setDisplay(parseFloat(res.toFixed(8)).toString());
    setResetNext(true);
  };

  // Reciprocal (1/x)
  const handleReciprocal = () => {
    const val = parseFloat(display);
    if (val === 0) {
      setDisplay('No se puede dividir entre 0');
      setResetNext(true);
      return;
    }
    const res = 1 / val;
    setExpression(`1/(${val})`);
    setDisplay(parseFloat(res.toFixed(8)).toString());
    setResetNext(true);
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        handleNumber(e.key);
      } else if (e.key === '.') {
        handleDecimal();
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('-');
      } else if (e.key === '*') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header / History Toggle */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <span className="text-slate-600 dark:text-slate-400">Estándar</span>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
            showHistory ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : ''
          }`}
          title="Historial de cálculos"
        >
          <History size={15} />
        </button>
      </div>

      {/* Main calculation view */}
      <div className="relative flex-1 flex flex-col p-3">
        {/* Expression line */}
        <div className="h-6 text-right text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide pr-1">
          {expression}
        </div>

        {/* Display value */}
        <div className="flex-1 flex items-end justify-end mb-3 pr-1">
          <span className="text-3xl sm:text-4xl font-semibold tracking-tight font-mono truncate">
            {display}
          </span>
        </div>

        {/* Memory Bar */}
        <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
          <button
            onClick={() => {
              setMemory(0);
              setHasMemory(false);
            }}
            disabled={!hasMemory}
            className="py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
          >
            MC
          </button>
          <button
            onClick={() => {
              setDisplay(memory.toString());
              setResetNext(true);
            }}
            disabled={!hasMemory}
            className="py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
          >
            MR
          </button>
          <button
            onClick={() => {
              setMemory(prev => prev + parseFloat(display));
              setHasMemory(true);
            }}
            className="py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            M+
          </button>
          <button
            onClick={() => {
              setMemory(prev => prev - parseFloat(display));
              setHasMemory(true);
            }}
            className="py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            M-
          </button>
          <button
            onClick={() => {
              setMemory(parseFloat(display));
              setHasMemory(true);
            }}
            className="py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            MS
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-1 flex-1 min-h-[220px]">
          {/* Row 1 */}
          <button onClick={handlePercentage} className="btn-calc">%</button>
          <button onClick={handleClearEntry} className="btn-calc">CE</button>
          <button onClick={handleClear} className="btn-calc">C</button>
          <button onClick={handleBackspace} className="btn-calc flex items-center justify-center">
            <Delete size={15} />
          </button>

          {/* Row 2 */}
          <button onClick={handleReciprocal} className="btn-calc text-xs">¹/x</button>
          <button onClick={handleSquare} className="btn-calc text-xs">x²</button>
          <button onClick={handleSquareRoot} className="btn-calc text-xs">²√x</button>
          <button onClick={() => handleOperator('÷')} className="btn-calc-op">÷</button>

          {/* Row 3 */}
          <button onClick={() => handleNumber('7')} className="btn-calc-num">7</button>
          <button onClick={() => handleNumber('8')} className="btn-calc-num">8</button>
          <button onClick={() => handleNumber('9')} className="btn-calc-num">9</button>
          <button onClick={() => handleOperator('×')} className="btn-calc-op">×</button>

          {/* Row 4 */}
          <button onClick={() => handleNumber('4')} className="btn-calc-num">4</button>
          <button onClick={() => handleNumber('5')} className="btn-calc-num">5</button>
          <button onClick={() => handleNumber('6')} className="btn-calc-num">6</button>
          <button onClick={() => handleOperator('-')} className="btn-calc-op">-</button>

          {/* Row 5 */}
          <button onClick={() => handleNumber('1')} className="btn-calc-num">1</button>
          <button onClick={() => handleNumber('2')} className="btn-calc-num">2</button>
          <button onClick={() => handleNumber('3')} className="btn-calc-num">3</button>
          <button onClick={() => handleOperator('+')} className="btn-calc-op">+</button>

          {/* Row 6 */}
          <button onClick={handleNegate} className="btn-calc text-xs">+/-</button>
          <button onClick={() => handleNumber('0')} className="btn-calc-num">0</button>
          <button onClick={handleDecimal} className="btn-calc-num">.</button>
          <button onClick={handleEquals} className="btn-calc-eq">=</button>
        </div>

        {/* History overlay panel */}
        {showHistory && (
          <div className="absolute inset-x-0 bottom-0 top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 flex flex-col z-20 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-xs">Historial</span>
              <button
                onClick={() => setHistory([])}
                className="text-[11px] text-red-500 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} />
                Borrar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Aún no hay cálculos en el historial
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const res = item.split('=')[1]?.trim();
                      if (res) {
                        setDisplay(res);
                        setShowHistory(false);
                      }
                    }}
                    className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-right cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    <span className="text-xs font-mono">{item}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .btn-calc {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          font-weight: 500;
          font-size: 13px;
          transition: background 0.1s, transform 0.05s;
        }
        .dark .btn-calc {
          background: rgba(45, 48, 55, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-calc:hover {
          background: rgba(240, 240, 240, 0.9);
        }
        .dark .btn-calc:hover {
          background: rgba(60, 64, 72, 0.9);
        }
        .btn-calc:active {
          transform: scale(0.97);
        }
        .btn-calc-num {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          font-weight: 600;
          font-size: 15px;
          transition: background 0.1s, transform 0.05s;
        }
        .dark .btn-calc-num {
          background: #3b3e47;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-calc-num:hover {
          background: #f4f4f4;
        }
        .dark .btn-calc-num:hover {
          background: #4a4e59;
        }
        .btn-calc-num:active {
          transform: scale(0.97);
        }
        .btn-calc-op {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(240, 242, 245, 0.85);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          font-weight: 500;
          font-size: 16px;
          transition: background 0.1s, transform 0.05s;
        }
        .dark .btn-calc-op {
          background: rgba(45, 48, 55, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-calc-op:hover {
          background: rgba(225, 228, 235, 1);
        }
        .dark .btn-calc-op:hover {
          background: rgba(65, 70, 80, 1);
        }
        .btn-calc-op:active {
          transform: scale(0.97);
        }
        .btn-calc-eq {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0078d4;
          color: #ffffff;
          border-radius: 6px;
          font-weight: 600;
          font-size: 18px;
          transition: background 0.1s, transform 0.05s;
        }
        .btn-calc-eq:hover {
          background: #106ebe;
        }
        .btn-calc-eq:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
};
