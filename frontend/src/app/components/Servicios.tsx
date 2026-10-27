import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Clock, X, AlertCircle, RefreshCw } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracionMin: '60',
    activo: true,
  });

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
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      duracionMin: '60',
      activo: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (servicio: ServicioDto) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      precio: servicio.precio.toString(),
      duracionMin: servicio.duracionMin.toString(),
      activo: servicio.activo,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleEstado = async (servicio: ServicioDto) => {
    try {
      await serviciosApi.cambiarEstado(servicio.servicioId, !servicio.activo);
      setServicios(prev =>
        prev.map(s => s.servicioId === servicio.servicioId ? { ...s, activo: !s.activo } : s)
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado del servicio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar o deshabilitar este servicio?')) return;
    try {
      await serviciosApi.eliminar(id);
      await cargarServicios();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el servicio');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setFormError('El nombre del servicio es obligatorio.');
      return;
    }
    const precioNum = parseFloat(formData.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setFormError('El precio debe ser un número positivo.');
      return;
    }
    const duracionNum = parseInt(formData.duracionMin, 10);
    if (isNaN(duracionNum) || duracionNum <= 0) {
      setFormError('La duración debe ser mayor a 0 minutos.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingServicio) {
        await serviciosApi.actualizar(editingServicio.servicioId, {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          precio: precioNum,
          duracionMin: duracionNum,
          activo: formData.activo,
        });
      } else {
        await serviciosApi.crear({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          precio: precioNum,
          duracionMin: duracionNum,
          activo: formData.activo,
        });
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
    (s.descripcion && s.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalActivos = servicios.filter(s => s.activo).length;
  const precioPromedio = servicios.length > 0
    ? Math.round(servicios.reduce((acc, s) => acc + s.precio, 0) / servicios.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Servicios</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Catálogo oficial de tratamientos y procedimientos estéticos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarServicios}
            disabled={loading}
            className="p-2 border border-border rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Nuevo Servicio
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Servicios</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold">{servicios.length}</p>
            <span className="text-xs text-muted-foreground">registrados</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Servicios Activos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-emerald-600">{totalActivos}</p>
            <span className="text-xs text-muted-foreground">en catálogo</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Precio Promedio</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-foreground">${precioPromedio.toLocaleString()}</p>
            <span className="text-xs text-muted-foreground">ARS</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción de servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && servicios.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando catálogo de servicios desde la base de datos...</p>
        </div>
      ) : (
        /* Servicios Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServicios.map((servicio) => (
            <div
              key={servicio.servicioId}
              className={`bg-card border rounded-xl p-5 transition-all hover:shadow-sm ${
                servicio.activo ? 'border-border' : 'border-border/50 opacity-70 bg-muted/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-foreground truncate">{servicio.nombre}</h3>
                  <button
                    onClick={() => handleToggleEstado(servicio)}
                    className="inline-flex items-center gap-1.5 mt-1 cursor-pointer"
                    title="Click para cambiar estado"
                  >
                    <span className={`w-2 h-2 rounded-full ${servicio.activo ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                      servicio.activo ? 'text-emerald-700' : 'text-muted-foreground'
                    }`}>
                      {servicio.activo ? 'Activo' : 'Deshabilitado'}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(servicio)}
                    className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    title="Editar servicio"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(servicio.servicioId)}
                    className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title="Eliminar o desactivar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[32px]">
                {servicio.descripcion || 'Sin descripción detallada.'}
              </p>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{servicio.duracionMin} min</span>
                </div>
                <div className="flex items-center font-bold text-base text-emerald-700">
                  <span>${servicio.precio.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredServicios.length === 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No se encontraron servicios que coincidan con la búsqueda.</p>
        </div>
      )}

      {/* Modal Crear / Editar Servicio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <h3 className="font-bold text-lg text-foreground">
                {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Radiofrecuencia Facial Tensora"
                  value={formData.nombre}
                  onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre el procedimiento, beneficios y aparatología..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Precio ($ ARS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="4500"
                    value={formData.precio}
                    onChange={(e) => setFormData(f => ({ ...f, precio: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    required
                    placeholder="60"
                    value={formData.duracionMin}
                    onChange={(e) => setFormData(f => ({ ...f, duracionMin: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activoCheckbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData(f => ({ ...f, activo: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary focus:ring-ring"
                />
                <label htmlFor="activoCheckbox" className="text-sm font-medium text-foreground cursor-pointer">
                  Habilitar inmediatamente en el catálogo público
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-accent rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-sm font-semibold transition-opacity flex items-center gap-2"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
