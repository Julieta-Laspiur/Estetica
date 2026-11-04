import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CajaPagos } from './components/CajaPagos';
import { VentasPedidos } from './components/VentasPedidos';
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
import { ListaDeseos } from './components/cliente/ListaDeseos';
import { AuthPage } from './components/cliente/AuthPage';
import { PerfilCliente } from './components/cliente/PerfilCliente';
import { PanelProfesional } from './components/profesional/PanelProfesional';
import { authApi, pagosApi, type AuthUser } from '../services/api';
import { configuracionService } from '../services/configuracionService';
import {
  clienteStorageService,
  type ProductoCarrito,
  type WishlistItem,
} from '../services/clienteStorageService';
import { User, Shield } from 'lucide-react';

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

  // Cargar lista de deseos del cliente activo (no expira, no se borra al cerrar sesión)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() =>
    clienteStorageService.cargarWishlist(currentUser)
  );

  // Cargar carrito del cliente activo (vigencia: 10 días de inactividad según HU-08 de proyecto.md)
  const [carritoItems, setCarritoItems] = useState<ProductoCarrito[]>(() =>
    clienteStorageService.cargarCarrito(currentUser)
  );

  const [searchQuery, setSearchQuery] = useState('');

  // Sincronizar estado cuando cambia la cuenta autenticada (login, switch o logout)
  useEffect(() => {
    setWishlistItems(clienteStorageService.cargarWishlist(currentUser));
    setCarritoItems(clienteStorageService.cargarCarrito(currentUser));
  }, [currentUser?.usuarioId, currentUser?.email]);

  const handleUpdateUser = (updatedUser: AuthUser) => {
    setCurrentUser(updatedUser);
  };

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
      let nuevos: WishlistItem[];
      const exists = prev.some(item => item.id === productId);
      if (exists) {
        nuevos = prev.filter(item => item.id !== productId);
      } else {
        nuevos = [...prev, {
          id: productId,
          nombre: customItem?.nombre || 'Producto',
          marca: customItem?.marca || 'Estética',
          precio: customItem?.precio || 0,
          imagenUrl: customItem?.imagenUrl,
          descripcion: customItem?.descripcion,
        }];
      }
      clienteStorageService.guardarWishlist(nuevos, currentUser);
      return nuevos;
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistItems(prev => {
      const nuevos = prev.filter(item => item.id !== productId);
      clienteStorageService.guardarWishlist(nuevos, currentUser);
      return nuevos;
    });
  };

  const handleClearWishlist = () => {
    clienteStorageService.guardarWishlist([], currentUser);
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
    // Preservar de forma permanente los datos del usuario desconectado y cargar la vista limpia de invitado
    setWishlistItems(clienteStorageService.cargarWishlist(null));
    setCarritoItems(clienteStorageService.cargarCarrito(null));
    setVistaActual('cliente');
    setActiveSection('inicio');
    setServicioParaReserva(null);
  };

  const handleAddToCart = (productId: string, customItem?: { nombre: string; marca: string; precio: number; imagen?: string }, quantity = 1) => {
    setCarritoItems(prev => {
      let nuevos: ProductoCarrito[];
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        nuevos = prev.map(item =>
          item.id === productId
            ? { ...item, cantidad: item.cantidad + quantity }
            : item
        );
      } else if (customItem) {
        nuevos = [...prev, {
          id: productId,
          nombre: customItem.nombre,
          marca: customItem.marca,
          precio: customItem.precio,
          cantidad: quantity,
          imagen: customItem.imagen || '🧴'
        }];
      } else {
        const productos = [
          { id: '1', nombre: 'Crema Hidratante Premium', marca: 'La Roche-Posay', precio: 2500, imagen: '🧴' },
          { id: '2', nombre: 'Sérum Vitamina C', marca: 'Vichy', precio: 3200, imagen: '💧' },
          { id: '3', nombre: 'Protector Solar FPS 50+', marca: 'Eucerin', precio: 1800, imagen: '☀️' },
          { id: '4', nombre: 'Aceite Esencial Lavanda', marca: 'doTERRA', precio: 1500, imagen: '🌿' },
          { id: '5', nombre: 'Exfoliante Corporal', marca: 'The Body Shop', precio: 2100, imagen: '🧂' },
          { id: '6', nombre: 'Máscara Facial Purificante', marca: 'Natura', precio: 1900, imagen: '🎭' },
        ];

        const producto = productos.find(p => p.id === productId);
        nuevos = producto ? [...prev, { ...producto, cantidad: quantity }] : prev;
      }

      // Guardar con vigencia de 10 días de inactividad según HU-08
      clienteStorageService.guardarCarrito(nuevos, currentUser);
      return nuevos;
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCarritoItems(prev => {
      const nuevos = prev.map(item =>
        item.id === productId ? { ...item, cantidad: newQuantity } : item
      );
      clienteStorageService.guardarCarrito(nuevos, currentUser);
      return nuevos;
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCarritoItems(prev => {
      const nuevos = prev.filter(item => item.id !== productId);
      clienteStorageService.guardarCarrito(nuevos, currentUser);
      return nuevos;
    });
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
        clienteId: currentUser?.usuarioId || null,
        clienteEmail: currentUser?.email?.toLowerCase().trim() || null,
        clienteNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}`.trim() : 'Cliente Web',
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
      clienteStorageService.limpiarCarrito(currentUser);
      setCarritoItems([]);
      setActiveSection('inicio');
    }
  };

  const renderAdminSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'pedidos':
        return <VentasPedidos />;
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
            currentUser={currentUser}
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
          <PerfilCliente
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onNavigate={setActiveSection}
            onLogout={handleLogout}
          />
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
          // Fusionar elecciones de invitado a la cuenta del cliente y restaurar sus productos guardados
          const { carrito, wishlist } = clienteStorageService.fusionarDatosInvitadoAlIniciarSesion(user);
          setCarritoItems(carrito);
          setWishlistItems(wishlist);
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