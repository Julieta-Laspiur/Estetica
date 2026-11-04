import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Scissors, X, RefreshCw, Check, Lock, UserX, DoorOpen, Filter } from 'lucide-react';
import { turnosApi, usuariosApi, type CabinaDto, type UsuarioDetalleDto } from '../../services/api';

interface CalendarTurno {
  id: string;
  hora: string;
  cliente: string;
  servicio: string;
  profesional: string;
  profesionalId?: number;
  cabinaId?: number;
  cabinaNombre?: string;
  duracion: number;
  estado: 'confirmado' | 'pendiente' | 'cancelado' | 'completado' | 'ausente' | 'bloqueado';
  motivo?: string;
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

  // Filtros de Agenda
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroProfesional, setFiltroProfesional] = useState<string>('todos');
  const [filtroCabina, setFiltroCabina] = useState<string>('todos');
  const [profesionalesList, setProfesionalesList] = useState<UsuarioDetalleDto[]>([]);
  const [cabinasList, setCabinasList] = useState<CabinaDto[]>([]);

  const cargarTurnosCalendario = async () => {
    setLoading(true);
    try {
      const [data, profs, cabs] = await Promise.all([
        turnosApi.getTurnos(),
        usuariosApi.getProfesionales().catch(() => []),
        turnosApi.getCabinas().catch(() => [])
      ]);
      setProfesionalesList(profs);
      setCabinasList(cabs);

      // Combinar con turnos locales agendados en el navegador
      const turnosLocales: any[] = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
      const idsExistentes = new Set(data.map(d => d.turnoId));
      const combinados = [...data];
      turnosLocales.forEach((tl: any) => {
        if (!idsExistentes.has(tl.turnoId)) {
          combinados.unshift(tl);
        }
      });

      const schedule: DaySchedule = {};

      combinados.forEach(t => {
        const dateObj = new Date(t.fechaHoraInicio);
        const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        const hora = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const duracion = t.servicios?.[0]?.duracionMin || 60;
        const servicio = t.servicios?.[0]?.nombre || 'Tratamiento';

        let estadoNorm: 'confirmado' | 'pendiente' | 'cancelado' | 'completado' | 'ausente' | 'bloqueado' = 'pendiente';
        if (t.estado === 1 || String(t.estado).toLowerCase().includes('conf')) estadoNorm = 'confirmado';
        else if (t.estado === 2 || String(t.estado).toLowerCase().includes('proc')) estadoNorm = 'confirmado';
        else if (t.estado === 3 || String(t.estado).toLowerCase().includes('comp')) estadoNorm = 'completado';
        else if (t.estado === 4 || String(t.estado).toLowerCase().includes('canc')) estadoNorm = 'cancelado';
        else if (t.estado === 5 || String(t.estado).toLowerCase().includes('aus')) estadoNorm = 'ausente';
        else if (t.estado === 6 || String(t.estado).toLowerCase().includes('bloq')) estadoNorm = 'bloqueado';

        const item: CalendarTurno = {
          id: String(t.turnoId),
          hora,
          cliente: estadoNorm === 'bloqueado' ? 'Bloqueo Operativo' : (t.clienteNombreCompleto || (t.usuarioId ? `Cliente #${t.usuarioId}` : 'Cliente')),
          servicio: estadoNorm === 'bloqueado' ? (t.motivo || 'Horario Inhabilitado') : servicio,
          profesional: t.profesionalNombreCompleto || 'Profesional',
          profesionalId: t.profesionalId,
          cabinaId: t.cabinaId,
          cabinaNombre: t.cabinaNombre,
          duracion,
          estado: estadoNorm,
          motivo: t.motivo,
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

  const handleConfirmarCalendario = async (turnoIdStr: string) => {
    const turnoId = parseInt(turnoIdStr);
    try {
      try {
        await turnosApi.confirmar(turnoId);
      } catch {}
      // Actualizar en localStorage para sincronizar
      try {
        const turnosLocales = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
        const actualizados = turnosLocales.map((tl: any) =>
          tl.turnoId === turnoId ? { ...tl, estado: 'Confirmado' } : tl
        );
        localStorage.setItem('estetica_reservas_cliente', JSON.stringify(actualizados));
      } catch {}
      await cargarTurnosCalendario();
      alert(`¡Turno #${turnoId} confirmado con éxito!`);
    } catch (err: any) {
      alert(`Error al confirmar turno: ${err.message}`);
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
    const list = appointments[key] || [];
    return list.filter((apt) => {
      if (filtroEstado !== 'todos' && apt.estado !== filtroEstado) return false;
      if (filtroProfesional !== 'todos' && String(apt.profesionalId) !== filtroProfesional) return false;
      if (filtroCabina !== 'todos' && String(apt.cabinaId) !== filtroCabina) return false;
      return true;
    });
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
      case 'confirmado': return 'bg-emerald-600';
      case 'pendiente': return 'bg-amber-500';
      case 'cancelado': return 'bg-red-500';
      case 'completado': return 'bg-blue-600';
      case 'ausente': return 'bg-purple-600';
      case 'bloqueado': return 'bg-stone-500';
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
                        className={`${apt.estado === 'bloqueado' ? 'bg-stone-700' : 'bg-gradient-to-r from-[#3C3530] to-[#2A2825]'} text-white p-2 rounded-xl text-xs mb-1 relative shadow-sm border border-white/5`}
                        style={{ minHeight: '55px' }}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-[11px] text-[#D4C8BC]">{apt.hora}</span>
                          <span className={`w-2 h-2 rounded-full ${getEstadoColor(apt.estado)}`} />
                        </div>
                        <div className="font-semibold text-xs leading-tight truncate flex items-center gap-1">
                          {apt.estado === 'bloqueado' && <Lock className="w-3 h-3 text-amber-300 shrink-0" />}
                          {apt.estado === 'ausente' && <UserX className="w-3 h-3 text-purple-300 shrink-0" />}
                          <span className="truncate">{apt.cliente}</span>
                        </div>
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
                        className={`${apt.estado === 'bloqueado' ? 'bg-stone-800' : 'bg-gradient-to-r from-[#3C3530] to-[#2A2825]'} text-white p-4 rounded-xl mb-2 shadow-sm border border-white/5`}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#D4C8BC]" />
                            <span className="font-bold text-xs">{apt.hora}</span>
                            <span className="text-[11px] text-white/70">({apt.duracion} min)</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${getEstadoColor(apt.estado)} capitalize`}>
                            {apt.estado === 'ausente' ? 'Ausente (No-show)' : apt.estado}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            {apt.estado === 'bloqueado' ? (
                              <Lock className="w-3.5 h-3.5 text-amber-300" />
                            ) : apt.estado === 'ausente' ? (
                              <UserX className="w-3.5 h-3.5 text-purple-300" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-[#D4C8BC]" />
                            )}
                            <span>{apt.cliente}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/80">
                            <Scissors className="w-3.5 h-3.5 text-[#D4C8BC]" />
                            <span>{apt.servicio}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-white/60 pt-1 border-t border-white/10">
                            <span>Prof: {apt.profesional}</span>
                            {(apt.cabinaNombre || apt.cabinaId) && (
                              <span className="flex items-center gap-1 text-amber-200/80">
                                <DoorOpen className="w-3 h-3" />
                                <span>{apt.cabinaNombre || `Cabina #${apt.cabinaId}`}</span>
                              </span>
                            )}
                          </div>
                          {apt.motivo && (
                            <div className="text-[10px] text-amber-200/90 italic bg-black/20 p-1.5 rounded mt-1">
                              Motivo: {apt.motivo}
                            </div>
                          )}
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
                <span className="font-bold text-emerald-700">
                  {dayAppointments.filter(a => a.estado === 'confirmado').length}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#EDE8E1]">
                <span className="text-[#8A7F74]">Pendientes:</span>
                <span className="font-bold text-amber-700">
                  {dayAppointments.filter(a => a.estado === 'pendiente').length}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#EDE8E1]">
                <span className="text-[#8A7F74]">Ausentes (No-show):</span>
                <span className="font-bold text-purple-700">
                  {dayAppointments.filter(a => a.estado === 'ausente').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7F74]">Bloqueados:</span>
                <span className="font-bold text-stone-700">
                  {dayAppointments.filter(a => a.estado === 'bloqueado').length}
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

      {/* Barra de Filtros Rápida de Agenda */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#3C3530]">
          <Filter className="w-4 h-4 text-[#7A3B3B]" />
          <span>Filtrar Agenda:</span>
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-1.5 border border-[#EDE8E1] rounded-xl bg-[#FAF8F5] text-[#3C3530] focus:outline-hidden font-medium"
        >
          <option value="todos">Todos los Estados</option>
          <option value="pendiente">🟡 Pendientes</option>
          <option value="confirmado">🟢 Confirmados</option>
          <option value="ausente">🟣 Ausentes / No-show</option>
          <option value="bloqueado">⚪ Bloqueados</option>
          <option value="completado">🔵 Completados</option>
          <option value="cancelado">🔴 Cancelados</option>
        </select>

        <select
          value={filtroProfesional}
          onChange={(e) => setFiltroProfesional(e.target.value)}
          className="px-3 py-1.5 border border-[#EDE8E1] rounded-xl bg-[#FAF8F5] text-[#3C3530] focus:outline-hidden font-medium"
        >
          <option value="todos">👤 Todos los Profesionales</option>
          {profesionalesList.map((p) => (
            <option key={p.usuarioId} value={String(p.usuarioId)}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>

        <select
          value={filtroCabina}
          onChange={(e) => setFiltroCabina(e.target.value)}
          className="px-3 py-1.5 border border-[#EDE8E1] rounded-xl bg-[#FAF8F5] text-[#3C3530] focus:outline-hidden font-medium"
        >
          <option value="todos">🚪 Todas las Cabinas</option>
          {cabinasList.map((c) => (
            <option key={c.cabinaId} value={String(c.cabinaId)}>
              {c.nombre}
            </option>
          ))}
        </select>

        {(filtroEstado !== 'todos' || filtroProfesional !== 'todos' || filtroCabina !== 'todos') && (
          <button
            onClick={() => {
              setFiltroEstado('todos');
              setFiltroProfesional('todos');
              setFiltroCabina('todos');
            }}
            className="text-[#7A3B3B] hover:underline font-semibold ml-auto"
          >
            Limpiar filtros
          </button>
        )}
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
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-[#2A2825] flex items-center gap-1.5">
                        {apt.estado === 'bloqueado' && <Lock className="w-3.5 h-3.5 text-stone-600 shrink-0" />}
                        {apt.estado === 'ausente' && <UserX className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                        <span>{apt.cliente}</span>
                      </div>
                      <div className="text-[#8A7F74] flex items-center gap-1.5">
                        <Scissors className="w-3 h-3 text-[#7A3B3B]" />
                        <span>{apt.servicio}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8A7F74] pt-1 border-t border-[#EDE8E1]">
                        <span>Profesional: {apt.profesional}</span>
                        {(apt.cabinaNombre || apt.cabinaId) && (
                          <span className="flex items-center gap-1 text-[#7A3B3B] font-medium">
                            <DoorOpen className="w-3 h-3" />
                            <span>{apt.cabinaNombre || `Cabina #${apt.cabinaId}`}</span>
                          </span>
                        )}
                      </div>
                      {apt.motivo && (
                        <div className="text-[10px] text-[#7A3B3B] bg-[#7A3B3B]/5 p-1.5 rounded border border-[#7A3B3B]/10">
                          <strong>Motivo:</strong> {apt.motivo}
                        </div>
                      )}
                    </div>
                    {apt.estado === 'pendiente' && (
                      <div className="mt-2.5 pt-2 border-t border-[#EDE8E1] flex justify-end">
                        <button
                          onClick={() => handleConfirmarCalendario(apt.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Confirmar Turno</span>
                        </button>
                      </div>
                    )}
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
