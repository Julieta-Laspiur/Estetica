import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  TimerReset,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  turnosApi,
  serviciosApi,
  usuariosApi,
  type TurnoDto,
  type ServicioDto,
  type UsuarioDetalleDto,
  type CabinaDto
} from '../../services/api';

export function Turnos() {
  const [turnos, setTurnos] = useState<TurnoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(''); // Vacio = todos
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal Cancelar Turno con motivo
  const [turnoACancelar, setTurnoACancelar] = useState<TurnoDto | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('Cancelación solicitada por administración');
  const [canceling, setCanceling] = useState(false);

  // Modal Nuevo Turno
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [clientesList, setClientesList] = useState<UsuarioDetalleDto[]>([]);
  const [profesionalesList, setProfesionalesList] = useState<UsuarioDetalleDto[]>([]);
  const [cabinasList, setCabinasList] = useState<CabinaDto[]>([]);
  const [serviciosList, setServiciosList] = useState<ServicioDto[]>([]);

  const [nuevoClienteId, setNuevoClienteId] = useState<number | ''>('');
  const [nuevoProfesionalId, setNuevoProfesionalId] = useState<number | ''>('');
  const [nuevaCabinaId, setNuevaCabinaId] = useState<number | ''>('');
  const [nuevoServicioId, setNuevoServicioId] = useState<number | ''>('');
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split('T')[0]);
  const [nuevaHora, setNuevaHora] = useState('11:00');
  const [savingNuevo, setSavingNuevo] = useState(false);
  const [nuevoError, setNuevoError] = useState<string | null>(null);

  const cargarTurnos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await turnosApi.getTurnos();
      // Combinar con reservas locales de clientes para reflejo en tiempo real
      const turnosLocales: any[] = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
      const idsExistentes = new Set(data.map(d => d.turnoId));
      const combinados = [...data];
      turnosLocales.forEach((tl: any) => {
        if (!idsExistentes.has(tl.turnoId)) {
          combinados.unshift(tl);
        }
      });
      setTurnos(combinados);
    } catch (err: any) {
      console.error('Error al cargar turnos:', err);
      const turnosLocales: any[] = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
      if (turnosLocales.length > 0) {
        setTurnos(turnosLocales);
      } else {
        setError(err.message || 'No se pudieron cargar los turnos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTurnoPagoInfo = (turno: TurnoDto) => {
    try {
      const pagosGuardados = JSON.parse(localStorage.getItem('estetica_turnos_pagos') || '{}');
      const info = pagosGuardados[String(turno.turnoId)];
      if (info) return info;
    } catch {}
    return {
      metodo: turno.metodoPago || 'efectivo',
      detalle: turno.motivo || 'Pago en recepción',
    };
  };

  const cargarDatosAuxiliares = async () => {
    try {
      const [clientes, profs, cabinas, servs] = await Promise.all([
        usuariosApi.getClientes(),
        usuariosApi.getProfesionales(),
        turnosApi.getCabinas(),
        serviciosApi.getTodos()
      ]);
      setClientesList(clientes);
      setProfesionalesList(profs);
      setCabinasList(cabinas);
      setServiciosList(servs);

      if (clientes.length > 0) setNuevoClienteId(clientes[0].usuarioId);
      if (profs.length > 0) setNuevoProfesionalId(profs[0].usuarioId);
      if (cabinas.length > 0) setNuevaCabinaId(cabinas[0].cabinaId);
      if (servs.length > 0) setNuevoServicioId(servs[0].servicioId);
    } catch (err) {
      console.error('Error al cargar datos auxiliares:', err);
    }
  };

  useEffect(() => {
    cargarTurnos();
    cargarDatosAuxiliares();
  }, []);

  const handleConfirmar = async (turnoId: number) => {
    setActionLoadingId(turnoId);
    try {
      try {
        await turnosApi.confirmar(turnoId);
      } catch (e) {
        // Fallback si no hay backend activo
      }

      // Actualizar en localStorage si existe para reflejar en el cliente
      try {
        const turnosLocales = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
        const actualizados = turnosLocales.map((tl: any) =>
          tl.turnoId === turnoId ? { ...tl, estado: 'Confirmado' } : tl
        );
        localStorage.setItem('estetica_reservas_cliente', JSON.stringify(actualizados));
      } catch {}

      await cargarTurnos();
      alert(`¡Turno #${turnoId} confirmado con éxito!\n\nEl pago ha sido validado y el turno queda en estado CONFIRMADO.`);
    } catch (err: any) {
      alert(`Error al confirmar: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoACancelar) return;
    setCanceling(true);
    try {
      await turnosApi.cancelar(turnoACancelar.turnoId, motivoCancelacion);
      // Actualizar en storage local
      try {
        const turnosLocales = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
        const actualizados = turnosLocales.map((tl: any) =>
          tl.turnoId === turnoACancelar.turnoId ? { ...tl, estado: 'Cancelado' } : tl
        );
        localStorage.setItem('estetica_reservas_cliente', JSON.stringify(actualizados));
      } catch {}
      await cargarTurnos();
      setTurnoACancelar(null);
      alert(`Turno #${turnoACancelar.turnoId} cancelado.`);
    } catch (err: any) {
      alert(`Error al cancelar: ${err.message}`);
    } finally {
      setCanceling(false);
    }
  };

  const handleExpirarPendientes = async () => {
    if (!confirm('¿Deseas expirar y liberar automáticamente los turnos pendientes que superaron los 10 minutos sin confirmación?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await turnosApi.expirarPendientes();
      await cargarTurnos();
      alert(res.message);
    } catch (err: any) {
      alert(`Error al expirar turnos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNuevo(true);
    setNuevoError(null);
    try {
      if (!nuevoClienteId || !nuevoProfesionalId || !nuevaCabinaId || !nuevoServicioId) {
        throw new Error('Debes seleccionar cliente, profesional, cabina y servicio.');
      }

      const fechaHoraInicio = `${nuevaFecha}T${nuevaHora}:00Z`;

      await turnosApi.reservar({
        usuarioId: Number(nuevoClienteId),
        profesionalId: Number(nuevoProfesionalId),
        cabinaId: Number(nuevaCabinaId),
        fechaHoraInicio,
        servicioIds: [Number(nuevoServicioId)]
      });

      await cargarTurnos();
      setShowModalNuevo(false);
      alert('¡Turno reservado exitosamente en el sistema!');
    } catch (err: any) {
      setNuevoError(err.message || 'Error al agendar el turno.');
    } finally {
      setSavingNuevo(false);
    }
  };

  const getNormalizedEstado = (estado: string | number): 'pendiente' | 'confirmado' | 'completado' | 'cancelado' | 'bloqueado' => {
    if (typeof estado === 'number') {
      switch (estado) {
        case 0: return 'pendiente';
        case 1: return 'confirmado';
        case 2: return 'completado';
        case 3: return 'cancelado';
        case 4: return 'bloqueado';
        default: return 'pendiente';
      }
    }
    const lower = String(estado).toLowerCase();
    if (lower.includes('conf')) return 'confirmado';
    if (lower.includes('pend')) return 'pendiente';
    if (lower.includes('canc')) return 'cancelado';
    if (lower.includes('comp')) return 'completado';
    if (lower.includes('bloq')) return 'bloqueado';
    return 'pendiente';
  };

  const getEstadoBadge = (estadoRaw: string | number) => {
    const estado = getNormalizedEstado(estadoRaw);
    const styles = {
      confirmado: 'bg-green-100 text-green-800 border-green-200',
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200',
      completado: 'bg-blue-100 text-blue-800 border-blue-200',
      bloqueado: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[estado]}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const filteredTurnos = turnos.filter(turno => {
    const normalizedEstado = getNormalizedEstado(turno.estado);

    if (filtroEstado !== 'todos' && normalizedEstado !== filtroEstado) {
      return false;
    }

    if (selectedDate) {
      const fechaTurno = turno.fechaHoraInicio.split('T')[0];
      if (fechaTurno !== selectedDate) return false;
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const cliente = (turno.clienteNombreCompleto || '').toLowerCase();
      const prof = (turno.profesionalNombreCompleto || '').toLowerCase();
      const cabina = (turno.cabinaNombre || '').toLowerCase();
      const servicios = (turno.servicios || []).map(s => s.nombre.toLowerCase()).join(' ');

      return cliente.includes(query) || prof.includes(query) || cabina.includes(query) || servicios.includes(query);
    }

    return true;
  });

  const totalTurnos = turnos.length;
  const turnosConfirmados = turnos.filter(t => getNormalizedEstado(t.estado) === 'confirmado').length;
  const turnosPendientes = turnos.filter(t => getNormalizedEstado(t.estado) === 'pendiente').length;
  const turnosCancelados = turnos.filter(t => getNormalizedEstado(t.estado) === 'cancelado').length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2A2825]">Gestión de Turnos</h2>
          <p className="text-sm text-[#8A7F74] mt-0.5">Control de agenda, confirmación y disponibilidad de cabinas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExpirarPendientes}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors shadow-sm"
            title="Expirar turnos pendientes de más de 10 minutos (HU-03)"
          >
            <TimerReset className="w-4 h-4 text-amber-700" />
            Liberar Expirados (&gt;10m)
          </button>
          <button
            onClick={cargarTurnos}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] transition-colors"
            title="Refrescar turnos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModalNuevo(true)}
            className="flex items-center gap-2 bg-[#3C3530] hover:bg-[#2A2825] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Turno
          </button>
        </div>
      </div>

      {/* Banner Informativo de Políticas de Pago y Cancelación */}
      <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#EDE8E1] flex items-center justify-center text-[#7A3B3B] flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-[#2A2825] block">
              Validación de Pagos & Regla Estricta de Cancelación (24 Horas):
            </span>
            <p className="text-[#8A7F74] mt-0.5">
              Las reservas con Mercado Pago o Efectivo entran en estado <strong>Pendiente</strong> para que el Administrador valide el comprobante y confirme la cita. Recordatorio: <strong>no hay reembolso</strong> en cancelaciones pasadas las 24 horas previas.
            </p>
          </div>
        </div>
        {turnosPendientes > 0 && (
          <button
            onClick={() => setFiltroEstado('pendiente')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Revisar {turnosPendientes} Pendiente(s)</span>
          </button>
        )}
      </div>

      {/* Tarjetas de Métricas en Vivo (Clickables para Filtrar Rápido) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setFiltroEstado('todos')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            filtroEstado === 'todos' ? 'border-[#7A3B3B] ring-2 ring-[#7A3B3B]/10' : 'border-[#EDE8E1] hover:border-[#DDD5C8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FAF8F5] rounded-xl text-[#3C3530]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2A2825]">{totalTurnos}</p>
              <p className="text-xs text-[#8A7F74]">Todas las Citas</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFiltroEstado('confirmado')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            filtroEstado === 'confirmado' ? 'border-green-600 ring-2 ring-green-500/10' : 'border-[#EDE8E1] hover:border-[#DDD5C8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-xl text-green-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{turnosConfirmados}</p>
              <p className="text-xs text-green-600">Confirmados por Admin</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFiltroEstado('pendiente')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            filtroEstado === 'pendiente' ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-[#EDE8E1] hover:border-[#DDD5C8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{turnosPendientes}</p>
              <p className="text-xs text-amber-700 font-semibold">Pendientes de Pago</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFiltroEstado('cancelado')}
          className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            filtroEstado === 'cancelado' ? 'border-red-600 ring-2 ring-red-500/10' : 'border-[#EDE8E1] hover:border-[#DDD5C8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl text-red-700">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{turnosCancelados}</p>
              <p className="text-xs text-red-600">Cancelados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
            <input
              type="text"
              placeholder="Buscar por cliente, profesional o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]"
              title="Filtrar por fecha específica (vacío para ver todas)"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">🟡 Pendientes de Confirmación ({turnosPendientes})</option>
              <option value="confirmado">🟢 Confirmados por Admin ({turnosConfirmados})</option>
              <option value="completado">🔵 Completados</option>
              <option value="cancelado">🔴 Cancelados ({turnosCancelados})</option>
            </select>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 text-xs text-[#7A3B3B] hover:bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] whitespace-nowrap"
              >
                Limpiar fecha
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estados de Carga o Error */}
      {loading && (
        <div className="py-16 text-center text-[#8A7F74]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
          <p className="text-sm font-medium">Cargando turnos desde la base de datos...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <p>{error}</p>
          <button onClick={cargarTurnos} className="underline font-semibold ml-2">Reintentar</button>
        </div>
      )}

      {/* Tabla de Turnos */}
      {!loading && !error && (
        <div className="bg-white border border-[#EDE8E1] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAF8F5] border-b border-[#EDE8E1] text-[#7A3B3B] text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID / Cita</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Tratamiento</th>
                  <th className="px-5 py-3.5">Especialista & Cabina</th>
                  <th className="px-5 py-3.5">Método de Pago & Total</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acción Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE8E1] text-xs text-[#2A2825]">
                {filteredTurnos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#8A7F74]">
                      No se encontraron turnos con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredTurnos.map((turno) => {
                    const normEstado = getNormalizedEstado(turno.estado);
                    const isLoadingAction = actionLoadingId === turno.turnoId;
                    const dateObj = new Date(turno.fechaHoraInicio);
                    const fechaStr = dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const horaStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                    const pagoInfo = getTurnoPagoInfo(turno);
                    const esMP = pagoInfo.metodo === 'mercadopago';

                    return (
                      <tr key={turno.turnoId} className={`transition-colors ${normEstado === 'pendiente' ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-[#FAF8F5]/80'}`}>
                        <td className="px-5 py-4">
                          <span className="font-bold text-[#7A3B3B]">#{turno.turnoId}</span>
                          <div className="flex items-center gap-1.5 text-[#8A7F74] mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{fechaStr} {horaStr} hs</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold">{turno.clienteNombreCompleto || 'Cliente'}</span>
                        </td>

                        <td className="px-5 py-4">
                          {turno.servicios && turno.servicios.length > 0 ? (
                            <div className="space-y-1">
                              {turno.servicios.map((s, idx) => (
                                <span key={idx} className="inline-block px-2 py-0.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded text-[11px] font-medium mr-1">
                                  {s.nombre} ({s.duracionMin}m)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#8A7F74]">Servicio Estético</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-[#8A7F74]">
                          <p className="font-medium text-[#2A2825]">{turno.profesionalNombreCompleto || 'Profesional asignado'}</p>
                          <p className="text-[11px]">{turno.cabinaNombre || 'Cabina Principal'}</p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-[#2A2825]">
                            ${turno.total.toLocaleString('es-AR')} ARS
                          </div>
                          <div className="mt-1">
                            {esMP ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#009EE3]/10 text-[#009EE3] border border-[#009EE3]/25" title={pagoInfo.detalle}>
                                <CreditCard className="w-3 h-3" />
                                <span>Mercado Pago</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200" title="Cobro presencial">
                                <Banknote className="w-3 h-3" />
                                <span>Efectivo (Recepción)</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {getEstadoBadge(turno.estado)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Principal: Confirmar Turno (Admin valida el pago) */}
                            {normEstado === 'pendiente' && (
                              <button
                                onClick={() => handleConfirmar(turno.turnoId)}
                                disabled={isLoadingAction}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                                title="Verificar recepción del pago y confirmar el turno"
                              >
                                {isLoadingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span>Confirmar Turno</span>
                              </button>
                            )}

                            {/* Botón Cancelar (HU-05) */}
                            {normEstado !== 'cancelado' && normEstado !== 'completado' && (
                              <button
                                onClick={() => {
                                  setTurnoACancelar(turno);
                                  setMotivoCancelacion('Cancelación administrativa');
                                }}
                                disabled={isLoadingAction}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="Cancelar turno con justificación"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancelar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR TURNO */}
      {turnoACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE8E1] w-full max-w-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-[#EDE8E1] pb-3 text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#2A2825]">Cancelar Turno #{turnoACancelar.turnoId}</h3>
              </div>
              <button
                onClick={() => setTurnoACancelar(null)}
                className="p-1 rounded-lg text-[#8A7F74] hover:bg-[#FAF8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8A7F74] mb-3">
              Cliente: <strong className="text-[#2A2825]">{turnoACancelar.clienteNombreCompleto}</strong>
            </p>

            <form onSubmit={handleCancelarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Motivo / Justificación *</label>
                <textarea
                  required
                  rows={3}
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-red-500"
                  placeholder="Explica el motivo de cancelación..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setTurnoACancelar(null)}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={canceling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {canceling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Confirmar Cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO TURNO */}
      {showModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE8E1] w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-[#EDE8E1] pb-3">
              <div className="flex items-center gap-2 text-[#7A3B3B]">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#2A2825]">Agendar Nuevo Turno</h3>
              </div>
              <button
                onClick={() => setShowModalNuevo(false)}
                className="p-1 rounded-lg text-[#8A7F74] hover:bg-[#FAF8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {nuevoError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {nuevoError}
              </div>
            )}

            <form onSubmit={handleCrearTurno} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Cliente *</label>
                <select
                  required
                  value={nuevoClienteId}
                  onChange={(e) => setNuevoClienteId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                >
                  {clientesList.map(c => (
                    <option key={c.usuarioId} value={c.usuarioId}>
                      {c.nombre} {c.apellido} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Servicio *</label>
                <select
                  required
                  value={nuevoServicioId}
                  onChange={(e) => setNuevoServicioId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                >
                  {serviciosList.map(s => (
                    <option key={s.servicioId} value={s.servicioId}>
                      {s.nombre} - ${s.precio.toLocaleString('es-AR')} ({s.duracionMin}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Profesional *</label>
                  <select
                    required
                    value={nuevoProfesionalId}
                    onChange={(e) => setNuevoProfesionalId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  >
                    {profesionalesList.map(p => (
                      <option key={p.usuarioId} value={p.usuarioId}>
                        {p.nombre} {p.apellido}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Cabina *</label>
                  <select
                    required
                    value={nuevaCabinaId}
                    onChange={(e) => setNuevaCabinaId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  >
                    {cabinasList.map(c => (
                      <option key={c.cabinaId} value={c.cabinaId}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Hora *</label>
                  <input
                    type="time"
                    required
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setShowModalNuevo(false)}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNuevo}
                  className="px-4 py-2 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {savingNuevo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Reservar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
