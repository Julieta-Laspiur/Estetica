import { LayoutDashboard, Calendar, Users, Scissors, ShoppingBag, Gift, Settings } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'turnos', label: 'Lista Turnos', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'servicios', label: 'Servicios', icon: Scissors },
    { id: 'productos', label: 'Productos', icon: ShoppingBag },
    { id: 'lealtad', label: 'Programa Lealtad', icon: Gift },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold text-primary">Centro Estético</h1>
        <p className="text-sm text-muted-foreground mt-1">Panel Administrativo</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <span>A</span>
          </div>
          <div>
            <p className="font-medium">Admin</p>
            <p className="text-xs text-muted-foreground">admin@estetica.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}