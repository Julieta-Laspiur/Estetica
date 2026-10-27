import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Scissors, X, RefreshCw } from 'lucide-react';
import { turnosApi } from '../../services/api';

interface CalendarTurno {
  id: string;
  hora: string;
  cliente: string;
  servicio: string;
  profesional: string;
  duracion: number;
  estado: 'confirmado' | 'pendiente' | 'cancelado' | 'completado';
}

interface DaySchedule {
  [key: string]: CalendarTurno[];
}

export function CalendarioTurnos() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [appointments, setAppointments] = useState<DaySchedule>({});
  const [loading, setLoading] = useState(true);

  const cargarTurnosCalendario = async () => {
    setLoading(true);
    try {
      const data = await turnosApi.getTurnos();
      const schedule: DaySchedule = {};

      data.forEach(t => {
        const dateObj = new Date(t.fechaHoraInicio);
        const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        const hora = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const duracion = t.servicios?.[0]?.duracionMin || 60;
        const servicio = t.servicios?.[0]?.nombre || 'Tratamiento';

        let estadoNorm: 'confirmado' | 'pendiente' | 'cancelado' | 'completado' = 'pendiente';
        if (t.estado === 1 || String(t.estado).toLowerCase().includes('conf')) estadoNorm = 'confirmado';
        else if (t.estado === 2 || String(t.estado).toLowerCase().includes('comp')) estadoNorm = 'completado';
        else if (t.estado === 3 || String(t.estado).toLowerCase().includes('canc')) estadoNorm = 'cancelado';

        const item: CalendarTurno = {
          id: String(t.turnoId),
          hora,
          cliente: t.clienteNombreCompleto || 'Cliente',
          servicio,
          profesional: t.profesionalNombreCompleto || 'Profesional',
          duracion,
          estado: estadoNorm,
        };

        if (!schedule[dateKey]) {
          schedule[dateKey] = [];
        }
        schedule[dateKey].push(item);
      });

      setAppointments(schedule);
    } catch (err) {
      console.error('Error al cargar agenda para calendario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTurnosCalendario();
  }, []);

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
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

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

  const getAppointmentsForDate = (date: Date): CalendarTurno[] => {
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

  const getEstadoColor = (estado: CalendarTurno['estado']) => {
    switch (estado) {
      case 'confirmado': return 'bg-green-600';
      case 'pendiente': return 'bg-amber-500';
      case 'cancelado': return 'bg-red-500';
      case 'completado': return 'bg-blue-600';
      default: return 'bg-gray-400';
    }
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const todayStr = new Date().toDateString();

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 bg-[#FAF8F5]/50 border border-[#EDE8E1]" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.toDateString() === todayStr;

      days.push(
        <div
          key={day}
          className={`h-28 border border-[#EDE8E1] p-2 cursor-pointer hover:bg-[#FAF8F5] transition-colors ${
            isToday ? 'bg-amber-50/50 border-amber-300' : 'bg-white'
          }`}
          onClick={() => setSelectedDay(date)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold ${isToday ? 'text-[#7A3B3B]' : 'text-[#2A2825]'}`}>
              {day}
            </span>
            {isToday && <span className="text-[10px] font-semibold text-[#7A3B3B]">Hoy</span>}
          </div>
          <div className="space-y-1">
            {dayAppointments.slice(0, 2).map((apt) => (
              <div
                key={apt.id}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EDE8E1] text-[#3C3530] font-medium truncate flex items-center gap-1"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${getEstadoColor(apt.estado)}`} />
                <span>{apt.hora}</span>
                <span className="truncate">{apt.cliente}</span>
              </div>
            ))}
            {dayAppointments.length > 2 && (
              <div className="text-[10px] text-[#8A7F74] font-medium">
                +{dayAppointments.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-[#EDE8E1] rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-[#FAF8F5] p-4 flex items-center justify-between border-b border-[#EDE8E1]">
          <h3 className="font-bold text-base text-[#2A2825]">
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-0">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="bg-[#FAF8F5] p-2 text-center text-xs font-bold text-[#7A3B3B] border-b border-[#EDE8E1]">
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
    const hours = Array.from({ length: 11 }, (_, i) => i + 9); // 9:00 - 19:00
    const todayStr = new Date().toDateString();

    return (
      <div className="bg-white border border-[#EDE8E1] rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-8 border-b border-[#EDE8E1]">
          <div className="p-3 bg-[#FAF8F5]" />
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === todayStr;
            return (
              <div
                key={idx}
                className={`p-3 text-center border-l border-[#EDE8E1] ${isToday ? 'bg-amber-50/70' : 'bg-[#FAF8F5]'}`}
              >
                <div className="text-[11px] font-medium text-[#8A7F74]">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day.getDay()]}
                </div>
                <div className={`text-base font-bold ${isToday ? 'text-[#7A3B3B]' : 'text-[#2A2825]'}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-y-auto max-h-[580px]">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-[#EDE8E1] min-h-[75px]">
              <div className="p-2 text-xs font-semibold text-[#8A7F74] bg-[#FAF8F5] flex items-start justify-center">
                {hour}:00
              </div>
              {weekDays.map((day, idx) => {
                const dayAppointments = getAppointmentsForDate(day);
                const hourAppointments = dayAppointments.filter((apt) => {
                  const aptHour = parseInt(apt.hora.split(':')[0]);
                  return aptHour === hour;
                });

                return (
                  <div key={idx} className="p-1 border-l border-[#EDE8E1] hover:bg-[#FAF8F5]/50 transition-colors relative">
                    {hourAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-gradient-to-r from-[#3C3530] to-[#2A2825] text-white p-2 rounded-xl text-xs mb-1 relative shadow-sm"
                        style={{ minHeight: '55px' }}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-[11px] text-[#D4C8BC]">{apt.hora}</span>
                          <span className={`w-2 h-2 rounded-full ${getEstadoColor(apt.estado)}`} />
                        </div>
                        <div className="font-semibold text-xs leading-tight truncate">{apt.cliente}</div>
                        <div className="text-[10px] text-white/70 truncate">{apt.servicio}</div>
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
    const hours = Array.from({ length: 11 }, (_, i) => i + 9);
    const dayAppointments = getAppointmentsForDate(currentDate);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#EDE8E1] rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#FAF8F5] p-4 border-b border-[#EDE8E1]">
            <h3 className="font-bold text-base text-[#2A2825] capitalize">
              {currentDate.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>
          <div className="overflow-y-auto max-h-[580px]">
            {hours.map((hour) => {
              const hourAppointments = dayAppointments.filter((apt) => {
                const aptHour = parseInt(apt.hora.split(':')[0]);
                return aptHour === hour;
              });

              return (
                <div key={hour} className="flex border-b border-[#EDE8E1] min-h-[75px]">
                  <div className="w-20 p-3 text-xs font-semibold text-[#8A7F74] bg-[#FAF8F5] flex items-start justify-center">
                    {hour}:00
                  </div>
                  <div className="flex-1 p-2 hover:bg-[#FAF8F5]/40 transition-colors">
                    {hourAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-gradient-to-r from-[#3C3530] to-[#2A2825] text-white p-4 rounded-xl mb-2 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#D4C8BC]" />
                            <span className="font-bold text-xs">{apt.hora}</span>
                            <span className="text-[11px] text-white/70">({apt.duracion} min)</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${getEstadoColor(apt.estado)}`}>
                            {apt.estado}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <User className="w-3.5 h-3.5 text-[#D4C8BC]" />
                            <span>{apt.cliente}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/80">
                            <Scissors className="w-3.5 h-3.5 text-[#D4C8BC]" />
                            <span>{apt.servicio}</span>
                          </div>
                          <div className="text-[11px] text-white/60">Prof: {apt.profesional}</div>
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
          <div className="bg-white border border-[#EDE8E1] rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-[#2A2825] mb-3">Resumen de la Jornada</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between pb-2 border-b border-[#EDE8E1]">
                <span className="text-[#8A7F74]">Total Turnos:</span>
                <span className="font-bold text-[#2A2825]">{dayAppointments.length}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#EDE8E1]">
                <span className="text-[#8A7F74]">Confirmados:</span>
                <span className="font-bold text-green-700">
                  {dayAppointments.filter(a => a.estado === 'confirmado').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7F74]">Pendientes:</span>
                <span className="font-bold text-amber-700">
                  {dayAppointments.filter(a => a.estado === 'pendiente').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2A2825]">Calendario de Turnos</h2>
          <p className="text-sm text-[#8A7F74] mt-0.5">Vista interactiva de la agenda de profesionales y cabinas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarTurnosCalendario}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] transition-colors"
            title="Refrescar agenda"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'day' ? 'bg-[#3C3530] text-white shadow-sm' : 'text-[#8A7F74] hover:text-[#2A2825]'}`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'week' ? 'bg-[#3C3530] text-white shadow-sm' : 'text-[#8A7F74] hover:text-[#2A2825]'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'month' ? 'bg-[#3C3530] text-white shadow-sm' : 'text-[#8A7F74] hover:text-[#2A2825]'}`}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* Navegación de Período */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <button
          onClick={previousPeriod}
          className="p-2 hover:bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] text-[#3C3530] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="text-sm font-bold text-[#2A2825] capitalize">
            {viewMode === 'month' && currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && `Semana del ${getWeekDays(new Date(currentDate))[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
        </div>

        <button
          onClick={nextPeriod}
          className="p-2 hover:bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] text-[#3C3530] transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Views */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* MODAL DETALLE DE DÍA DESDE VISTA MES */}
      {selectedDay && viewMode === 'month' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-[#EDE8E1] shadow-xl">
            <div className="sticky top-0 bg-[#FAF8F5] p-4 flex items-center justify-between border-b border-[#EDE8E1]">
              <h3 className="font-bold text-sm text-[#2A2825] capitalize">
                {selectedDay.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-[#8A7F74] hover:bg-[#EDE8E1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {getAppointmentsForDate(selectedDay).length === 0 ? (
                <p className="text-center text-[#8A7F74] text-xs py-8">No hay turnos agendados para este día.</p>
              ) : (
                getAppointmentsForDate(selectedDay).map((apt) => (
                  <div key={apt.id} className="bg-[#FAF8F5] border border-[#EDE8E1] p-3.5 rounded-xl">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#7A3B3B]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{apt.hora} ({apt.duracion} min)</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${getEstadoColor(apt.estado)}`}>
                        {apt.estado}
                      </span>
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-[#2A2825]">{apt.cliente}</div>
                      <div className="text-[#8A7F74]">{apt.servicio}</div>
                      <div className="text-[11px] text-[#8A7F74]">Profesional: {apt.profesional}</div>
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
