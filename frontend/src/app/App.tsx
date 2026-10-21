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

interface ProductoCarrito {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  cantidad: number;
  imagen: string;
}

export default function App() {
  const [vistaActual, setVistaActual] = useState<'admin' | 'cliente'>('cliente');
  const [activeSection, setActiveSection] = useState('inicio');
  const [carritoItems, setCarritoItems] = useState<ProductoCarrito[]>([]);
  const [wishlistItems] = useState<string[]>([]);

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
        return <TarjetaLealtad />;
      case 'chat':
        return <ChatIA />;
      case 'carrito':
        return (
          <Carrito
            items={carritoItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
          />
        );
      case 'perfil':
        return (
          <div className="max-w-4xl mx-auto py-8 px-4">
            <h2 className="text-2xl font-semibold mb-4">Mi Perfil</h2>
            <div className="bg-white rounded-xl shadow-md border border-border p-6">
              <p className="text-muted-foreground">Sección en construcción...</p>
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

  if (vistaActual === 'admin') {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-4">
            <button
              onClick={() => {
                setVistaActual('cliente');
                setActiveSection('inicio');
              }}
              className="px-4 py-2 bg-secondary rounded-lg hover:bg-accent transition-colors"
            >
              Vista Cliente
            </button>
          </div>
          {renderAdminSection()}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavbarCliente
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        cartCount={carritoItems.reduce((acc, item) => acc + item.cantidad, 0)}
        wishlistCount={wishlistItems.length}
        onSwitchToAdmin={() => {
          setVistaActual('admin');
          setActiveSection('dashboard');
        }}
      />
      <main>
        {renderClienteSection()}
      </main>
    </div>
  );
}