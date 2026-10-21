import { TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const stats = [
    { title: 'Turnos Hoy', value: '24', change: '+12%', icon: Calendar, color: 'text-blue-600' },
    { title: 'Clientes Activos', value: '342', change: '+8%', icon: Users, color: 'text-green-600' },
    { title: 'Ingresos del Mes', value: '$45,230', change: '+23%', icon: DollarSign, color: 'text-purple-600' },
    { title: 'Tasa de Ocupación', value: '87%', change: '+5%', icon: TrendingUp, color: 'text-orange-600' },
  ];

  const appointmentsData = [
    { dia: 'Lun', turnos: 28 },
    { dia: 'Mar', turnos: 35 },
    { dia: 'Mié', turnos: 32 },
    { dia: 'Jue', turnos: 40 },
    { dia: 'Vie', turnos: 38 },
    { dia: 'Sáb', turnos: 45 },
    { dia: 'Dom', turnos: 22 },
  ];

  const servicesData = [
    { name: 'Faciales', value: 35, color: '#8b5cf6' },
    { name: 'Masajes', value: 25, color: '#3b82f6' },
    { name: 'Depilación', value: 20, color: '#10b981' },
    { name: 'Manicura', value: 15, color: '#f59e0b' },
    { name: 'Otros', value: 5, color: '#ef4444' },
  ];

  const revenueData = [
    { mes: 'Ene', ingresos: 32000 },
    { mes: 'Feb', ingresos: 35000 },
    { mes: 'Mar', ingresos: 38000 },
    { mes: 'Abr', ingresos: 42000 },
    { mes: 'May', ingresos: 45230 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Vista general del centro estético</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnos por Día */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Turnos por Día (Última Semana)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={appointmentsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="turnos" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de Servicios */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Distribución de Servicios (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={servicesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {servicesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Evolución de Ingresos (Últimos 5 Meses)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Próximos Turnos */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Próximos Turnos de Hoy</h3>
        <div className="space-y-3">
          {[
            { time: '10:00', client: 'María González', service: 'Facial Hidratante', professional: 'Dra. López' },
            { time: '11:30', client: 'Ana Rodríguez', service: 'Masaje Relajante', professional: 'Lic. Martínez' },
            { time: '14:00', client: 'Laura Fernández', service: 'Depilación Láser', professional: 'Téc. García' },
            { time: '15:30', client: 'Sofía Pérez', service: 'Manicura', professional: 'Est. Torres' },
          ].map((appointment, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{appointment.time}</div>
                </div>
                <div>
                  <p className="font-medium">{appointment.client}</p>
                  <p className="text-sm text-muted-foreground">{appointment.service}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{appointment.professional}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
