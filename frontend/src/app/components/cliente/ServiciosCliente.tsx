import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Sparkles, Scissors, ArrowRight, Loader2 } from 'lucide-react';
import { serviciosApi, type ServicioDto } from '../../../services/api';

interface ServiciosClienteProps {
  onSelectService: (serviceId: string) => void;
}

export function ServiciosCliente({ onSelectService }: ServiciosClienteProps) {
  const [servicios, setServicios] = useState<ServicioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todos');

  useEffect(() => {
    serviciosApi.getActivos()
      .then(data => {
        setServicios(data || []);
      })
      .catch(err => {
        console.error('Error al cargar servicios para clientes:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categorias = [
    { id: 'todos', label: 'Todos los Servicios' },
    { id: 'faciales', label: 'Faciales & Dermatocosmiatría' },
    { id: 'corporales', label: 'Corporales & Drenaje' },
    { id: 'masajes', label: 'Masajes & Relax' },
  ];

  const matchesCategoria = (servicio: ServicioDto, cat: string) => {
    if (cat === 'todos') return true;
    const name = servicio.nombre.toLowerCase();
    const desc = (servicio.descripcion || '').toLowerCase();
    const para = (servicio.paraQueSirve || '').toLowerCase();
    const full = `${name} ${desc} ${para}`;

    if (cat === 'faciales') {
      return full.includes('facial') || full.includes('peeling') || full.includes('limpieza') || full.includes('rostro');
    }
    if (cat === 'corporales') {
      return full.includes('corporal') || full.includes('drenaje') || full.includes('linfático') || full.includes('celulitis');
    }
    if (cat === 'masajes') {
      return full.includes('masaje') || full.includes('descontracturante') || full.includes('relax') || full.includes('piedras');
    }
    return true;
  };

  const filteredServicios = servicios.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.nombre.toLowerCase().includes(term) ||
      (s.descripcion && s.descripcion.toLowerCase().includes(term)) ||
      (s.paraQueSirve && s.paraQueSirve.toLowerCase().includes(term));

    return matchesSearch && matchesCategoria(s, selectedCategoria);
  });

  return (
    <div className="min-h-screen bg-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE8E1] text-[#7A3B3B] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Tratamientos & Procedimientos
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2A2825] tracking-tight">
            Nuestros Servicios Estéticos
          </h1>
          <p className="text-sm sm:text-base text-[#8A7F74] leading-relaxed">
            Descubrí nuestros tratamientos personalizados con tecnología de vanguardia y profesionales especialistas. Elegí tu tratamiento y agendá tu turno online en simples pasos.
          </p>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EDE8E1] shadow-xs">
          {/* Chips de Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoria(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategoria === cat.id
                    ? 'bg-[#7A3B3B] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#3C3530] hover:bg-[#EDE8E1] border border-[#EDE8E1]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Campo de Búsqueda */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
            <input
              type="text"
              placeholder="Buscar servicio o beneficio..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3B3B] text-[#2A2825]"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#7A3B3B]" />
            <p className="text-sm text-[#8A7F74]">Cargando tratamientos disponibles...</p>
          </div>
        )}

        {/* Grid de Servicios */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServicios.map(servicio => (
              <div
                key={servicio.servicioId}
                className="bg-white rounded-2xl overflow-hidden border border-[#EDE8E1] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Imagen del Servicio con Badges */}
                <div className="h-52 bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center border-b border-[#EDE8E1]">
                  {servicio.imagenUrl ? (
                    <img
                      src={servicio.imagenUrl}
                      alt={servicio.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#8A7F74]">
                      <Scissors className="w-12 h-12 text-[#7A3B3B]/60 mb-2" />
                      <span className="text-xs font-semibold">Tratamiento Estético</span>
                    </div>
                  )}

                  {/* Overlay gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Badge Duración */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 text-[#2A2825] backdrop-blur-xs shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                    <span>{servicio.duracionMin} minutos</span>
                  </div>

                  {/* Badge Precio */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-[#7A3B3B] text-white shadow-xs">
                    ${servicio.precio.toLocaleString()} ARS
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#2A2825] mb-2 leading-snug group-hover:text-[#7A3B3B] transition-colors">
                      {servicio.nombre}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#8A7F74] leading-relaxed mb-4 line-clamp-3">
                      {servicio.descripcion || 'Tratamiento estético profesional adaptado a tus necesidades particulares.'}
                    </p>

                    {/* ¿Para qué sirve? */}
                    {servicio.paraQueSirve && (
                      <div className="p-3 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#5A524A] space-y-1">
                        <span className="font-bold text-[#7A3B3B] uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#7A3B3B]" /> ¿Para qué sirve? / Beneficios
                        </span>
                        <p className="text-xs text-[#3C3530] leading-relaxed line-clamp-3">
                          {servicio.paraQueSirve}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botón Reservar Turno */}
                  <button
                    onClick={() => onSelectService(servicio.servicioId.toString())}
                    className="w-full mt-2 py-3 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm group-hover:bg-[#7A3B3B]"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Reservar este Turno</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && filteredServicios.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#EDE8E1] rounded-2xl">
            <p className="text-base text-[#8A7F74]">No se encontraron servicios con los filtros aplicados.</p>
            <button
              onClick={() => { setSelectedCategoria('todos'); setSearchTerm(''); }}
              className="mt-3 text-sm text-[#7A3B3B] font-semibold underline underline-offset-4"
            >
              Restablecer filtros
            </button>
          </div>
        )}

        {/* Banner de Ayuda & Diagnóstico IA */}
        <div className="bg-[#3C3530] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg font-bold">¿No estás segura de qué tratamiento elegir?</h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xl">
              Nuestra asistente con Inteligencia Artificial analiza tu biotipo cutáneo y te recomienda el servicio y la frecuencia ideal para tu piel.
            </p>
          </div>
          <button
            onClick={() => onSelectService('chat')}
            className="px-5 py-2.5 bg-white text-[#3C3530] hover:bg-[#FAF8F5] text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-colors shadow-xs"
          >
            Consultar al Asistente IA
          </button>
        </div>
      </div>
    </div>
  );
}
