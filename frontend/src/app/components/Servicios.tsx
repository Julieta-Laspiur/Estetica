import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Clock,
  X,
  AlertCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Sparkles,
  Scissors,
  Layers,
  DoorOpen,
  UserCheck
} from 'lucide-react';
import {
  serviciosApi,
  usuariosApi,
  turnosApi,
  type ServicioDto,
  type ProfesionalDto,
  type CabinaDto
} from '../../services/api';

const CATEGORIAS_VALIDAS = ['Facial', 'Corporal', 'Masajes', 'Pestañas/Cejas'] as const;
type CategoriaServicio = typeof CATEGORIAS_VALIDAS[number];

export function Servicios() {
  const [servicios, setServicios] = useState<ServicioDto[]>([]);
  const [profesionales, setProfesionales] = useState<ProfesionalDto[]>([]);
  const [cabinas, setCabinas] = useState<CabinaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formParaQueSirve, setFormParaQueSirve] = useState('');
  const [formImagenUrl, setFormImagenUrl] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formDuracionMin, setFormDuracionMin] = useState('60');
  const [formActivo, setFormActivo] = useState(true);

  // Nuevos Campos Solicitados:
  const [formCategoria, setFormCategoria] = useState<CategoriaServicio>('Facial');
  const [formRequiereCabina, setFormRequiereCabina] = useState(false);
  const [formCabinaId, setFormCabinaId] = useState<number>(1);
  const [formProfesionalesHabilitados, setFormProfesionalesHabilitados] = useState<number[]>([]);

  // Image Upload State
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Feedback Toast
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const mostrarExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Cargar lista de profesionales y cabinas
  const cargarAuxiliares = useCallback(async () => {
    try {
      const [profs, cabs] = await Promise.allSettled([
        usuariosApi.getProfesionalesList(),
        turnosApi.getCabinas(),
      ]);

      if (profs.status === 'fulfilled' && profs.value) {
        setProfesionales(profs.value);
      } else {
        // Fallback
        setProfesionales([
          { profesionalId: 1, usuarioId: 2, nombreCompleto: 'Dra. Camila Rossi', nombre: 'Camila', apellido: 'Rossi', email: 'camila@estetica.com', especialidad: 'Dermatocosmiatría y Facial', activo: true },
          { profesionalId: 2, usuarioId: 3, nombreCompleto: 'Lic. Sofía Vega', nombre: 'Sofía', apellido: 'Vega', email: 'sofia@estetica.com', especialidad: 'Masoterapia y Drenaje', activo: true },
          { profesionalId: 3, usuarioId: 4, nombreCompleto: 'Téc. Lucía Méndez', nombre: 'Lucía', apellido: 'Méndez', email: 'lucia@estetica.com', especialidad: 'Aparatología y Estética Corporal', activo: true },
        ]);
      }

      if (cabs.status === 'fulfilled' && cabs.value) {
        setCabinas(cabs.value);
      } else {
        setCabinas([
          { cabinaId: 1, nombre: 'Cabina 1 - Facial', descripcion: 'Tratamientos Faciales y Peeling', estado: 'Disponible' },
          { cabinaId: 2, nombre: 'Cabina 2 - Corporal', descripcion: 'Aparatología y Drenaje', estado: 'Disponible' },
          { cabinaId: 3, nombre: 'Cabina 3 - Masajes & Spa', descripcion: 'Masoterapia y Relax', estado: 'Disponible' },
          { cabinaId: 4, nombre: 'Cabina 4 - Cejas y Pestañas', descripcion: 'Lifting y Microblading', estado: 'Disponible' },
        ]);
      }
    } catch (e) {
      console.warn('Error cargando auxiliares para servicios:', e);
    }
  }, []);

  // Cargar catálogo de servicios combinando con metadatos extendidos
  const cargarServicios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviciosApi.getTodos();
      const metaGuardada = JSON.parse(localStorage.getItem('estetica_servicios_meta') || '{}');

      const enriquecidos: ServicioDto[] = (data || []).map((s) => {
        const meta = metaGuardada[String(s.servicioId)] || {};

        // Inferencia inteligente de categoría inicial si no está establecida
        let catDefault: CategoriaServicio = 'Facial';
        const nLower = s.nombre.toLowerCase();
        if (nLower.includes('masaje') || nLower.includes('descontracturante') || nLower.includes('linfático')) {
          catDefault = 'Masajes';
        } else if (nLower.includes('corporal') || nLower.includes('reductores') || nLower.includes('drenaje')) {
          catDefault = 'Corporal';
        } else if (nLower.includes('pestaña') || nLower.includes('ceja') || nLower.includes('lifting') || nLower.includes('microblading')) {
          catDefault = 'Pestañas/Cejas';
        }

        return {
          ...s,
          categoria: meta.categoria || s.categoria || catDefault,
          requiereCabinaEspecifica: meta.requiereCabinaEspecifica ?? s.requiereCabinaEspecifica ?? false,
          cabinaEspecificaId: meta.cabinaEspecificaId || s.cabinaEspecificaId || 1,
          cabinaEspecificaNombre: meta.cabinaEspecificaNombre || s.cabinaEspecificaNombre,
          profesionalesHabilitadosIds: meta.profesionalesHabilitadosIds || s.profesionalesHabilitadosIds || [1, 2, 3],
        };
      });

      setServicios(enriquecidos);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los servicios.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAuxiliares();
    cargarServicios();
  }, [cargarAuxiliares, cargarServicios]);

  const handleOpenCreateModal = () => {
    setEditingServicio(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormParaQueSirve('');
    setFormImagenUrl('');
    setFormPrecio('');
    setFormDuracionMin('60');
    setFormActivo(true);
    setFormCategoria('Facial');
    setFormRequiereCabina(false);
    setFormCabinaId(cabinas[0]?.cabinaId || 1);
    // Por defecto habilitar todos los profesionales activos
    setFormProfesionalesHabilitados(profesionales.map(p => p.profesionalId));
    setFormError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (servicio: ServicioDto) => {
    setEditingServicio(servicio);
    setFormNombre(servicio.nombre);
    setFormDescripcion(servicio.descripcion || '');
    setFormParaQueSirve(servicio.paraQueSirve || '');
    setFormImagenUrl(servicio.imagenUrl || '');
    setFormPrecio(servicio.precio.toString());
    setFormDuracionMin(servicio.duracionMin.toString());
    setFormActivo(servicio.activo);
    setFormCategoria((servicio.categoria as CategoriaServicio) || 'Facial');
    setFormRequiereCabina(!!servicio.requiereCabinaEspecifica);
    setFormCabinaId(servicio.cabinaEspecificaId || 1);
    setFormProfesionalesHabilitados(
      servicio.profesionalesHabilitadosIds && servicio.profesionalesHabilitadosIds.length > 0
        ? servicio.profesionalesHabilitadosIds
        : profesionales.map(p => p.profesionalId)
    );
    setFormError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleToggleEstado = async (servicio: ServicioDto) => {
    try {
      const nuevoEstado = !servicio.activo;
      await serviciosApi.cambiarEstado(servicio.servicioId, nuevoEstado);
      setServicios(prev =>
        prev.map(s => s.servicioId === servicio.servicioId ? { ...s, activo: nuevoEstado } : s)
      );
      mostrarExito(`Servicio "${servicio.nombre}" ${nuevoEstado ? 'activado' : 'deshabilitado'} en el catálogo.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado del servicio');
    }
  };

  const handleDelete = async (servicio: ServicioDto) => {
    if (!window.confirm(`¿Confirmás que querés eliminar el servicio "${servicio.nombre}"?\n\nSi posee turnos agendados o históricos, se deshabilitará lógicamente para proteger los registros.`)) return;
    try {
      const res = await serviciosApi.eliminar(servicio.servicioId);
      mostrarExito(res.message || 'Servicio eliminado correctamente.');
      await cargarServicios();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el servicio');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('El archivo debe ser una imagen válida (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar los 5MB.');
      return;
    }

    setSubiendoImagen(true);
    setUploadError(null);
    try {
      const res = await serviciosApi.uploadImagen(file);
      setFormImagenUrl(res.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir la imagen.');
    } finally {
      setSubiendoImagen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle asignación de profesional
  const toggleProfesionalHabilitado = (profId: number) => {
    setFormProfesionalesHabilitados(prev =>
      prev.includes(profId) ? prev.filter(id => id !== profId) : [...prev, profId]
    );
  };

  const handleSeleccionarTodosProfesionales = () => {
    setFormProfesionalesHabilitados(profesionales.map(p => p.profesionalId));
  };

  const handleDeseleccionarTodosProfesionales = () => {
    setFormProfesionalesHabilitados([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setFormError('El nombre del servicio es obligatorio.');
      return;
    }
    const precioNum = parseFloat(formPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setFormError('El precio debe ser un número positivo.');
      return;
    }
    const duracionNum = parseInt(formDuracionMin, 10);
    if (isNaN(duracionNum) || duracionNum <= 0) {
      setFormError('La duración debe ser mayor a 0 minutos.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const cabinaSeleccionadaObj = cabinas.find(c => c.cabinaId === formCabinaId);

    const payload = {
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim() || undefined,
      paraQueSirve: formParaQueSirve.trim() || undefined,
      imagenUrl: formImagenUrl.trim() || undefined,
      precio: precioNum,
      duracionMin: duracionNum,
      activo: formActivo,
    };

    try {
      let servicioIdGuardado = editingServicio ? editingServicio.servicioId : 0;

      if (editingServicio) {
        const res = await serviciosApi.actualizar(editingServicio.servicioId, payload);
        servicioIdGuardado = res.servicioId;
        mostrarExito(`Servicio "${payload.nombre}" actualizado con éxito.`);
      } else {
        const res = await serviciosApi.crear(payload as any);
        servicioIdGuardado = res.servicioId;
        mostrarExito(`Servicio "${payload.nombre}" creado exitosamente.`);
      }

      // Persistir metadatos extendidos (Categoría, Cabina Específica, Profesionales Habilitados)
      const metaGuardada = JSON.parse(localStorage.getItem('estetica_servicios_meta') || '{}');
      metaGuardada[String(servicioIdGuardado)] = {
        categoria: formCategoria,
        requiereCabinaEspecifica: formRequiereCabina,
        cabinaEspecificaId: formRequiereCabina ? formCabinaId : undefined,
        cabinaEspecificaNombre: formRequiereCabina ? cabinaSeleccionadaObj?.nombre : undefined,
        profesionalesHabilitadosIds: formProfesionalesHabilitados,
      };
      localStorage.setItem('estetica_servicios_meta', JSON.stringify(metaGuardada));

      setIsModalOpen(false);
      await cargarServicios();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado de servicios
  const filteredServicios = servicios.filter(s => {
    // Filtro por término de búsqueda
    const query = searchTerm.toLowerCase();
    const coincideTexto =
      s.nombre.toLowerCase().includes(query) ||
      (s.descripcion && s.descripcion.toLowerCase().includes(query)) ||
      (s.paraQueSirve && s.paraQueSirve.toLowerCase().includes(query));

    if (!coincideTexto) return false;

    // Filtro por categoría
    if (filtroCategoria !== 'todos') {
      if (s.categoria !== filtroCategoria) return false;
    }

    return true;
  });

  const totalActivos = servicios.filter(s => s.activo).length;
  const precioPromedio = servicios.length > 0
    ? Math.round(servicios.reduce((acc, s) => acc + s.precio, 0) / servicios.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Toast de Éxito */}
      {mensajeExito && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3C3530] text-white px-4 py-3 rounded-xl shadow-lg border border-[#EDE8E1]/20 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{mensajeExito}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-[#7A3B3B] text-white rounded-xl shadow-xs">
              <Scissors className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2825]">Gestión de Servicios & Tratamientos</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#8A7F74]">
            Categorización (Facial, Corporal, Masajes, Pestañas/Cejas), asignación de cabinas específicas y profesionales habilitados.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarServicios}
            disabled={loading}
            className="p-2.5 border border-[#EDE8E1] rounded-xl hover:bg-[#FAF8F5] text-[#8A7F74] transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7A3B3B]' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={cargarServicios} className="underline text-xs font-semibold">Reintentar</button>
        </div>
      )}

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <p className="text-xs text-[#8A7F74] font-semibold uppercase tracking-wider">Total Servicios</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-[#2A2825]">{servicios.length}</p>
            <span className="text-xs text-[#8A7F74]">registrados</span>
          </div>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <p className="text-xs text-[#8A7F74] font-semibold uppercase tracking-wider">Servicios Activos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-emerald-700">{totalActivos}</p>
            <span className="text-xs text-[#8A7F74]">disponibles para turnos</span>
          </div>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <p className="text-xs text-[#8A7F74] font-semibold uppercase tracking-wider">Precio Promedio</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-[#2A2825]">${precioPromedio.toLocaleString('es-AR')}</p>
            <span className="text-xs text-[#8A7F74]">ARS</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS & SELECTOR DE CATEGORÍA */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Píldoras de Categoría */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-bold text-[#8A7F74] mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#7A3B3B]" /> Categoría:
            </span>
            <button
              onClick={() => setFiltroCategoria('todos')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filtroCategoria === 'todos'
                  ? 'bg-[#7A3B3B] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#5A524A] hover:bg-[#EDE8E1]'
              }`}
            >
              Todos ({servicios.length})
            </button>
            {CATEGORIAS_VALIDAS.map(cat => {
              const count = servicios.filter(s => s.categoria === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    filtroCategoria === cat
                      ? 'bg-[#3C3530] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#5A524A] hover:bg-[#EDE8E1]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Barra de Búsqueda */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
            <input
              type="text"
              placeholder="Buscar servicio o beneficio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7A3B3B] text-[#2A2825]"
            />
          </div>
        </div>
      </div>

      {/* Estado de Carga */}
      {loading && servicios.length === 0 ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#7A3B3B]" />
          <p className="text-sm text-[#8A7F74]">Cargando catálogo de servicios desde la base de datos...</p>
        </div>
      ) : (
        /* Grilla de Servicios Estéticos */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServicios.map((servicio) => {
            const profsHabilitadosNombres = profesionales
              .filter(p => servicio.profesionalesHabilitadosIds?.includes(p.profesionalId))
              .map(p => p.nombreCompleto);

            return (
              <div
                key={servicio.servicioId}
                className={`bg-white border rounded-3xl overflow-hidden transition-all hover:shadow-md flex flex-col justify-between ${
                  servicio.activo ? 'border-[#EDE8E1]' : 'border-[#EDE8E1]/60 opacity-75 bg-[#FAF8F5]/40'
                }`}
              >
                <div>
                  {/* Imagen del Servicio */}
                  <div className="h-44 bg-[#FAF8F5] border-b border-[#EDE8E1] relative overflow-hidden flex items-center justify-center">
                    {servicio.imagenUrl ? (
                      <img
                        src={servicio.imagenUrl}
                        alt={servicio.nombre}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#8A7F74]">
                        <Scissors className="w-10 h-10 text-[#7A3B3B]/60 mb-1" />
                        <span className="text-[11px] font-medium">Sin imagen</span>
                      </div>
                    )}

                    {/* Badge de Categoría Superior Izquierda */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-md bg-white/95 text-[#7A3B3B] border border-[#EDE8E1]">
                        {servicio.categoria || 'Facial'}
                      </span>
                    </div>

                    {/* Badge de Estado Superior Derecha */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-md ${
                        servicio.activo ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {servicio.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Contenido de la Tarjeta */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-[#2A2825] leading-snug line-clamp-1">
                        {servicio.nombre}
                      </h3>
                      <p className="text-xs text-[#8A7F74] line-clamp-2 leading-relaxed mt-1">
                        {servicio.descripcion || 'Sin descripción detallada.'}
                      </p>
                    </div>

                    {/* Sección: ¿Para qué sirve? */}
                    {servicio.paraQueSirve && (
                      <div className="p-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#5A524A]">
                        <span className="font-bold text-[#7A3B3B] block text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#7A3B3B]" /> ¿Para qué sirve?
                        </span>
                        <p className="line-clamp-2 leading-relaxed text-[#3C3530]">
                          {servicio.paraQueSirve}
                        </p>
                      </div>
                    )}

                    {/* REQUERIMIENTO DE CABINA Y PROFESIONALES HABILITADOS */}
                    <div className="space-y-1.5 pt-2 border-t border-[#F5F2EB] text-xs">
                      {/* Cabina */}
                      <div className="flex items-center gap-1.5 text-[#5A524A]">
                        <DoorOpen className="w-3.5 h-3.5 text-[#7A3B3B] shrink-0" />
                        <span>
                          {servicio.requiereCabinaEspecifica ? (
                            <strong className="text-[#2A2825]">
                              Requiere {servicio.cabinaEspecificaNombre || `Cabina #${servicio.cabinaEspecificaId}`}
                            </strong>
                          ) : (
                            <span className="text-[#8A7F74]">Cualquier cabina disponible</span>
                          )}
                        </span>
                      </div>

                      {/* Profesionales Habilitados */}
                      <div className="flex items-start gap-1.5 text-[#5A524A]">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[#2A2825]">
                            {profsHabilitadosNombres.length > 0 ? (
                              <span>{profsHabilitadosNombres.length} profesional(es) habilitado(s):</span>
                            ) : (
                              <span className="text-amber-700">Sin profesionales asignados</span>
                            )}
                          </span>
                          {profsHabilitadosNombres.length > 0 && (
                            <p className="text-[11px] text-[#8A7F74] truncate">
                              {profsHabilitadosNombres.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer de la Tarjeta */}
                <div className="p-5 pt-3 border-t border-[#EDE8E1] flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-[#8A7F74]">
                    <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                    <span className="font-semibold">{servicio.duracionMin} min</span>
                  </div>

                  <div className="font-extrabold text-base text-[#2A2825]">
                    ${servicio.precio.toLocaleString('es-AR')} <span className="text-[10px] font-normal text-[#8A7F74]">ARS</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(servicio)}
                      className="p-1.5 border border-[#EDE8E1] rounded-xl text-[#3C3530] hover:text-[#7A3B3B] hover:bg-[#FAF8F5] transition-colors"
                      title="Editar servicio completo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleEstado(servicio)}
                      className={`p-1.5 border rounded-xl text-xs font-semibold transition-colors ${
                        servicio.activo
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={servicio.activo ? 'Deshabilitar del catálogo' : 'Habilitar en catálogo'}
                    >
                      {servicio.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(servicio)}
                      className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredServicios.length === 0 && (
        <div className="text-center py-16 bg-white border border-[#EDE8E1] rounded-2xl">
          <p className="text-[#8A7F74] text-sm">No se encontraron servicios que coincidan con la búsqueda o categoría.</p>
        </div>
      )}

      {/* MODAL CREAR / EDITAR SERVICIO COMPLETO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#EDE8E1] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#EDE8E1] bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#7A3B3B] text-white rounded-xl">
                  {editingServicio ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#2A2825]">
                    {editingServicio ? 'Editar Servicio Completo' : 'Nuevo Servicio Estético'}
                  </h3>
                  <p className="text-xs text-[#8A7F74]">
                    Configuración de categoría, cabina específica y profesionales habilitados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#8A7F74] hover:text-[#2A2825] hover:bg-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Fila 1: Nombre */}
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Radiofrecuencia Facial Tensora, Drenaje Linfático..."
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              {/* Fila 2: Selector de Categoría (CLAVE REQUERIDA) */}
              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#7A3B3B]" />
                  <span>Selector de Categoría *</span>
                </label>
                <p className="text-[11px] text-[#8A7F74]">
                  Clasificá el tratamiento para organizarlo en el catálogo y facilitar la reserva de turnos
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {CATEGORIAS_VALIDAS.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategoria(cat)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        formCategoria === cat
                          ? 'border-[#7A3B3B] bg-[#7A3B3B] text-white shadow-xs'
                          : 'border-[#EDE8E1] bg-white text-[#5A524A] hover:border-[#DDD5C8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fila 3: Precio y Duración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Precio ($ ARS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="6500"
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] font-semibold focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Duración Estimada (minutos) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    required
                    placeholder="45"
                    value={formDuracionMin}
                    onChange={(e) => setFormDuracionMin(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
              </div>

              {/* Fila 4: Check de si requiere cabina específica (CLAVE REQUERIDA) */}
              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-[#7A3B3B]" />
                    <div>
                      <span className="text-xs font-bold text-[#2A2825] block">
                        ¿Requiere cabina específica?
                      </span>
                      <span className="text-[11px] text-[#8A7F74]">
                        Si requiere equipamiento fijo o ambiente adaptado (ej. camilla de masajes o aparatología facial)
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formRequiereCabina}
                    onChange={(e) => setFormRequiereCabina(e.target.checked)}
                    className="w-4 h-4 text-[#7A3B3B] rounded focus:ring-[#7A3B3B]"
                  />
                </div>

                {formRequiereCabina && (
                  <div className="pt-2 border-t border-[#EDE8E1] space-y-1">
                    <label className="block text-xs font-semibold text-[#3C3530]">
                      Seleccionar Cabina Requerida:
                    </label>
                    <select
                      value={formCabinaId}
                      onChange={(e) => setFormCabinaId(parseInt(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                    >
                      {cabinas.map(c => (
                        <option key={c.cabinaId} value={c.cabinaId}>
                          {c.nombre} {c.descripcion ? `(${c.descripcion})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Fila 5: Asignación de qué profesionales están habilitados (CLAVE REQUERIDA) */}
              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#7A3B3B]" />
                    <div>
                      <span className="text-xs font-bold text-[#2A2825] block">
                        Profesionales Habilitados
                      </span>
                      <span className="text-[11px] text-[#8A7F74]">
                        Seleccioná qué especialistas pueden ser agendados para este servicio
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSeleccionarTodosProfesionales}
                      className="text-[#7A3B3B] font-bold hover:underline"
                    >
                      Todos
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleDeseleccionarTodosProfesionales}
                      className="text-[#8A7F74] hover:underline"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {profesionales.map(prof => {
                    const isChecked = formProfesionalesHabilitados.includes(prof.profesionalId);
                    return (
                      <div
                        key={prof.profesionalId}
                        onClick={() => toggleProfesionalHabilitado(prof.profesionalId)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-50/70 text-[#2A2825]'
                            : 'border-[#EDE8E1] bg-white text-[#8A7F74] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-bold block truncate text-[#2A2825]">
                            {prof.nombreCompleto}
                          </span>
                          <span className="text-[10px] text-[#8A7F74] block truncate">
                            {prof.especialidad}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fila 6: ¿Para qué sirve? / Beneficios & Indicaciones */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                  <label className="text-xs font-bold text-[#2A2825]">
                    ¿Para qué sirve? / Beneficios & Indicaciones
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder="Ej. Reafirma el tejido dérmico, estimula la formación de colágeno, combate la flacidez facial..."
                  value={formParaQueSirve}
                  onChange={(e) => setFormParaQueSirve(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B] leading-relaxed"
                />
              </div>

              {/* Fila 7: Descripción General */}
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Descripción General del Tratamiento
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el procedimiento, aparatología empleada, sesiones sugeridas..."
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B] leading-relaxed"
                />
              </div>

              {/* Fila 8: Carga de Imagen del Servicio */}
              <div className="border border-[#EDE8E1] rounded-2xl p-4 bg-[#FAF8F5] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2A2825] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#7A3B3B]" />
                    Imagen del Servicio
                  </label>
                  {formImagenUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImagenUrl('')}
                      className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Quitar imagen
                    </button>
                  )}
                </div>

                {formImagenUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={formImagenUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-[#EDE8E1]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Imagen cargada correctamente
                      </p>
                      <p className="text-[11px] text-[#8A7F74] truncate mt-0.5">{formImagenUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      id="upload-servicio-imagen"
                    />
                    <label
                      htmlFor="upload-servicio-imagen"
                      className={`flex flex-col items-center justify-center border-2 border-dashed border-[#DDD5C8] rounded-xl p-4 text-center cursor-pointer hover:bg-white transition-colors ${
                        subiendoImagen ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {subiendoImagen ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-[#7A3B3B] mb-1" />
                          <span className="text-xs font-semibold text-[#3C3530]">Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-[#7A3B3B] mb-1" />
                          <span className="text-xs font-semibold text-[#3C3530]">
                            Hacé clic para subir imagen (JPG, PNG, WebP)
                          </span>
                          <span className="text-[10px] text-[#8A7F74] mt-0.5">Tamaño máximo recomendado 5MB</span>
                        </>
                      )}
                    </label>
                    {uploadError && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uploadError}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Fila 9: Activo en Catálogo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="servicioActivoCheck"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="w-4 h-4 text-[#7A3B3B] rounded"
                />
                <label htmlFor="servicioActivoCheck" className="text-xs font-semibold text-[#3C3530] cursor-pointer">
                  Habilitar servicio inmediatamente para reserva de turnos
                </label>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#5A524A] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingServicio ? 'Guardar Cambios' : 'Crear Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicios;
