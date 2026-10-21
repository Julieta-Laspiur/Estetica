import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Award } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  puntosLealtad: number;
  ultimaVisita: string;
  totalGastado: string;
  serviciosFavoritos: string[];
}

export function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');

  const clientes: Cliente[] = [
    {
      id: '1',
      nombre: 'María González',
      email: 'maria.gonzalez@email.com',
      telefono: '+54 11 2345-6789',
      direccion: 'Av. Corrientes 1234, CABA',
      puntosLealtad: 450,
      ultimaVisita: '2026-05-10',
      totalGastado: '$12,500',
      serviciosFavoritos: ['Facial Hidratante', 'Masaje Relajante']
    },
    {
      id: '2',
      nombre: 'Ana Rodríguez',
      email: 'ana.rodriguez@email.com',
      telefono: '+54 11 3456-7890',
      direccion: 'Calle Falsa 567, CABA',
      puntosLealtad: 320,
      ultimaVisita: '2026-05-12',
      totalGastado: '$8,900',
      serviciosFavoritos: ['Depilación Láser', 'Manicura']
    },
    {
      id: '3',
      nombre: 'Laura Fernández',
      email: 'laura.fernandez@email.com',
      telefono: '+54 11 4567-8901',
      direccion: 'Av. Santa Fe 2890, CABA',
      puntosLealtad: 680,
      ultimaVisita: '2026-05-13',
      totalGastado: '$18,300',
      serviciosFavoritos: ['Facial Antiarrugas', 'Tratamiento Corporal']
    },
    {
      id: '4',
      nombre: 'Sofía Pérez',
      email: 'sofia.perez@email.com',
      telefono: '+54 11 5678-9012',
      direccion: 'Calle Uruguay 890, CABA',
      puntosLealtad: 210,
      ultimaVisita: '2026-05-08',
      totalGastado: '$5,600',
      serviciosFavoritos: ['Manicura Spa', 'Pedicura']
    },
    {
      id: '5',
      nombre: 'Carla Martín',
      email: 'carla.martin@email.com',
      telefono: '+54 11 6789-0123',
      direccion: 'Av. Callao 1456, CABA',
      puntosLealtad: 890,
      ultimaVisita: '2026-05-14',
      totalGastado: '$24,700',
      serviciosFavoritos: ['Limpieza Facial', 'Masaje Descontracturante', 'Radiofrecuencia']
    },
  ];

  const filteredClientes = clientes.filter(
    cliente =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Clientes</h2>
          <p className="text-muted-foreground mt-1">Administra tu base de clientes</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Clientes</p>
          <p className="text-2xl font-bold mt-1">{clientes.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Clientes Activos</p>
          <p className="text-2xl font-bold mt-1">342</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Nuevos este Mes</p>
          <p className="text-2xl font-bold mt-1">28</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Puntos Otorgados</p>
          <p className="text-2xl font-bold mt-1">15,420</p>
        </div>
      </div>

      {/* Clientes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredClientes.map((cliente) => (
          <div key={cliente.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                  {cliente.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold">{cliente.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">{cliente.puntosLealtad} puntos</span>
                  </div>
                </div>
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

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{cliente.telefono}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{cliente.direccion}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Última Visita</p>
                  <p className="font-medium">{new Date(cliente.ultimaVisita).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Gastado</p>
                  <p className="font-medium text-green-600">{cliente.totalGastado}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Servicios Favoritos</p>
                <div className="flex flex-wrap gap-1">
                  {cliente.serviciosFavoritos.map((servicio, idx) => (
                    <span key={idx} className="px-2 py-1 bg-secondary text-xs rounded">
                      {servicio}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No se encontraron clientes</p>
        </div>
      )}
    </div>
  );
}
