import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  duracion: number;
  precio: number;
  descripcion: string;
  profesionales: string[];
  activo: boolean;
}

export function Servicios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');

  const servicios: Servicio[] = [
    {
      id: '1',
      nombre: 'Facial Hidratante',
      categoria: 'Faciales',
      duracion: 60,
      precio: 1200,
      descripcion: 'Tratamiento profundo de hidratación facial con productos premium',
      profesionales: ['Dra. López', 'Lic. Sánchez'],
      activo: true
    },
    {
      id: '2',
      nombre: 'Masaje Relajante',
      categoria: 'Masajes',
      duracion: 90,
      precio: 1500,
      descripcion: 'Masaje corporal completo para relajación muscular',
      profesionales: ['Lic. Martínez', 'Téc. Romero'],
      activo: true
    },
    {
      id: '3',
      nombre: 'Depilación Láser Completa',
      categoria: 'Depilación',
      duracion: 45,
      precio: 800,
      descripcion: 'Sesión de depilación láser en zona a elegir',
      profesionales: ['Téc. García', 'Téc. Fernández'],
      activo: true
    },
    {
      id: '4',
      nombre: 'Manicura Spa',
      categoria: 'Uñas',
      duracion: 60,
      precio: 600,
      descripcion: 'Manicura completa con tratamiento hidratante',
      profesionales: ['Est. Torres', 'Est. Díaz'],
      activo: true
    },
    {
      id: '5',
      nombre: 'Limpieza Facial Profunda',
      categoria: 'Faciales',
      duracion: 75,
      precio: 1100,
      descripcion: 'Limpieza facial con extracción y mascarilla purificante',
      profesionales: ['Dra. López', 'Lic. Sánchez'],
      activo: true
    },
    {
      id: '6',
      nombre: 'Tratamiento Antiarrugas',
      categoria: 'Faciales',
      duracion: 90,
      precio: 2200,
      descripcion: 'Tratamiento facial anti-age con tecnología de última generación',
      profesionales: ['Dra. López'],
      activo: true
    },
    {
      id: '7',
      nombre: 'Masaje Descontracturante',
      categoria: 'Masajes',
      duracion: 60,
      precio: 1300,
      descripcion: 'Masaje terapéutico focalizado en zonas de tensión',
      profesionales: ['Lic. Martínez', 'Téc. Romero'],
      activo: true
    },
    {
      id: '8',
      nombre: 'Pedicura Completa',
      categoria: 'Uñas',
      duracion: 75,
      precio: 700,
      descripcion: 'Pedicura completa con exfoliación y esmaltado',
      profesionales: ['Est. Torres', 'Est. Díaz'],
      activo: true
    },
  ];

  const categorias = ['todas', ...Array.from(new Set(servicios.map(s => s.categoria)))];

  const filteredServicios = servicios.filter(
    servicio =>
      (selectedCategoria === 'todas' || servicio.categoria === selectedCategoria) &&
      (servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Servicios</h2>
          <p className="text-muted-foreground mt-1">Administra el catálogo de servicios</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Servicios</p>
          <p className="text-2xl font-bold mt-1">{servicios.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Categorías</p>
          <p className="text-2xl font-bold mt-1">{categorias.length - 1}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Precio Promedio</p>
          <p className="text-2xl font-bold mt-1">
            ${Math.round(servicios.reduce((acc, s) => acc + s.precio, 0) / servicios.length)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Más Solicitado</p>
          <p className="text-2xl font-bold mt-1 truncate" title="Facial Hidratante">Faciales</p>
        </div>
      </div>

      {/* Servicios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServicios.map((servicio) => (
          <div key={servicio.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold mb-1">{servicio.nombre}</h3>
                <span className="inline-block px-2 py-1 bg-secondary text-xs rounded">
                  {servicio.categoria}
                </span>
              </div>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {servicio.descripcion}
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{servicio.duracion} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-600">${servicio.precio}</span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">Profesionales</p>
                <div className="flex flex-wrap gap-1">
                  {servicio.profesionales.map((prof, idx) => (
                    <span key={idx} className="px-2 py-1 bg-accent text-xs rounded">
                      {prof}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className={`w-2 h-2 rounded-full ${servicio.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {servicio.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServicios.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No se encontraron servicios</p>
        </div>
      )}
    </div>
  );
}
