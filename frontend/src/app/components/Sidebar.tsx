import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Users, UserCheck, Scissors, ShoppingBag, Gift, Settings, Store, LogOut, Shield, Wallet, PackageCheck, X } from 'lucide-react';
import type { AuthUser } from '../../services/api';
import { configuracionService, EVENTO_CONFIG_ACTUALIZADA, type ConfiguracionGeneral } from '../../services/configuracionService';
import { lealtadService, EVENTO_QR_SOLICITUD_CREADA, EVENTO_ESTAMPITA_ACREDITADA } from '../../services/lealtadService';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  currentUser?: AuthUser | null;
  onSwitchToCliente?: () => void;
  onSwitchToProfesional?: () => void;
  onLogout?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeSection,
  onSectionChange,
  currentUser,
  onSwitchToCliente,
  onSwitchToProfesional,
  onLogout,
  isOpenMobile,
  onCloseMobile
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
    { id: 'pedidos', label: 'Ventas y Pedidos', icon: PackageCheck },
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

  const renderSidebarContent = (isMobile?: boolean) => (
    <>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {(siteConfig.logoRedondoUrl || siteConfig.logoRectangularUrl || siteConfig.logoUrl) ? (
            <img
              src={siteConfig.logoRedondoUrl || siteConfig.logoRectangularUrl || siteConfig.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-contain bg-white shadow-2xs border border-border p-0.5 shrink-0"
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
        {isMobile && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSectionChange(item.id);
                    if (isMobile && onCloseMobile) onCloseMobile();
                  }}
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
              type="button"
              onClick={() => {
                onSwitchToCliente();
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors text-left"
              title="Ir a la tienda y vista cliente"
            >
              <Store className="w-4 h-4 text-primary shrink-0" />
              <span>Ver Tienda (Vista Cliente)</span>
            </button>
          )}

          {onSwitchToProfesional && (
            <button
              type="button"
              onClick={() => {
                onSwitchToProfesional();
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#7A3B3B] hover:bg-accent transition-colors text-left"
              title="Abrir Panel Profesional"
            >
              <UserCheck className="w-4 h-4 text-[#7A3B3B] shrink-0" />
              <span>Ver Panel Profesional</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (100% idéntico a la vista de computadora) */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border h-screen flex-col shrink-0">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer (overlay suave accesible desde el botón menú en celular) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-card border-r border-border h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}