import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CajaPagos } from './components/CajaPagos';
import { Turnos } from './components/Turnos';
import { Clientes } from './components/Clientes';
import { Profesionales } from './components/Profesionales';
import { Servicios } from './components/Servicios';
import { Productos } from './components/Productos';
import { ProgramaLealtad } from './components/ProgramaLealtad';
import { CalendarioTurnos } from './components/CalendarioTurnos';
import { Configuracion } from './components/Configuracion';
import { NavbarCliente } from './components/cliente/NavbarCliente';
import { InicioCliente } from './components/cliente/InicioCliente';
import { ServiciosCliente } from './components/cliente/ServiciosCliente';
import { ReservarTurno } from './components/cliente/ReservarTurno';
import { ProductosCliente } from './components/cliente/ProductosCliente';
import { TarjetaLealtad } from './components/cliente/TarjetaLealtad';
import { ChatIA } from './components/cliente/ChatIA';
import { Carrito } from './components/cliente/Carrito';
import { ListaDeseos, type WishlistItem } from './components/cliente/ListaDeseos';
import { AuthPage } from './components/cliente/AuthPage';
import { PanelProfesional } from './components/profesional/PanelProfesional';
import { authApi, pagosApi, type AuthUser } from '../services/api';
import { configuracionService } from '../services/configuracionService';
import { User, LogOut, Calendar, QrCode, ShoppingCart, Shield, Scissors, Heart } from 'lucide-react';

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
  const [vistaActual, setVistaActual] = useState<'admin' | 'cliente' | 'profesional'>(() => {
    const user = authApi.getCurrentUser();
    if (user?.rol === 'Administrador') return 'admin';
    if (user?.rol === 'Profesional') return 'profesional';
    return 'cliente';
  });
  const [activeSection, setActiveSection] = useState('inicio');
  const [servicioParaReserva, setServicioParaReserva] = useState<string | null>(null);
  const [carritoItems, setCarritoItems] = useState<ProductoCarrito[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('estetica_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('estetica_wishlist', JSON.stringify(wishlistItems));
    } catch {}
  }, [wishlistItems]);

  // Detector de retorno desde Mercado Pago (Back URLs)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pagoStatus = params.get('pago_status') || params.get('collection_status') || params.get('status');
      const paymentId = params.get('payment_id') || params.get('collection_id');
      const externalRef = params.get('external_reference');

      if (pagoStatus) {
        if (pagoStatus === 'approved') {
          // Si el retorno es approved, actualizar la orden correspondiente a Pagada
          try {
            const ordenesLocales = JSON.parse(localStorage.getItem('estetica_ordenes_productos') || '[]');
            if (Array.isArray(ordenesLocales) && ordenesLocales.length > 0) {
              const actualizadas = ordenesLocales.map((o: any) => {
                if (externalRef && o.codigoOperacion === externalRef) {
                  return { ...o, estado: 'Pagada' };
                }
                return o;
              });
              localStorage.setItem('estetica_ordenes_productos', JSON.stringify(actualizadas));
            }
          } catch {}

          alert(
            `🎉 ¡PAGO PROCESADO EXITOSAMENTE!\n\n` +
            `Mercado Pago ha procesado tu transacción correctamente (ID: ${paymentId || 'MP-OK'}).\n` +
            `Tu compra o reserva se encuentra confirmada.`
          );
        } else if (pagoStatus === 'pending') {
          alert(
            `⏳ PAGO PENDIENTE DE ACREDITACIÓN\n\n` +
            `Mercado Pago reporta que tu pago está pendiente de procesamiento.\n` +
            `Tu compra u orden permanece en estado 'Pendiente de Pago' hasta que se confirmen los fondos.`
          );
        } else {
          alert(
            `ℹ️ PAGO NO COMPLETADO\n\n` +
            `Has regresado a la tienda sin completar el pago en Mercado Pago.\n` +
            `Tu compra permanece en estado 'Pendiente de Pago'. Podés completar el pago en cualquier momento desde tu carrito o historial.`
          );
        }
        // Limpiar parámetros de la URL sin recargar
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Error al procesar parámetros de retorno MP:', e);
    }
  }, []);

  const handleToggleWishlist = (productId: string, customItem?: Partial<WishlistItem>) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === productId);
      if (exists) {
        return prev.filter(item => item.id !== productId);
      }
      return [...prev, {
        id: productId,
        nombre: customItem?.nombre || 'Producto',
        marca: customItem?.marca || 'Estética',
        precio: customItem?.precio || 0,
        imagenUrl: customItem?.imagenUrl,
        descripcion: customItem?.descripcion,
      }];
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleClearWishlist = () => {
    setWishlistItems([]);
  };

  const handleAddAllWishlistToCart = () => {
    wishlistItems.forEach(item => {
      handleAddToCart(item.id, {
        nombre: item.nombre,
        marca: item.marca,
        precio: item.precio,
        imagen: item.imagenUrl || '🧴'
      });
    });
    alert('¡Todos los productos de tu lista de deseos fueron agregados al carrito!');
  };

  const handleSelectServiceFromCatalog = (serviceId: string) => {
    if (serviceId === 'chat') {
      setActiveSection('chat');
      return;
    }
    setServicioParaReserva(serviceId);
    setActiveSection('reservar');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveSection('productos');
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setVistaActual('cliente');
    setActiveSection('inicio');
    setServicioParaReserva(null);
  };

  const handleAddToCart = (productId: string, customItem?: { nombre: string; marca: string; precio: number; imagen?: string }, quantity = 1) => {
    setCarritoItems(prev => {
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, cantidad: item.cantidad + quantity }
            : item
        );
      }
      if (customItem) {
        return [...prev, {
          id: productId,
          nombre: customItem.nombre,
          marca: customItem.marca,
          precio: customItem.precio,
          cantidad: quantity,
          imagen: customItem.imagen || '🧴'
        }];
      }
      const productos = [
        { id: '1', nombre: 'Crema Hidratante Premium', marca: 'La Roche-Posay', precio: 2500, imagen: '🧴' },
        { id: '2', nombre: 'Sérum Vitamina C', marca: 'Vichy', precio: 3200, imagen: '💧' },
        { id: '3', nombre: 'Protector Solar FPS 50+', marca: 'Eucerin', precio: 1800, imagen: '☀️' },
        { id: '4', nombre: 'Aceite Esencial Lavanda', marca: 'doTERRA', precio: 1500, imagen: '🌿' },
        { id: '5', nombre: 'Exfoliante Corporal', marca: 'The Body Shop', precio: 2100, imagen: '🧂' },
        { id: '6', nombre: 'Máscara Facial Purificante', marca: 'Natura', precio: 1900, imagen: '🎭' },
      ];

      const producto = productos.find(p => p.id === productId);
      if (!producto) return prev;

      return [...prev, { ...producto, cantidad: quantity }];
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

  const handleCheckout = async () => {
    if (carritoItems.length > 0) {
      const subtotal = carritoItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
      const cfg = configuracionService.get();
      const minGratis = cfg.montoEnvioGratis || 15000;
      const costoEnv = cfg.costoEnvioEstandar || 1200;
      const envio = subtotal >= minGratis ? 0 : costoEnv;
      const totalOrden = subtotal + envio;
      const ordenId = Date.now();
      let initPoint = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=PREF_${ordenId}`;
      let codigoOp = `MP-${Math.floor(100000000 + Math.random() * 900000000)}`;

      try {
        const resPago = await pagosApi.procesar({ ordenId: Math.floor(ordenId % 100000), proveedor: 0 });
        if (resPago && resPago.initPointUrl) {
          initPoint = resPago.initPointUrl;
          if (resPago.referenciaExterna) {
            codigoOp = resPago.referenciaExterna;
          }
        }
      } catch (e) {
        console.warn('Preferencia fallback para orden:', e);
      }

      const nuevaOrden = {
        ordenId,
        codigoOperacion: codigoOp,
        fecha: new Date().toISOString(),
        total: totalOrden,
        medioPago: 'mercadopago',
        medioDetalle: 'Mercado Pago Checkout',
        estado: 'Pendiente', // Pendiente hasta que el webhook de Mercado Pago confirme el pago
        clienteNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Cliente Web',
        detalles: carritoItems.map(item => ({
          detalleId: Math.floor(Math.random() * 10000),
          productoId: item.id,
          nombreProducto: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.precio * item.cantidad,
        })),
        initPointUrl: initPoint,
      };
      const ordenesLocales = JSON.parse(localStorage.getItem('estetica_ordenes_productos') || '[]');
      localStorage.setItem('estetica_ordenes_productos', JSON.stringify([nuevaOrden, ...ordenesLocales]));

      // Redirigir a la ventana de Mercado Pago
      window.open(initPoint, '_blank');

      alert(`¡Orden registrada como pendiente de pago!\n\nSe ha abierto la pasarela de Mercado Pago para abonar $${totalOrden.toLocaleString('es-AR')} ARS.\nTu pedido se confirmará automáticamente en cuanto Mercado Pago acredite la transacción.`);
      setCarritoItems([]);
      setActiveSection('inicio');
    }
  };

  const renderAdminSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'caja':
        return <CajaPagos />;
      case 'calendario':
        return <CalendarioTurnos />;
      case 'turnos':
        return <Turnos />;
      case 'clientes':
        return <Clientes />;
      case 'profesionales':
        return <Profesionales />;
      case 'servicios':
        return <Servicios />;
      case 'productos':
        return <Productos />;
      case 'lealtad':
        return <ProgramaLealtad />;
      case 'configuracion':
        return <Configuracion currentUser={currentUser} />;
      default:
        return <Dashboard />;
    }
  };

  const renderClienteSection = () => {
    switch (activeSection) {
      case 'inicio':
        return (
          <InicioCliente
            onNavigate={setActiveSection}
            onSelectService={handleSelectServiceFromCatalog}
            wishlistIds={wishlistItems.map(item => item.id)}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
          />
        );

      case 'servicios':
        return <ServiciosCliente onSelectService={handleSelectServiceFromCatalog} />;

      case 'reservar':
        return (
          <ReservarTurno
            initialServicioId={servicioParaReserva}
            currentUser={currentUser}
            onNavigate={setActiveSection}
          />
        );

      case 'productos':
        return (
          <ProductosCliente
            onAddToCart={handleAddToCart}
            wishlistIds={wishlistItems.map(item => item.id)}
            onToggleWishlist={handleToggleWishlist}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        );

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
        return <TarjetaLealtad currentUser={currentUser} />;

      case 'chat':
        return (
          <ChatIA
            currentUser={currentUser}
            onAddToCart={handleAddToCart}
            onSelectService={handleSelectServiceFromCatalog}
            wishlistIds={wishlistItems.map(item => item.id)}
            onToggleWishlist={handleToggleWishlist}
          />
        );

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
            onNavigate={setActiveSection}
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
              {currentUser.rol === 'Profesional' ? (
                /* Accesos directos para Profesional */
                <div className="p-6">
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7A3B3B]">Herramientas del Profesional</p>
                    <p className="text-xs text-[#8A7F74]">Ingresá a tu panel de agenda, turnos, fichas clínicas y perfil</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setVistaActual('profesional')}
                      className="p-4 rounded-xl border border-[#7A3B3B] bg-[#7A3B3B]/5 hover:bg-[#7A3B3B]/10 transition-all text-left group"
                    >
                      <User className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-semibold text-sm text-[#2A2825]">Abrir Panel del Profesional</h4>
                      <p className="text-xs text-[#8A7F74] mt-0.5">Mis turnos, agenda, clientes y ficha de perfil</p>
                    </button>
                  </div>
                </div>
              ) : currentUser.rol === 'Administrador' ? (
                /* Accesos de gestión para Administrador */
                <div className="p-6">
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7A3B3B]">Accesos Rápidos de Gestión</p>
                    <p className="text-xs text-[#8A7F74]">Atajos a los módulos operativos del centro</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setVistaActual('admin');
                        setActiveSection('calendario');
                      }}
                      className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                    >
                      <Calendar className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-semibold text-sm text-[#2A2825]">Agenda & Citas</h4>
                      <p className="text-xs text-[#8A7F74] mt-0.5">Control de turnos, horarios y cabinas</p>
                    </button>

                    <button
                      onClick={() => {
                        setVistaActual('admin');
                        setActiveSection('servicios');
                      }}
                      className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                    >
                      <Scissors className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-semibold text-sm text-[#2A2825]">Servicios & Tratamientos</h4>
                      <p className="text-xs text-[#8A7F74] mt-0.5">Catálogo, precios y duraciones</p>
                    </button>

                    <button
                      onClick={() => {
                        setVistaActual('admin');
                        setActiveSection('lealtad');
                      }}
                      className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                    >
                      <QrCode className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-semibold text-sm text-[#2A2825]">Programa Lealtad & QRs</h4>
                      <p className="text-xs text-[#8A7F74] mt-0.5">Acreditar estampitas y cupones</p>
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
                    onClick={() => setActiveSection('wishlist')}
                    className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                  >
                    <Heart className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="font-semibold text-sm text-[#2A2825]">Lista de Deseos</h4>
                    <p className="text-xs text-[#8A7F74] mt-0.5">{wishlistItems.length} favoritos guardados</p>
                  </button>

                  <button
                    onClick={() => setActiveSection('carrito')}
                    className="p-4 rounded-xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left group"
                  >
                    <ShoppingCart className="w-5 h-5 text-[#7A3B3B] mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="font-semibold text-sm text-[#2A2825]">Mi Carrito</h4>
                    <p className="text-xs text-[#8A7F74] mt-0.5">{carritoItems.length} productos en carrito</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'wishlist':
        return (
          <ListaDeseos
            items={wishlistItems}
            onRemoveItem={handleRemoveFromWishlist}
            onAddToCart={(id, custom) => handleAddToCart(id, custom)}
            onClearWishlist={handleClearWishlist}
            onAddAllToCart={handleAddAllWishlistToCart}
            onNavigate={setActiveSection}
          />
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
          } else if (user.rol === 'Profesional') {
            setVistaActual('profesional');
            setActiveSection('perfil');
          } else {
            setVistaActual('cliente');
            setActiveSection('inicio');
          }
        }}
        onCancel={() => setActiveSection('inicio')}
      />
    );
  }

  // 2. Vista del Panel del Profesional (idéntica a la captura de pantalla)
  if (vistaActual === 'profesional') {
    return (
      <PanelProfesional
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchToCliente={() => {
          setVistaActual('cliente');
          setActiveSection('inicio');
        }}
        onSwitchToAdmin={
          currentUser?.rol === 'Administrador'
            ? () => {
                setVistaActual('admin');
                setActiveSection('dashboard');
              }
            : undefined
        }
      />
    );
  }

  // 3. Vista Administrativa (acceso condicionado por rol del usuario)
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

  // 4. Vista Cliente con Barra de Navegación adaptada al usuario
  return (
    <div className="min-h-screen bg-background">
      <NavbarCliente
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        cartCount={carritoItems.reduce((acc, item) => acc + item.cantidad, 0)}
        wishlistCount={wishlistItems.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSearch={handleSearch}
        onSwitchToAdmin={
          currentUser?.rol === 'Administrador'
            ? () => {
                setVistaActual('admin');
                setActiveSection('dashboard');
              }
            : undefined
        }
        onSwitchToProfesional={
          currentUser?.rol === 'Profesional'
            ? () => {
                setVistaActual('profesional');
                setActiveSection('perfil');
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