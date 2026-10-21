import { useState } from 'react';
import { Calendar, Clock, Search, Filter, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Turno {
  id: string;
  fecha: string;
  hora: string;
  cliente: string;
  servicio: string;
  profesional: string;
  estado: 'confirmado' | 'pendiente' | 'cancelado' | 'completado';
  duracion: string;
  precio: string;
}

export function Turnos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const turnos: Turno[] = [
    {
      id: '1',
      fecha: '2026-05-14',
      hora: '09:00',
      cliente: 'María González',
      servicio: 'Facial Hidratante',
      profesional: 'Dra. López',
      estado: 'confirmado',
      duracion: '60 min',
      precio: '$1,200'
    },
    {
      id: '2',
      fecha: '2026-05-14',
      hora: '10:30',
      cliente: 'Ana Rodríguez',
      servicio: 'Masaje Relajante',
      profesional: 'Lic. Martínez',
      estado: 'confirmado',
      duracion: '90 min',
      precio: '$1,500'
    },
    {
      id: '3',
      fecha: '2026-05-14',
      hora: '11:00',
      cliente: 'Laura Fernández',
      servicio: 'Depilación Láser',
      profesional: 'Téc. García',
      estado: 'pendiente',
      duracion: '45 min',
      precio: '$800'
    },
    {
      id: '4',
      fecha: '2026-05-14',
      hora: '14:00',
      cliente: 'Sofía Pérez',
      servicio: 'Manicura Spa',
      profesional: 'Est. Torres',
      estado: 'confirmado',
      duracion: '60 min',
      precio: '$600'
    },
    {
      id: '5',
      fecha: '2026-05-14',
      hora: '15:30',
      cliente: 'Carla Martín',
      servicio: 'Limpieza Facial',
      profesional: 'Dra. López',
      estado: 'completado',
      duracion: '75 min',
      precio: '$1,100'
    },
  ];

  const getEstadoBadge = (estado: Turno['estado']) => {
    const styles = {
      confirmado: 'bg-green-100 text-green-700 border-green-200',
      pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelado: 'bg-red-100 text-red-700 border-red-200',
      completado: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs border ${styles[estado]}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const filteredTurnos = turnos.filter(
    turno =>
      turno.fecha === selectedDate &&
      (turno.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turno.servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turno.profesional.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Turnos</h2>
          <p className="text-muted-foreground mt-1">Administra la agenda de profesionales</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          Nuevo Turno
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por cliente, servicio o profesional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors">
            <Filter className="w-5 h-5" />
            Más Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredTurnos.length}</p>
              <p className="text-sm text-muted-foreground">Turnos Hoy</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredTurnos.filter(t => t.estado === 'confirmado').length}</p>
              <p className="text-sm text-muted-foreground">Confirmados</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredTurnos.filter(t => t.estado === 'pendiente').length}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredTurnos.filter(t => t.estado === 'cancelado').length}</p>
              <p className="text-sm text-muted-foreground">Cancelados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Turnos Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Hora</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Servicio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Profesional</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Duración</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Precio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTurnos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    No se encontraron turnos para la fecha seleccionada
                  </td>
                </tr>
              ) : (
                filteredTurnos.map((turno) => (
                  <tr key={turno.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{turno.hora}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{turno.cliente}</td>
                    <td className="px-6 py-4">{turno.servicio}</td>
                    <td className="px-6 py-4 text-muted-foreground">{turno.profesional}</td>
                    <td className="px-6 py-4 text-muted-foreground">{turno.duracion}</td>
                    <td className="px-6 py-4 font-medium">{turno.precio}</td>
                    <td className="px-6 py-4">{getEstadoBadge(turno.estado)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
