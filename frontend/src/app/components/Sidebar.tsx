import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Users, UserCheck, Scissors, ShoppingBag, Gift, Settings, Store, LogOut, Shield, Wallet } from 'lucide-react';
import type { AuthUser } from '../../services/api';
import { configuracionService, EVENTO_CONFIG_ACTUALIZADA, type ConfiguracionGeneral } from '../../services/configuracionService';
import { lealtadService, EVENTO_QR_SOLICITUD_CREADA, EVENTO_ESTAMPITA_ACREDITADA } from '../../services/lealtadService';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  currentUser?: AuthUser | null;
  onSwitchToCliente?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  activeSection,
  onSectionChange,
  currentUser,
  onSwitchToCliente,
  onLogout
}: SidebarProps) {
  const [siteConfig, setSiteConfig] = useState<ConfiguracionGeneral>(() => configuracionService.get());
  const [qrsPendientes, setQrsPendientes] = useState<number>(() => lealtadService.getPendientes().length);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) {
        setSiteConfig(e.detail);
      } else {
        setSiteConfig(configuracionService.get());
      }
    };
    window.addEventListener(EVENTO_CONFIG_ACTUALIZADA, handler);
    return () => window.removeEventListener(EVENTO_CONFIG_ACTUALIZADA, handler);
  }, []);

  // Escuchar solicitudes de QR en tiempo real para alertar al admin
  useEffect(() => {
    const actualizarPendientes = () => {
      setQrsPendientes(lealtadService.getPendientes().length);
    };

    window.addEventListener(EVENTO_QR_SOLICITUD_CREADA, actualizarPendientes);
    window.addEventListener(EVENTO_ESTAMPITA_ACREDITADA, actualizarPendientes);
    window.addEventListener('estetica_qr_solicitud_actualizada', actualizarPendientes);

    return () => {
      window.removeEventListener(EVENTO_QR_SOLICITUD_CREADA, actualizarPendientes);
      window.removeEventListener(EVENTO_ESTAMPITA_ACREDITADA, actualizarPendientes);
      window.removeEventListener('estetica_qr_solicitud_actualizada', actualizarPendientes);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'caja', label: 'Caja y Pagos', icon: Wallet },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'turnos', label: 'Lista Turnos', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'profesionales', label: 'Profesionales', icon: UserCheck },
    { id: 'servicios', label: 'Servicios', icon: Scissors },
    { id: 'productos', label: 'Productos', icon: ShoppingBag },
    { 
      id: 'lealtad', 
      label: 'Programa Lealtad', 
      icon: Gift,
      badge: qrsPendientes > 0 ? `${qrsPendientes} QR` : undefined 
    },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          {(siteConfig.logoRedondoUrl || siteConfig.logoUrl) ? (
            <img
              src={siteConfig.logoRedondoUrl || siteConfig.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover bg-white shadow-2xs border border-border"
            />
          ) : (
            <Shield className="w-5 h-5 text-primary shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-primary truncate leading-tight">
              {siteConfig.nombreCentro}
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide">Panel Administrativo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#7A3B3B] text-white shadow-xs shrink-0 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile integrated at the bottom of the sidebar */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {currentUser?.nombre ? currentUser.nombre.charAt(0) : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs truncate text-foreground">
              {currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Administradora'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{currentUser?.email || 'admin@estetica.com'}</p>
          </div>
        </div>

        <div className="space-y-1 pt-1 border-t border-border/50">
          {onSwitchToCliente && (
            <button
              onClick={onSwitchToCliente}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors text-left"
              title="Ir a la tienda y vista cliente"
            >
              <Store className="w-4 h-4 text-primary shrink-0" />
              <span>Ver Tienda (Vista Cliente)</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}