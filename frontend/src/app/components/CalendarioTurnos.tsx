import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Scissors, Plus, X } from 'lucide-react';

interface Turno {
  id: string;
  hora: string;
  cliente: string;
  servicio: string;
  profesional: string;
  duracion: number;
  estado: 'confirmado' | 'pendiente' | 'cancelado' | 'completado';
}

interface DaySchedule {
  [key: string]: Turno[];
}

export function CalendarioTurnos() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 18)); // Mayo 18, 2026
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');

  // Datos de ejemplo
  const appointments: DaySchedule = {
    '2026-05-18': [
      {
        id: '1',
        hora: '09:00',
        cliente: 'María González',
        servicio: 'Facial Hidratante',
        profesional: 'Dra. López',
        duracion: 60,
        estado: 'confirmado'
      },
      {
        id: '2',
        hora: '10:30',
        cliente: 'Ana Rodríguez',
        servicio: 'Masaje Relajante',
        profesional: 'Lic. Martínez',
        duracion: 90,
        estado: 'confirmado'
      },
      {
        id: '3',
        hora: '14:00',
        cliente: 'Laura Fernández',
        servicio: 'Depilación Láser',
        profesional: 'Téc. García',
        duracion: 45,
        estado: 'pendiente'
      },
      {
        id: '4',
        hora: '15:30',
        cliente: 'Sofía Pérez',
        servicio: 'Manicura',
        profesional: 'Est. Torres',
        duracion: 60,
        estado: 'confirmado'
      }
    ],
    '2026-05-19': [
      {
        id: '5',
        hora: '10:00',
        cliente: 'Carla Martín',
        servicio: 'Limpieza Facial',
        profesional: 'Dra. López',
        duracion: 75,
        estado: 'confirmado'
      },
      {
        id: '6',
        hora: '12:00',
        cliente: 'Patricia Silva',
        servicio: 'Masaje Descontracturante',
        profesional: 'Lic. Martínez',
        duracion: 60,
        estado: 'confirmado'
      }
    ],
    '2026-05-20': [
      {
        id: '7',
        hora: '09:30',
        cliente: 'Daniela Ruiz',
        servicio: 'Tratamiento Antiarrugas',
        profesional: 'Dra. López',
        duracion: 90,
        estado: 'confirmado'
      },
      {
        id: '8',
        hora: '11:30',
        cliente: 'Valentina Castro',
        servicio: 'Pedicura',
        profesional: 'Est. Torres',
        duracion: 75,
        estado: 'pendiente'
      },
      {
        id: '9',
        hora: '15:00',
        cliente: 'Lucía Morales',
        servicio: 'Depilación Completa',
        profesional: 'Téc. García',
        duracion: 60,
        estado: 'confirmado'
      }
    ],
    '2026-05-21': [
      {
        id: '10',
        hora: '10:00',
        cliente: 'Florencia Díaz',
        servicio: 'Facial Hidratante',
        profesional: 'Dra. López',
        duracion: 60,
        estado: 'confirmado'
      }
    ]
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getAppointmentsForDate = (date: Date): Turno[] => {
    const key = formatDateKey(date);
    return appointments[key] || [];
  };

  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const getEstadoColor = (estado: Turno['estado']) => {
    switch (estado) {
      case 'confirmado': return 'bg-green-500';
      case 'pendiente': return 'bg-yellow-500';
      case 'cancelado': return 'bg-red-500';
      case 'completado': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-secondary/30" />);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.toDateString() === new Date(2026, 4, 18).toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 border border-border p-2 cursor-pointer hover:bg-accent transition-colors ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-card'
            }`}
          onClick={() => setSelectedDay(date)}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
            {day}
            {isToday && <span className="ml-1 text-xs">(Hoy)</span>}
          </div>
          <div className="space-y-1">
            {dayAppointments.slice(0, 2).map((apt) => (
              <div
                key={apt.id}
                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded truncate"
              >
                {apt.hora} - {apt.cliente}
              </div>
            ))}
            {dayAppointments.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{dayAppointments.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary p-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-0">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="bg-secondary p-2 text-center text-sm font-medium border-b border-border">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(new Date(currentDate));
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00

    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 border-b border-border">
          <div className="p-4 bg-secondary" />
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === new Date(2026, 4, 18).toDateString();
            return (
              <div
                key={idx}
                className={`p-4 text-center ${isToday ? 'bg-blue-100' : 'bg-secondary'}`}
              >
                <div className="text-xs text-muted-foreground">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day.getDay()]}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-border min-h-[80px]">
              <div className="p-2 text-sm text-muted-foreground bg-secondary flex items-start justify-center">
                {hour}:00
              </div>
              {weekDays.map((day, idx) => {
                const dayAppointments = getAppointmentsForDate(day);
                const hourAppointments = dayAppointments.filter((apt) => {
                  const aptHour = parseInt(apt.hora.split(':')[0]);
                  return aptHour === hour;
                });

                return (
                  <div key={idx} className="p-1 border-l border-border hover:bg-accent/50 cursor-pointer relative">
                    {hourAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded text-xs mb-1 relative"
                        style={{ height: `${(apt.duracion / 60) * 80}px`, minHeight: '60px' }}
                      >
                        <div className="font-medium">{apt.cliente}</div>
                        <div className="opacity-90">{apt.servicio}</div>
                        <div className="opacity-75 text-xs">{apt.profesional}</div>
                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getEstadoColor(apt.estado)}`} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);
    const dayAppointments = getAppointmentsForDate(currentDate);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-secondary p-4">
            <h3 className="font-semibold text-lg">
              {currentDate.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {hours.map((hour) => {
              const hourAppointments = dayAppointments.filter((apt) => {
                const aptHour = parseInt(apt.hora.split(':')[0]);
                return aptHour === hour;
              });

              return (
                <div key={hour} className="flex border-b border-border min-h-[80px]">
                  <div className="w-20 p-4 text-sm text-muted-foreground bg-secondary flex items-start justify-center">
                    {hour}:00
                  </div>
                  <div className="flex-1 p-2 hover:bg-accent/50 cursor-pointer">
                    {hourAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-2"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{apt.hora}</span>
                            <span className="text-xs opacity-75">({apt.duracion} min)</span>
                          </div>
                          <span className={`w-3 h-3 rounded-full ${getEstadoColor(apt.estado)}`} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{apt.cliente}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            <span className="text-sm">{apt.servicio}</span>
                          </div>
                          <div className="text-sm opacity-90">Prof: {apt.profesional}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Resumen del Día</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Turnos:</span>
                <span className="font-semibold">{dayAppointments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmados:</span>
                <span className="font-semibold text-green-600">
                  {dayAppointments.filter(a => a.estado === 'confirmado').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendientes:</span>
                <span className="font-semibold text-yellow-600">
                  {dayAppointments.filter(a => a.estado === 'pendiente').length}
                </span>
              </div>
            </div>
          </div>

          <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Turno
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Calendario de Turnos</h2>
          <p className="text-muted-foreground mt-1">Vista interactiva de la agenda</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded transition-colors ${viewMode === 'day' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded transition-colors ${viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded transition-colors ${viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
        <button
          onClick={previousPeriod}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {viewMode === 'month' && currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && `Semana del ${getWeekDays(new Date(currentDate))[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
        </div>

        <button
          onClick={nextPeriod}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {selectedDay && viewMode === 'month' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-secondary p-4 flex items-center justify-between border-b border-border">
              <h3 className="font-semibold text-lg">
                {selectedDay.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {getAppointmentsForDate(selectedDay).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay turnos para este día</p>
              ) : (
                getAppointmentsForDate(selectedDay).map((apt) => (
                  <div key={apt.id} className="bg-secondary p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <span className="font-semibold">{apt.hora}</span>
                        <span className="text-sm text-muted-foreground">({apt.duracion} min)</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs text-white ${getEstadoColor(apt.estado)}`}
                      >
                        {apt.estado}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{apt.cliente}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-muted-foreground" />
                        <span>{apt.servicio}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Profesional: {apt.profesional}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
