import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Turnos } from './components/Turnos';
import { Clientes } from './components/Clientes';
import { Servicios } from './components/Servicios';
import { Productos } from './components/Productos';
import { ProgramaLealtad } from './components/ProgramaLealtad';
import { CalendarioTurnos } from './components/CalendarioTurnos';
import { NavbarCliente } from './components/cliente/NavbarCliente';
import { InicioCliente } from './components/cliente/InicioCliente';
import { ReservarTurno } from './components/cliente/ReservarTurno';
import { ProductosCliente } from './components/cliente/ProductosCliente';
import { TarjetaLealtad } from './components/cliente/TarjetaLealtad';
import { ChatIA } from './components/cliente/ChatIA';
import { Carrito } from './components/cliente/Carrito';
import { AuthPage } from './components/cliente/AuthPage';
import { authApi, type AuthUser } from '../services/api';
import { User, LogOut, Calendar, QrCode, ShoppingCart, Shield, LayoutDashboard, Scissors } from 'lucide-react';

interface ProductoCarrito {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  cantidad: number;
  imagen: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authApi.getCurrentUser());
  const [vistaActual, setVistaActual] = useState<'admin' | 'cliente'>(() => {
    const user = authApi.getCurrentUser();
    return user?.rol === 'Administrador' ? 'admin' : 'cliente';
  });
  const [activeSection, setActiveSection] = useState('inicio');
  const [carritoItems, setCarritoItems] = useState<ProductoCarrito[]>([]);
  const [wishlistItems] = useState<string[]>([]);

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setVistaActual('cliente');
    setActiveSection('inicio');
  };

  const handleAddToCart = (productId: string) => {
    const productos = [
      { id: '1', nombre: 'Crema Hidratante Premium', marca: 'La Roche-Posay', precio: 2500, imagen: '🧴' },
      { id: '2', nombre: 'Sérum Vitamina C', marca: 'Vichy', precio: 3200, imagen: '💧' },
      { id: '3', nombre: 'Protector Solar FPS 50+', marca: 'Eucerin', precio: 1800, imagen: '☀️' },
      { id: '4', nombre: 'Aceite Esencial Lavanda', marca: 'doTERRA', precio: 1500, imagen: '🌿' },
      { id: '5', nombre: 'Exfoliante Corporal', marca: 'The Body Shop', precio: 2100, imagen: '🧂' },
      { id: '6', nombre: 'Máscara Facial Purificante', marca: 'Natura', precio: 1900, imagen: '🎭' },
    ];

    const producto = productos.find(p => p.id === productId);
    if (!producto) return;

    setCarritoItems(prev => {
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCarritoItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, cantidad: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCarritoItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleCheckout = () => {
    alert('¡Compra realizada con éxito!\n\nRecibirás un email de confirmación con los detalles de tu pedido.');
    setCarritoItems([]);
    setActiveSection('inicio');
  };

  const renderAdminSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendario':
        return <CalendarioTurnos />;
      case 'turnos':
        return <Turnos />;
      case 'clientes':
        return <Clientes />;
      case 'servicios':
        return <Servicios />;
      case 'productos':
        return <Productos />;
      case 'lealtad':
        return <ProgramaLealtad />;
      case 'configuracion':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Configuración</h2>
            <p className="text-muted-foreground">Módulo en construcción...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  const renderClienteSection = () => {
    switch (activeSection) {
      case 'inicio':
        return <InicioCliente onNavigate={setActiveSection} />;

      case 'reservar':
        return <ReservarTurno />;

      case 'productos':
        return <ProductosCliente onAddToCart={handleAddToCart} />;

      case 'lealtad':
        // El Administrador no usa tarjeta de lealtad como cliente
        if (currentUser?.rol === 'Administrador') {
          return (
            <div className="max-w-xl mx-auto py-16 px-4 text-center">
              <div className="w-14 h-14 bg-[#EDE8E1] rounded-full flex items-center justify-center mx-auto mb-3 text-[#7A3B3B]">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[#2A2825] mb-2">Programa de Lealtad (Clientes)</h2>
              <p className="text-sm text-[#8A7F74] mb-6">
                La tarjeta de sellos y recompensas es exclusiva para cuentas de clientes. Como administrador podés configurar las reglas y recompensas desde el panel de control.
              </p>
              <button
                onClick={() => {
                  setVistaActual('admin');
                  setActiveSection('lealtad');
                }}
                className="px-5 py-2.5 bg-[#3C3530] text-white rounded-xl hover:bg-[#2A2825] transition-colors text-xs font-semibold"
              >
                Gestionar Programa en Panel Admin
              </button>
            </div>
          );
        }
        return <TarjetaLealtad />;

      case 'chat':
        return <ChatIA />;

      case 'carrito':
        // El Administrador no tiene carrito de compras personal
        if (currentUser?.rol === 'Administrador') {
          return (
            <div className="max-w-xl mx-auto py-16 px-4 text-center">
              <div className="w-14 h-14 bg-[#EDE8E1] rounded-full flex items-center justify-center mx-auto mb-3 text-[#7A3B3B]">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[#2A2825] mb-2">Carrito de Compras (Clientes)</h2>
              <p className="text-sm text-[#8A7F74] mb-6">
                El carrito de compras está reservado para clientes. Como administrador podés administrar el inventario, catálogo y precios de productos desde el panel.
              </p>
              <button
                onClick={() => {
                  setVistaActual('admin');
                  setActiveSection('productos');
                }}
                className="px-5 py-2.5 bg-[#3C3530] text-white rounded-xl hover:bg-[#2A2825] transition-colors text-xs font-semibold"
              >
                Gestionar Productos en Panel Admin
              </button>
            </div>
          );
        }
        return (
          <Carrito
            items={carritoItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
          />
        );

      case 'perfil':
        if (!currentUser) {
          return (
            <div className="max-w-md mx-auto py-20 px-4 text-center">
              <div className="w-16 h-16 bg-[#EDE8E1] rounded-full flex items-center justify-center mx-auto mb-4 text-[#7A3B3B]">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#2A2825] mb-2">Mi Perfil</h2>
              <p className="text-sm text-[#8A7F74] mb-6">
                Iniciá sesión o registrate para acceder a tus turnos agendados, beneficios del programa de lealtad y compras.
              </p>
              <button
                onClick={() => setActiveSection('auth')}
                className="px-6 py-3 bg-[#3C3530] text-white rounded-xl hover:bg-[#2A2825] transition-colors font-semibold text-sm shadow-sm"
              >
                Iniciar Sesión / Registrarse
              </button>
            </div>
          );
        }

        return (
          <div className="max-w-3xl mx-auto py-10 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-[#EDE8E1] overflow-hidden mb-6">
              {/* Header card */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-[#2A2825] to-[#3C3530] text-white flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-20 h-20 rounded-full bg-[#7A3B3B] text-white flex items-center justify-center text-2xl font-bold shadow-md">
                  {currentUser.nombre.charAt(0)}{currentUser.apellido ? currentUser.apellido.charAt(0) : ''}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
                    <h2 className="text-2xl font-bold">{currentUser.nombre} {currentUser.apellido}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white tracking-wide">
                      {currentUser.rol}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors border border-white/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar sesión
                </button>
              </div>

              {/* Quick shortcuts adaptados según el ROL del usuario */}
              {currentUser.rol === 'Administrador' ? (
                /* Accesos de gestión para Administrador (SIN Carrito ni Tarjeta de Lealtad) */
                <div className="p-6">
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7A3B3B]">Herramientas de Administración</p>
                    <p className="text-xs text-[#8A7F74]">Accesos directos de gestión del centro estético</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setVistaActual('admin');
                        setActiveSection('dashboard');
                      }}
                      className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                    >
                      <LayoutDashboard className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-semibold text-sm text-[#2A2825]">Dashboard & Métricas</h4>
                      <p className="text-xs text-[#8A7F74] mt-0.5">Ingresos, ocupación y resumen</p>
                    </button>

                    <button
                      onClick={() => {
                        setVistaActual('admin');
                        setActiveSection('calendario');
                      }}
                      className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                    >
                      <Calendar className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-semibold text-sm text-[#2A2825]">Agenda & Citas</h4>
                      <p className="text-xs text-[#8A7F74] mt-0.5">Control de turnos y horarios</p>
                    </button>

                    <button
                      onClick={() => {
                        setVistaActual('admin');
                        setActiveSection('servicios');
                      }}
                      className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                    >
                      <Scissors className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-semibold text-sm text-[#2A2825]">Servicios & Precios</h4>
                      <p className="text-xs text-[#8A7F74] mt-0.5">Catálogo y configuración</p>
                    </button>
                  </div>
                </div>
              ) : (
                /* Accesos de Cliente (Turnos, Tarjeta de Lealtad y Carrito) */
                <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveSection('reservar')}
                    className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                  >
                    <Calendar className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="font-semibold text-sm text-[#2A2825]">Mis Turnos</h4>
                    <p className="text-xs text-[#8A7F74] mt-0.5">Reservá o gestioná citas</p>
                  </button>

                  <button
                    onClick={() => setActiveSection('lealtad')}
                    className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                  >
                    <QrCode className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="font-semibold text-sm text-[#2A2825]">Tarjeta Lealtad</h4>
                    <p className="text-xs text-[#8A7F74] mt-0.5">Ver sellos y recompensas</p>
                  </button>

                  <button
                    onClick={() => setActiveSection('carrito')}
                    className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                  >
                    <ShoppingCart className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="font-semibold text-sm text-[#2A2825]">Mi Carrito</h4>
                    <p className="text-xs text-[#8A7F74] mt-0.5">{carritoItems.length} productos guardados</p>
                  </button>
                </div>
              )}

              {currentUser.rol === 'Administrador' && (
                <div className="px-6 pb-6 pt-2 border-t border-[#EDE8E1]">
                  <div className="flex items-center justify-between p-4 bg-[#F7F4F0] rounded-xl border border-[#DDD5C8]">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-[#7A3B3B]" />
                      <div>
                        <p className="text-xs font-bold text-[#2A2825]">Acceso Administrativo Habilitado</p>
                        <p className="text-[11px] text-[#8A7F74]">Tu cuenta posee permisos de gestión integral del centro estético.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setVistaActual('admin');
                        setActiveSection('dashboard');
                      }}
                      className="px-4 py-2 bg-[#3C3530] text-white text-xs font-semibold rounded-lg hover:bg-[#2A2825] transition-colors"
                    >
                      Ir al Panel Admin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'wishlist':
        return (
          <div className="max-w-4xl mx-auto py-8 px-4">
            <h2 className="text-2xl font-semibold mb-4">Lista de Deseos</h2>
            <div className="bg-white rounded-xl shadow-md border border-border p-6 text-center py-16">
              <p className="text-muted-foreground">Tu lista de deseos está vacía. ¡Explorá nuestros productos!</p>
              <button
                onClick={() => setActiveSection('productos')}
                className="mt-4 px-6 py-2 bg-[#3C3530] text-white rounded-lg hover:bg-[#2A2825] transition-colors text-sm"
              >
                Ver Productos
              </button>
            </div>
          </div>
        );

      default:
        return <InicioCliente onNavigate={setActiveSection} />;
    }
  };

  // 1. Vista de Autenticación a pantalla completa (sin barra de navegación)
  if (activeSection === 'auth') {
    return (
      <AuthPage
        onLogin={(user) => {
          setCurrentUser(user);
          if (user.rol === 'Administrador') {
            setVistaActual('admin');
            setActiveSection('dashboard');
          } else {
            setVistaActual('cliente');
            setActiveSection('inicio');
          }
        }}
        onCancel={() => setActiveSection('inicio')}
      />
    );
  }

  // 2. Vista Administrativa (acceso condicionado por rol del usuario)
  if (vistaActual === 'admin') {
    // Si no es administrador, retornar a la vista de cliente
    if (currentUser?.rol !== 'Administrador') {
      setVistaActual('cliente');
      setActiveSection('inicio');
      return null;
    }

    return (
      <div className="flex h-screen bg-background">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          currentUser={currentUser}
          onSwitchToCliente={() => {
            setVistaActual('cliente');
            setActiveSection('inicio');
          }}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-8">
          {renderAdminSection()}
        </main>
      </div>
    );
  }

  // 3. Vista Cliente con Barra de Navegación adaptada al usuario
  return (
    <div className="min-h-screen bg-background">
      <NavbarCliente
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        cartCount={carritoItems.reduce((acc, item) => acc + item.cantidad, 0)}
        wishlistCount={wishlistItems.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchToAdmin={
          currentUser?.rol === 'Administrador'
            ? () => {
                setVistaActual('admin');
                setActiveSection('dashboard');
              }
            : undefined
        }
      />
      <main>
        {renderClienteSection()}
      </main>
    </div>
  );
}