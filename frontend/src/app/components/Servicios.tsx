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
  Scissors
} from 'lucide-react';
import { serviciosApi, type ServicioDto } from '../../services/api';

export function Servicios() {
  const [servicios, setServicios] = useState<ServicioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const cargarServicios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviciosApi.getTodos();
      setServicios(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los servicios.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const handleOpenCreateModal = () => {
    setEditingServicio(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormParaQueSirve('');
    setFormImagenUrl('');
    setFormPrecio('');
    setFormDuracionMin('60');
    setFormActivo(true);
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
      if (editingServicio) {
        await serviciosApi.actualizar(editingServicio.servicioId, payload);
        mostrarExito(`Servicio "${payload.nombre}" actualizado con éxito.`);
      } else {
        await serviciosApi.crear(payload as any);
        mostrarExito(`Servicio "${payload.nombre}" creado exitosamente.`);
      }
      setIsModalOpen(false);
      await cargarServicios();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServicios = servicios.filter(s =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.descripcion && s.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.paraQueSirve && s.paraQueSirve.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h2 className="text-2xl font-bold text-[#2A2825]">Gestión de Servicios & Tratamientos</h2>
          <p className="text-sm text-[#8A7F74] mt-0.5">Control de catálogo, descripciones, para qué sirve, duración e imágenes</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarServicios}
            disabled={loading}
            className="p-2.5 border border-[#EDE8E1] rounded-xl hover:bg-[#FAF8F5] text-[#8A7F74] transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
            <p className="text-2xl font-bold text-[#2A2825]">${precioPromedio.toLocaleString()}</p>
            <span className="text-xs text-[#8A7F74]">ARS</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o beneficios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3B3B] text-[#2A2825]"
          />
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
          {filteredServicios.map((servicio) => (
            <div
              key={servicio.servicioId}
              className={`bg-white border rounded-2xl overflow-hidden transition-all hover:shadow-md flex flex-col ${
                servicio.activo ? 'border-[#EDE8E1]' : 'border-[#EDE8E1]/60 opacity-75 bg-[#FAF8F5]/40'
              }`}
            >
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
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-md ${
                    servicio.activo ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
                  }`}>
                    {servicio.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-base text-[#2A2825] leading-snug line-clamp-1">
                      {servicio.nombre}
                    </h3>
                  </div>

                  <p className="text-xs text-[#8A7F74] line-clamp-2 leading-relaxed mb-3">
                    {servicio.descripcion || 'Sin descripción detallada.'}
                  </p>

                  {/* Sección: ¿Para qué sirve? */}
                  {servicio.paraQueSirve && (
                    <div className="p-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#5A524A] mb-3">
                      <span className="font-bold text-[#7A3B3B] block text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#7A3B3B]" /> ¿Para qué sirve?
                      </span>
                      <p className="line-clamp-2 leading-relaxed text-[#3C3530]">
                        {servicio.paraQueSirve}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer de la Tarjeta */}
                <div className="pt-3 border-t border-[#EDE8E1] flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-[#8A7F74]">
                    <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                    <span className="font-semibold">{servicio.duracionMin} min</span>
                  </div>

                  <div className="font-bold text-base text-emerald-700">
                    ${servicio.precio.toLocaleString()} <span className="text-[11px] font-normal text-[#8A7F74]">ARS</span>
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
            </div>
          ))}
        </div>
      )}

      {!loading && filteredServicios.length === 0 && (
        <div className="text-center py-16 bg-white border border-[#EDE8E1] rounded-2xl">
          <p className="text-[#8A7F74] text-sm">No se encontraron servicios que coincidan con la búsqueda.</p>
        </div>
      )}

      {/* MODAL CREAR / EDITAR SERVICIO COMPLETO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#EDE8E1] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
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
                    {editingServicio ? `Actualizando "${editingServicio.nombre}"` : 'Agregá un nuevo tratamiento al catálogo y sistema de turnos'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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

              {/* Fila 2: Precio y Duración */}
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

              {/* Fila 3: ¿Para qué sirve? / Beneficios & Indicaciones (CLAVE REQUERIDA) */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                  <label className="text-xs font-bold text-[#2A2825]">
                    ¿Para qué sirve? / Beneficios & Indicaciones
                  </label>
                </div>
                <p className="text-[11px] text-[#8A7F74]">
                  Explicá qué problema trata, qué resultados estéticos o terapéuticos ofrece y cómo beneficia a la clienta.
                </p>
                <textarea
                  rows={3}
                  placeholder="Ej. Reafirma el tejido dérmico, estimula la formación de colágeno, combate la flacidez facial y redefine el óvalo del rostro."
                  value={formParaQueSirve}
                  onChange={(e) => setFormParaQueSirve(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B] leading-relaxed"
                />
              </div>

              {/* Fila 4: Descripción General */}
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

              {/* Fila 5: Carga de Imagen del Servicio (CLAVE REQUERIDA) */}
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

                {uploadError && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {uploadError}
                  </div>
                )}

                {/* Previsualización si existe imagen */}
                {formImagenUrl ? (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#EDE8E1]">
                    <div className="w-24 h-20 rounded-xl border border-[#EDE8E1] overflow-hidden bg-[#FAF8F5] shrink-0">
                      <img
                        src={formImagenUrl}
                        alt="Previsualización"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#2A2825] truncate">Imagen cargada</p>
                      <p className="text-[11px] text-[#8A7F74] truncate">{formImagenUrl}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoImagen}
                        className="mt-2 text-xs text-[#7A3B3B] font-semibold hover:underline flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Reemplazar imagen desde archivo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#EDE8E1] rounded-xl bg-white hover:border-[#7A3B3B]/50 transition-colors text-center">
                    <ImageIcon className="w-8 h-8 text-[#8A7F74] mb-2" />
                    <p className="text-xs font-bold text-[#2A2825]">Cargá la imagen del servicio</p>
                    <p className="text-[11px] text-[#8A7F74] mt-0.5 mb-3">
                      Subí una foto del tratamiento (JPG, PNG, WebP) o ingresá un enlace directo
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={subiendoImagen}
                      className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#EDE8E1] text-[#3C3530] text-xs font-semibold rounded-xl border border-[#EDE8E1] flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {subiendoImagen ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#7A3B3B]" />
                          <span>Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#7A3B3B]" />
                          <span>Seleccionar archivo desde equipo</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Input oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* URL opcional */}
                <div>
                  <label className="block text-[11px] font-medium text-[#8A7F74] mb-1">
                    O pegá directamente una URL de imagen:
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... o /uploads/servicios/..."
                    value={formImagenUrl}
                    onChange={(e) => setFormImagenUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
              </div>

              {/* Fila 6: Estado Activo */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="servicioActivoCheck"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="w-4 h-4 text-[#7A3B3B] rounded border-[#EDE8E1] focus:ring-[#7A3B3B]"
                />
                <label htmlFor="servicioActivoCheck" className="text-xs font-semibold text-[#3C3530] cursor-pointer">
                  Habilitar inmediatamente para reserva de turnos en el catálogo público
                </label>
              </div>

              {/* Botones del Modal */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EDE8E1] mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || subiendoImagen}
                  className="px-5 py-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
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
