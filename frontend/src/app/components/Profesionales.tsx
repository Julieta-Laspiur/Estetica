import { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Edit2,
  Power,
  X,
  AlertCircle,
  Home,
  RefreshCw,
  Briefcase
} from 'lucide-react';
import {
  usuariosApi,
  turnosApi,
  type ProfesionalDto,
  type CabinaDto,
  type TurnoDto
} from '../../services/api';

export function Profesionales() {
  const [loading, setLoading] = useState(true);
  const [profesionales, setProfesionales] = useState<ProfesionalDto[]>([]);
  const [cabinas, setCabinas] = useState<CabinaDto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Modal Alta
  const [showModalAlta, setShowModalAlta] = useState(false);
  const [formAlta, setFormAlta] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    especialidad: 'Dermatocosmiatría y Estética Facial',
    cabinaHabitualId: 1,
  });
  const [guardandoAlta, setGuardandoAlta] = useState(false);
  const [errorAlta, setErrorAlta] = useState<string | null>(null);

  // Modal Edición
  const [profesionalParaEditar, setProfesionalParaEditar] = useState<ProfesionalDto | null>(null);
  const [formEdicion, setFormEdicion] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    especialidad: '',
    activo: true,
    cabinaHabitualId: 1,
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  // Modal Agenda Individual
  const [profesionalAgenda, setProfesionalAgenda] = useState<ProfesionalDto | null>(null);
  const [turnosAgenda, setTurnosAgenda] = useState<TurnoDto[]>([]);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);
  const [fechaAgenda, setFechaAgenda] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filtroEstadoAgenda, setFiltroEstadoAgenda] = useState('todos');

  // Especialidades predefinidas comunes
  const especialidadesSugeridas = [
    'Dermatocosmiatría y Estética Facial',
    'Cosmiatría y Peeling Químico',
    'Aparatología, Lifting y Rejuvenecimiento',
    'Estética Corporal y Modelado',
    'Masoterapia, Drenaje y Spa',
    'Lifting de Pestañas y Microblading',
    'Tratamientos Láser y Depilación Definitiva',
  ];

  // Helper para leer cabinas habituales persistidas localmente
  const getCabinasMap = (): Record<number, number> => {
    try {
      return JSON.parse(localStorage.getItem('estetica_profesionales_cabinas') || '{}');
    } catch {
      return {};
    }
  };

  const saveCabinaHabitual = (profesionalId: number, cabinaId: number) => {
    try {
      const map = getCabinasMap();
      map[profesionalId] = cabinaId;
      localStorage.setItem('estetica_profesionales_cabinas', JSON.stringify(map));
    } catch (e) {
      console.error('Error guardando cabina habitual:', e);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [profsData, cabinasData] = await Promise.all([
        usuariosApi.getProfesionalesList().catch(() => []),
        turnosApi.getCabinas().catch(() => []),
      ]);

      const cabinaMap = getCabinasMap();

      const profsConCabina = profsData.map((p, idx) => {
        const cabinaIdAsignada = cabinaMap[p.profesionalId] || cabinasData[idx % Math.max(1, cabinasData.length)]?.cabinaId || 1;
        const cabinaObj = cabinasData.find(c => c.cabinaId === cabinaIdAsignada);
        return {
          ...p,
          cabinaHabitualId: cabinaIdAsignada,
          cabinaHabitualNombre: cabinaObj ? cabinaObj.nombre : `Cabina ${cabinaIdAsignada}`,
        };
      });

      setProfesionales(profsConCabina);
      setCabinas(cabinasData);
    } catch (err) {
      console.error('Error al cargar profesionales y cabinas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Abrir Modal de Alta
  const handleAbrirAlta = () => {
    setErrorAlta(null);
    setFormAlta({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      password: '',
      especialidad: especialidadesSugeridas[0],
      cabinaHabitualId: cabinas[0]?.cabinaId || 1,
    });
    setShowModalAlta(true);
  };

  // Guardar Alta
  const handleGuardarAlta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAlta.nombre.trim() || !formAlta.apellido.trim() || !formAlta.email.trim()) {
      setErrorAlta('Por favor, completá nombre, apellido y correo electrónico.');
      return;
    }

    setGuardandoAlta(true);
    setErrorAlta(null);

    try {
      const nuevoPro = await usuariosApi.crearProfesional({
        nombre: formAlta.nombre.trim(),
        apellido: formAlta.apellido.trim(),
        email: formAlta.email.trim(),
        telefono: formAlta.telefono.trim() || undefined,
        password: formAlta.password.trim() || 'Pro123!',
        especialidad: formAlta.especialidad.trim(),
      });

      // Guardar cabina habitual
      saveCabinaHabitual(nuevoPro.profesionalId, formAlta.cabinaHabitualId);

      setShowModalAlta(false);
      await cargarDatos();
    } catch (err: any) {
      console.error('Error al dar de alta profesional:', err);
      setErrorAlta(err.message || 'Error al registrar profesional. Verificá si el email ya existe.');
    } finally {
      setGuardandoAlta(false);
    }
  };

  // Abrir Modal de Edición
  const handleAbrirEdicion = (pro: ProfesionalDto) => {
    setErrorEdicion(null);
    setProfesionalParaEditar(pro);
    setFormEdicion({
      nombre: pro.nombre || pro.nombreCompleto.split(' ')[0] || '',
      apellido: pro.apellido || pro.nombreCompleto.split(' ').slice(1).join(' ') || '',
      telefono: pro.telefono || '',
      especialidad: pro.especialidad || especialidadesSugeridas[0],
      activo: pro.activo,
      cabinaHabitualId: pro.cabinaHabitualId || 1,
    });
  };

  // Guardar Edición
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profesionalParaEditar) return;

    setGuardandoEdicion(true);
    setErrorEdicion(null);

    try {
      await usuariosApi.gestionarProfesional({
        usuarioId: profesionalParaEditar.usuarioId,
        especialidad: formEdicion.especialidad.trim(),
        activo: formEdicion.activo,
        nombre: formEdicion.nombre.trim(),
        apellido: formEdicion.apellido.trim(),
        telefono: formEdicion.telefono.trim(),
      });

      // Guardar cabina habitual
      saveCabinaHabitual(profesionalParaEditar.profesionalId, formEdicion.cabinaHabitualId);

      setProfesionalParaEditar(null);
      await cargarDatos();
    } catch (err: any) {
      console.error('Error al editar profesional:', err);
      setErrorEdicion(err.message || 'Error al actualizar datos del profesional.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Toggle Activo/Inactivo rápido
  const handleToggleEstado = async (pro: ProfesionalDto) => {
    const nuevoEstado = !pro.activo;
    try {
      await usuariosApi.gestionarProfesional({
        usuarioId: pro.usuarioId,
        especialidad: pro.especialidad,
        activo: nuevoEstado,
      });

      setProfesionales(prev =>
        prev.map(p => (p.profesionalId === pro.profesionalId ? { ...p, activo: nuevoEstado } : p))
      );
    } catch (err) {
      console.error('Error al alternar estado del profesional:', err);
      alert('No se pudo modificar el estado del profesional.');
    }
  };

  // Abrir Agenda Individual
  const handleAbrirAgenda = async (pro: ProfesionalDto) => {
    setProfesionalAgenda(pro);
    setCargandoAgenda(true);
    setFechaAgenda(new Date().toISOString().split('T')[0]);
    try {
      const turnos = await turnosApi.getPorProfesional(pro.profesionalId);
      setTurnosAgenda(turnos);
    } catch (err) {
      console.error('Error al cargar agenda individual:', err);
      setTurnosAgenda([]);
    } finally {
      setCargandoAgenda(false);
    }
  };

  // Cambiar fecha en la agenda individual
  const handleFiltrarFechaAgenda = async (nuevaFecha: string) => {
    setFechaAgenda(nuevaFecha);
    if (!profesionalAgenda) return;
    setCargandoAgenda(true);
    try {
      const turnos = await turnosApi.getPorProfesional(profesionalAgenda.profesionalId, nuevaFecha);
      setTurnosAgenda(turnos);
    } catch (err) {
      console.error('Error filtrando agenda por fecha:', err);
      setTurnosAgenda([]);
    } finally {
      setCargandoAgenda(false);
    }
  };

  // Normalizador de estados para agenda
  const normalizeEstadoTurno = (estado: any) => {
    if (estado === 0 || estado === '0') return 'pendiente';
    if (estado === 1 || estado === '1' || estado === 2 || estado === '2') return 'confirmado';
    if (estado === 3 || estado === '3') return 'completado';
    if (estado === 4 || estado === '4') return 'cancelado';
    const s = String(estado || '').toLowerCase();
    if (s.includes('conf')) return 'confirmado';
    if (s.includes('pend')) return 'pendiente';
    if (s.includes('comp') || s.includes('final')) return 'completado';
    if (s.includes('canc') || s.includes('rech')) return 'cancelado';
    return 'pendiente';
  };

  // Filtrado de profesionales
  const profesionalesFiltrados = profesionales.filter((pro) => {
    const matchBusqueda =
      pro.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
      pro.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      (pro.telefono && pro.telefono.includes(busqueda)) ||
      pro.especialidad.toLowerCase().includes(busqueda.toLowerCase());

    const matchEspecialidad =
      filtroEspecialidad === 'todas' ||
      pro.especialidad.toLowerCase() === filtroEspecialidad.toLowerCase();

    const matchEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && pro.activo) ||
      (filtroEstado === 'inactivos' && !pro.activo);

    return matchBusqueda && matchEspecialidad && matchEstado;
  });

  // Métricas de cabecera
  const totalActivos = profesionales.filter(p => p.activo).length;
  const especialidadesUnicas = Array.from(new Set(profesionales.map(p => p.especialidad))).length;

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Header con Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-[#EDE8E1] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#FAF0ED] text-[#7A3B3B] border border-[#E8D5CE] mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff Médico & Cosmiátrico</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">Gestión de Profesionales</h1>
          <p className="text-xs sm:text-sm text-[#8A7F74] mt-1">
            Alta de profesionales, configuración de especialidades, asignación de cabinas habituales y consulta de agenda individual
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="p-3 rounded-2xl border border-[#EDE8E1] bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#3C3530] transition-colors shadow-2xs"
            title="Refrescar profesionales"
          >
            <RefreshCw className={`w-4 h-4 text-[#7A3B3B] ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleAbrirAlta}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#7A3B3B] hover:bg-[#662F2F] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Dar de Alta Profesional</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8A7F74]">Equipo Profesional</span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF0ED] text-[#7A3B3B] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#2A2825]">{profesionales.length}</h3>
          <p className="text-[11px] text-[#8A7F74] mt-0.5">
            <strong>{totalActivos}</strong> activos para turnos
          </p>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8A7F74]">Especialidades Estéticas</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#2A2825]">{especialidadesUnicas}</h3>
          <p className="text-[11px] text-[#8A7F74] mt-0.5">Áreas de tratamiento cubiertas</p>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8A7F74]">Cabinas Asignadas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#2A2825]">{cabinas.length}</h3>
          <p className="text-[11px] text-[#8A7F74] mt-0.5">Espacios de atención disponibles</p>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Barra de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8A7F74] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o especialidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] placeholder-[#8A7F74] focus:outline-hidden focus:border-[#7A3B3B] transition-colors"
          />
        </div>

        {/* Filtro Especialidad */}
        <div className="flex items-center gap-2">
          <select
            value={filtroEspecialidad}
            onChange={(e) => setFiltroEspecialidad(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-medium text-[#3C3530] focus:outline-hidden focus:border-[#7A3B3B]"
          >
            <option value="todas">Todas las Especialidades</option>
            {especialidadesSugeridas.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>

          {/* Filtro Estado */}
          <div className="flex rounded-xl bg-[#FAF8F5] p-1 border border-[#EDE8E1] text-xs">
            {(['todos', 'activos', 'inactivos'] as const).map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  filtroEstado === est
                    ? 'bg-[#3C3530] text-white shadow-2xs'
                    : 'text-[#8A7F74] hover:text-[#2A2825]'
                }`}
              >
                {est}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Listado de Profesionales (Cards Grid) */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-[#EDE8E1] shadow-xs">
          <RefreshCw className="w-8 h-8 text-[#7A3B3B] animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#2A2825]">Cargando staff de profesionales...</p>
          <p className="text-xs text-[#8A7F74]">Sincronizando especialidades y cabinas asignadas</p>
        </div>
      ) : profesionalesFiltrados.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#EDE8E1] p-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF0ED] text-[#7A3B3B] flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#2A2825]">No se encontraron profesionales</h3>
          <p className="text-xs text-[#8A7F74] max-w-md mx-auto mt-1">
            No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados.
          </p>
          <button
            onClick={handleAbrirAlta}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#7A3B3B] text-white rounded-xl text-xs font-semibold hover:bg-[#662F2F] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Dar de alta el primer profesional</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profesionalesFiltrados.map((pro) => {
            const iniciales = pro.nombreCompleto
              ? pro.nombreCompleto
                  .split(' ')
                  .map(w => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'PR';

            return (
              <div
                key={pro.profesionalId}
                className="bg-white border border-[#EDE8E1] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Avatar, Nombre y Estado Switch */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-13 h-13 rounded-2xl bg-[#7A3B3B] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
                        {iniciales}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#2A2825] leading-snug">
                          {pro.nombreCompleto}
                        </h3>
                        <span className="text-[11px] font-semibold text-[#8A7F74] flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-[#7A3B3B]" />
                          <span>Especialista Estético</span>
                        </span>
                      </div>
                    </div>

                    {/* Switch de Estado Activo/Inactivo */}
                    <button
                      onClick={() => handleToggleEstado(pro)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                        pro.activo
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                      title={pro.activo ? 'Clic para desactivar' : 'Clic para activar'}
                    >
                      <span className={`w-2 h-2 rounded-full ${pro.activo ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                      <span>{pro.activo ? 'Activo' : 'Inactivo'}</span>
                    </button>
                  </div>

                  {/* Especialidad & Cabina */}
                  <div className="space-y-2.5 mb-5">
                    <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1]">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A7F74] block mb-0.5">
                        Especialidad Principal
                      </span>
                      <p className="text-xs font-bold text-[#7A3B3B] leading-tight">
                        {pro.especialidad || 'Dermatocosmiatría General'}
                      </p>
                    </div>

                    <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A7F74] block mb-0.5">
                          Cabina Habitual
                        </span>
                        <p className="text-xs font-bold text-[#2A2825] flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-[#7A3B3B]" />
                          <span>{pro.cabinaHabitualNombre || `Cabina ${pro.cabinaHabitualId || 1}`}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-white border border-[#EDE8E1] rounded-md text-[#8A7F74]">
                        Asignada
                      </span>
                    </div>

                    {/* Contacto */}
                    <div className="space-y-1 pt-1 text-xs text-[#8A7F74]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#3C3530]" />
                        <span className="truncate">{pro.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#3C3530]" />
                        <span>{pro.telefono || '+54 9 11 2233-4455'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones del profesional */}
                <div className="pt-4 border-t border-[#EDE8E1] flex items-center gap-2">
                  <button
                    onClick={() => handleAbrirAgenda(pro)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FAF0ED] hover:bg-[#F3E2DB] text-[#7A3B3B] border border-[#E8D5CE] text-xs font-bold transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ver Agenda</span>
                  </button>

                  <button
                    onClick={() => handleAbrirEdicion(pro)}
                    className="p-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#3C3530] transition-colors"
                    title="Editar especialidad y cabina"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleEstado(pro)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      pro.activo
                        ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                    title={pro.activo ? 'Desactivar profesional' : 'Activar profesional'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL: DAR DE ALTA PROFESIONAL */}
      {showModalAlta && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#EDE8E1] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-4">
              <div>
                <span className="text-xs font-bold text-[#7A3B3B]">Alta de Personal</span>
                <h3 className="text-xl font-bold text-[#2A2825]">Registrar Nuevo Profesional</h3>
              </div>
              <button
                onClick={() => setShowModalAlta(false)}
                className="p-2 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#8A7F74]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorAlta && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>{errorAlta}</span>
              </div>
            )}

            <form onSubmit={handleGuardarAlta} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sofía"
                    value={formAlta.nombre}
                    onChange={(e) => setFormAlta({ ...formAlta, nombre: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Méndez"
                    value={formAlta.apellido}
                    onChange={(e) => setFormAlta({ ...formAlta, apellido: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="profesional@estetica.com"
                    value={formAlta.email}
                    onChange={(e) => setFormAlta({ ...formAlta, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Teléfono Móvil</label>
                  <input
                    type="tel"
                    placeholder="+54 9 11 ..."
                    value={formAlta.telefono}
                    onChange={(e) => setFormAlta({ ...formAlta, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Contraseña Inicial</label>
                <input
                  type="password"
                  placeholder="Por defecto: Pro123!"
                  value={formAlta.password}
                  onChange={(e) => setFormAlta({ ...formAlta, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                />
                <span className="text-[10px] text-[#8A7F74] mt-0.5 block">
                  El profesional podrá ingresar con este correo y clave para revisar sus turnos.
                </span>
              </div>

              {/* Especialidad */}
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Especialidad Estética *</label>
                <select
                  value={formAlta.especialidad}
                  onChange={(e) => setFormAlta({ ...formAlta, especialidad: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B] mb-2"
                >
                  {especialidadesSugeridas.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                  <option value="Otra">Otra especialidad personalizada...</option>
                </select>

                {formAlta.especialidad === 'Otra' && (
                  <input
                    type="text"
                    placeholder="Escribí la especialidad..."
                    onChange={(e) => setFormAlta({ ...formAlta, especialidad: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-white text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                  />
                )}
              </div>

              {/* Cabina Habitual */}
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Cabina Habitual Asignada *</label>
                <select
                  value={formAlta.cabinaHabitualId}
                  onChange={(e) => setFormAlta({ ...formAlta, cabinaHabitualId: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                >
                  {cabinas.map((c) => (
                    <option key={c.cabinaId} value={c.cabinaId}>
                      {c.nombre} {c.descripcion ? `(${c.descripcion})` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#8A7F74] mt-0.5 block">
                  Cabina sugerida por defecto al agendar turnos con este profesional.
                </span>
              </div>

              <div className="pt-3 border-t border-[#EDE8E1] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModalAlta(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE8E1] text-[#3C3530] hover:bg-[#FAF8F5] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAlta}
                  className="px-5 py-2.5 rounded-xl bg-[#7A3B3B] text-white hover:bg-[#662F2F] text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {guardandoAlta ? 'Guardando...' : 'Crear Profesional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: EDITAR PROFESIONAL & CABINA HABITUAL */}
      {profesionalParaEditar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#EDE8E1] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-4">
              <div>
                <span className="text-xs font-bold text-[#7A3B3B]">Modificación de Datos</span>
                <h3 className="text-xl font-bold text-[#2A2825]">Editar Profesional</h3>
                <p className="text-xs text-[#8A7F74] mt-0.5">{profesionalParaEditar.email}</p>
              </div>
              <button
                onClick={() => setProfesionalParaEditar(null)}
                className="p-2 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#8A7F74]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorEdicion && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>{errorEdicion}</span>
              </div>
            )}

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formEdicion.nombre}
                    onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={formEdicion.apellido}
                    onChange={(e) => setFormEdicion({ ...formEdicion, apellido: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Teléfono Móvil</label>
                <input
                  type="tel"
                  value={formEdicion.telefono}
                  onChange={(e) => setFormEdicion({ ...formEdicion, telefono: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                />
              </div>

              {/* Especialidad */}
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Especialidad Estética</label>
                <select
                  value={formEdicion.especialidad}
                  onChange={(e) => setFormEdicion({ ...formEdicion, especialidad: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B] mb-2"
                >
                  {especialidadesSugeridas.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                  <option value="Otra">Otra especialidad...</option>
                </select>
                {formEdicion.especialidad === 'Otra' && (
                  <input
                    type="text"
                    placeholder="Ingresá la especialidad personalizada..."
                    onChange={(e) => setFormEdicion({ ...formEdicion, especialidad: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-white text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                  />
                )}
              </div>

              {/* Cabina Habitual */}
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Cabina Habitual Asignada</label>
                <select
                  value={formEdicion.cabinaHabitualId}
                  onChange={(e) => setFormEdicion({ ...formEdicion, cabinaHabitualId: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                >
                  {cabinas.map((c) => (
                    <option key={c.cabinaId} value={c.cabinaId}>
                      {c.nombre} {c.descripcion ? `(${c.descripcion})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado Activo */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#2A2825]">Estado de Disponibilidad</p>
                  <p className="text-[11px] text-[#8A7F74]">Determina si puede recibir nuevos turnos en la agenda</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormEdicion({ ...formEdicion, activo: !formEdicion.activo })}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    formEdicion.activo
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {formEdicion.activo ? 'Habilitado' : 'Deshabilitado'}
                </button>
              </div>

              <div className="pt-3 border-t border-[#EDE8E1] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProfesionalParaEditar(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE8E1] text-[#3C3530] hover:bg-[#FAF8F5] text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-5 py-2.5 rounded-xl bg-[#7A3B3B] text-white hover:bg-[#662F2F] text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {guardandoEdicion ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: AGENDA INDIVIDUAL DEL PROFESIONAL */}
      {profesionalAgenda && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#EDE8E1] space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#7A3B3B] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {profesionalAgenda.nombreCompleto
                    .split(' ')
                    .map(w => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#2A2825]">
                      Agenda de {profesionalAgenda.nombreCompleto}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Profesional
                    </span>
                  </div>
                  <p className="text-xs text-[#8A7F74]">
                    {profesionalAgenda.especialidad} &bull; {profesionalAgenda.cabinaHabitualNombre || 'Cabina 1'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfesionalAgenda(null)}
                className="p-2 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#8A7F74]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controles de Fecha y Filtro */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#7A3B3B]" />
                <span className="text-xs font-bold text-[#3C3530]">Filtrar Fecha:</span>
                <input
                  type="date"
                  value={fechaAgenda}
                  onChange={(e) => handleFiltrarFechaAgenda(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#EDE8E1] bg-white text-xs font-semibold text-[#2A2825] focus:outline-hidden focus:border-[#7A3B3B]"
                />
              </div>

              {/* Botones rápidos de fecha */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => handleFiltrarFechaAgenda(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#EDE8E1] hover:bg-[#F3EFEA] font-semibold text-[#3C3530]"
                >
                  Hoy
                </button>
                <button
                  onClick={() => {
                    const manana = new Date();
                    manana.setDate(manana.getDate() + 1);
                    handleFiltrarFechaAgenda(manana.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#EDE8E1] hover:bg-[#F3EFEA] font-semibold text-[#3C3530]"
                >
                  Mañana
                </button>
                <button
                  onClick={() => handleFiltrarFechaAgenda('')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#EDE8E1] hover:bg-[#F3EFEA] font-semibold text-[#3C3530]"
                >
                  Ver Todos
                </button>
              </div>

              {/* Filtro por estado en la agenda */}
              <div className="flex items-center gap-1.5 text-xs w-full pt-2 border-t border-[#EDE8E1]/80">
                <span className="text-[11px] font-semibold text-[#8A7F74]">Estado:</span>
                {(['todos', 'confirmado', 'completado', 'pendiente'] as const).map((est) => (
                  <button
                    key={est}
                    onClick={() => setFiltroEstadoAgenda(est)}
                    className={`px-2 py-0.5 rounded-md font-semibold capitalize text-[11px] transition-colors ${
                      filtroEstadoAgenda === est
                        ? 'bg-[#3C3530] text-white'
                        : 'bg-white text-[#8A7F74] hover:text-[#2A2825] border border-[#EDE8E1]'
                    }`}
                  >
                    {est}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Turnos del Profesional */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {cargandoAgenda ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-6 h-6 text-[#7A3B3B] animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#8A7F74]">Consultando agenda del profesional...</p>
                </div>
              ) : turnosAgenda.filter(t => filtroEstadoAgenda === 'todos' || normalizeEstadoTurno(t.estado) === filtroEstadoAgenda).length === 0 ? (
                <div className="py-12 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#EDE8E1]">
                  <Clock className="w-8 h-8 text-[#8A7F74] mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-[#2A2825]">Sin turnos asignados</p>
                  <p className="text-xs text-[#8A7F74] mt-0.5">
                    {fechaAgenda
                      ? `No hay citas agendadas para el día ${new Date(fechaAgenda + 'T00:00:00').toLocaleDateString('es-AR')}.`
                      : 'El profesional no registra turnos programados para el criterio seleccionado.'}
                  </p>
                </div>
              ) : (
                turnosAgenda
                  .filter(t => filtroEstadoAgenda === 'todos' || normalizeEstadoTurno(t.estado) === filtroEstadoAgenda)
                  .map((t) => {
                  const inicio = new Date(t.fechaHoraInicio);
                  const fin = new Date(t.fechaHoraFin);
                  const horaInicio = inicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                  const horaFin = fin.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                  const fechaStr = inicio.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
                  const estado = normalizeEstadoTurno(t.estado);
                  const servicioNombre = t.servicios?.[0]?.nombre || 'Tratamiento Estético';

                  return (
                    <div
                      key={t.turnoId}
                      className="p-4 rounded-2xl border border-[#EDE8E1] bg-[#FAF8F5] hover:bg-[#F3EFEA] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="px-3 py-2 bg-[#7A3B3B] text-white rounded-xl text-center flex-shrink-0 shadow-2xs">
                          <span className="text-[10px] font-medium block uppercase text-white/80">{fechaStr}</span>
                          <span className="text-xs font-bold block">{horaInicio}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#2A2825]">
                            {t.clienteNombreCompleto || 'Cliente Registrado'}
                          </p>
                          <p className="text-xs text-[#7A3B3B] font-medium mt-0.5">
                            {servicioNombre} &bull; <span className="text-[#8A7F74]">{t.cabinaNombre || 'Cabina'}</span>
                          </p>
                          <span className="text-[11px] text-[#8A7F74]">
                            Horario: {horaInicio} hs a {horaFin} hs
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 self-stretch sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[#EDE8E1]">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            estado === 'confirmado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : estado === 'completado'
                              ? 'bg-[#FAF0ED] text-[#7A3B3B]'
                              : estado === 'cancelado'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {estado.toUpperCase()}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#7A3B3B]">
                            ${(t.total || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer de la Agenda */}
            <div className="pt-3 border-t border-[#EDE8E1] flex items-center justify-between text-xs text-[#8A7F74]">
              <span>
                <strong>{turnosAgenda.length}</strong> turno(s) en la agenda de este profesional
              </span>
              <button
                onClick={() => setProfesionalAgenda(null)}
                className="px-4 py-2 bg-[#3C3530] text-white rounded-xl font-semibold text-xs hover:bg-[#2A2825] transition-colors"
              >
                Cerrar Agenda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
