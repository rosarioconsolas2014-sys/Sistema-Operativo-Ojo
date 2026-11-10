import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { CalendarEvent } from '../../types/os';
import { auth } from '../../services/firebase';
import { syncService } from '../../services/firebaseSyncService';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  X,
} from 'lucide-react';

const CALENDAR_STORAGE_KEY = 'win11_calendar_events_v1';

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'evt_1',
    title: 'Lanzamiento Windows Simulator',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    color: '#0078d4',
    description: 'Revisión general de microaplicaciones y entorno de ventanas.',
  },
  {
    id: 'evt_2',
    title: 'Reunión de Arquitectura',
    date: new Date().toISOString().split('T')[0],
    time: '15:30',
    color: '#107c41',
    description: 'Sincronización de componentes React y persistencia en LocalStorage.',
  },
];

export const CalendarApp: React.FC = () => {
  const { addNotification } = useOS();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_EVENTS;
  });

  // Modal for new event
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newColor, setNewColor] = useState('#0078d4');
  const [newDesc, setNewDesc] = useState('');

  const saveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    try {
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleAddEvent = () => {
    if (!newTitle.trim()) return;

    const newEvt: CalendarEvent = {
      id: `evt_${Date.now()}`,
      title: newTitle.trim(),
      date: selectedDate,
      time: newTime,
      color: newColor,
      description: newDesc.trim(),
    };

    saveEvents([...events, newEvt]);
    if (auth.currentUser) {
      syncService.saveCalendarEvent(auth.currentUser.uid, newEvt);
    }
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    addNotification('Evento creado', `"${newEvt.title}" programado para el ${selectedDate}`, 'Calendario');
  };

  const handleDeleteEvent = (id: string) => {
    const next = events.filter(e => e.id !== id);
    saveEvents(next);
    if (auth.currentUser) {
      syncService.deleteCalendarEvent(auth.currentUser.uid, id);
    }
    addNotification('Evento eliminado', 'El evento ha sido eliminado de la agenda.', 'Calendario');
  };

  // Month calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const calendarDays = [];
  // Pad previous month days
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const selectedDateEvents = events.filter(e => e.date === selectedDate);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none text-xs">
      {/* Left Column: Month Calendar View */}
      <div className="flex-1 flex flex-col p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight">
              {monthNames[month]} {year}
            </h3>
            <p className="text-[11px] text-slate-500">Planifica tus eventos y tareas</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center font-medium text-slate-400 dark:text-slate-500 text-[11px] mb-1">
          <span>Dom</span>
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty_${idx}`} className="p-1 min-h-[44px]" />;
            }

            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dayString === new Date().toISOString().split('T')[0];
            const isSelected = dayString === selectedDate;
            const dayEvents = events.filter(e => e.date === dayString);

            return (
              <div
                key={`day_${day}`}
                onClick={() => setSelectedDate(dayString)}
                className={`p-1.5 min-h-[50px] rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500'
                    : isToday
                    ? 'border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800/80 font-bold'
                    : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[12px] font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </div>

                <div className="space-y-0.5 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[9.5px] px-1 py-0.5 rounded truncate text-white"
                      style={{ backgroundColor: ev.color }}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-slate-400">+{dayEvents.length - 2} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Events for Selected Date */}
      <div className="w-full md:w-72 bg-white dark:bg-slate-900 p-4 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400">Agenda para</span>
            <h4 className="font-bold text-sm tracking-tight">{selectedDate}</h4>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Events List */}
        <div className="flex-1 py-3 space-y-2.5 overflow-y-auto">
          {selectedDateEvents.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400">
              <CalendarIcon size={32} className="opacity-30 mb-2" />
              <p>No hay eventos programados para este día.</p>
            </div>
          ) : (
            selectedDateEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 relative group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: evt.color }}
                    />
                    <span className="font-semibold text-xs truncate max-w-[150px]">{evt.title}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                    title="Eliminar evento"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-1">
                  <Clock size={12} />
                  <span>{evt.time}</span>
                </div>

                {evt.description && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    {evt.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-sm">Nuevo Evento</h4>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Título</label>
                <input
                  type="text"
                  placeholder="Ej: Reunión de proyecto"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Hora</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Etiqueta de color</label>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {['#0078d4', '#107c41', '#d83b01', '#8764b8', '#e3008c'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-blue-400' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddEvent}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
