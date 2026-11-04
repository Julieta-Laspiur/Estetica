import { useState, useEffect } from 'react';
import {
    Trash2, Plus, Minus, ShoppingBag, ShieldCheck, Truck, Sparkles,
    ArrowRight, Package, CheckCircle, ExternalLink, RotateCcw,
    Clock, AlertTriangle, FileText
} from 'lucide-react';
import { configuracionService } from '../../../services/configuracionService';

interface ProductoCarrito {
    id: string;
    nombre: string;
    marca: string;
    precio: number;
    cantidad: number;
    imagen: string;
}

interface CarritoProps {
    items: ProductoCarrito[];
    onUpdateQuantity: (productId: string, newQuantity: number) => void;
    onRemoveItem: (productId: string) => void;
    onCheckout: () => void;
    onNavigate?: (section: string) => void;
}

export function Carrito({ items, onUpdateQuantity, onRemoveItem, onCheckout, onNavigate }: CarritoProps) {
    const config = configuracionService.get();
    const [activeTab, setActiveTab] = useState<'carrito' | 'mis_pedidos'>('carrito');
    const [misOrdenes, setMisOrdenes] = useState<any[]>([]);

    const cargarOrdenesLocales = () => {
        try {
            const guardadas = JSON.parse(localStorage.getItem('estetica_ordenes_productos') || '[]');
            setMisOrdenes(Array.isArray(guardadas) ? guardadas : []);
        } catch {
            setMisOrdenes([]);
        }
    };

    useEffect(() => {
        cargarOrdenesLocales();
    }, []);

    const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const montoMinimoEnvio = config.montoEnvioGratis || 15000;
    const costoEnvio = config.costoEnvioEstandar || 1200;
    const envio = subtotal >= montoMinimoEnvio ? 0 : costoEnvio;
    const total = subtotal + envio;

    return (
        <div className="min-h-screen bg-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header con switcher de pestañas */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE8E1] text-[#7A3B3B] mb-2">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Tienda & Carrito Oficial</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">
                            {activeTab === 'carrito' ? 'Carrito de Compras' : 'Mis Pedidos Realizados'}
                        </h1>
                        <p className="text-sm text-[#8A7F74] mt-1">
                            {activeTab === 'carrito'
                                ? `Tenés ${items.length} ${items.length === 1 ? 'producto seleccionado' : 'productos seleccionados'} listos para confirmar.`
                                : 'Historial de compras y estado de pago de tus pedidos en Mercado Pago.'}
                        </p>
                    </div>

                    {/* Switcher de Pestañas */}
                    <div className="flex items-center bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#EDE8E1]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('carrito')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'carrito'
                                    ? 'bg-[#7A3B3B] text-white shadow-xs'
                                    : 'text-[#5A524A] hover:text-[#2A2825]'
                            }`}
                        >
                            <span>Bolsa</span>
                            {items.length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    activeTab === 'carrito' ? 'bg-white text-[#7A3B3B]' : 'bg-[#7A3B3B]/15 text-[#7A3B3B]'
                                }`}>
                                    {items.length}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                cargarOrdenesLocales();
                                setActiveTab('mis_pedidos');
                            }}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'mis_pedidos'
                                    ? 'bg-[#7A3B3B] text-white shadow-xs'
                                    : 'text-[#5A524A] hover:text-[#2A2825]'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Mis Pedidos</span>
                            {misOrdenes.length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    activeTab === 'mis_pedidos' ? 'bg-white text-[#7A3B3B]' : 'bg-[#7A3B3B]/15 text-[#7A3B3B]'
                                }`}>
                                    {misOrdenes.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* VISTA 1: PESTAÑA CARRITO / BOLSA */}
                {activeTab === 'carrito' && (
                    <>
                        {items.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-[#EDE8E1] p-12 text-center shadow-xs max-w-xl mx-auto space-y-4">
                                <div className="w-20 h-20 bg-[#FAF8F5] rounded-3xl border border-[#EDE8E1] flex items-center justify-center mx-auto text-[#7A3B3B] shadow-2xs">
                                    <ShoppingBag className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-[#2A2825]">Tu carrito está vacío</h2>
                                <p className="text-sm text-[#8A7F74] max-w-md mx-auto leading-relaxed">
                                    Explorá nuestro catálogo de dermoestética y sumá los mejores productos para el cuidado de tu piel.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    {onNavigate && (
                                        <button
                                            onClick={() => onNavigate('productos')}
                                            className="bg-[#3C3530] text-white py-3 px-6 rounded-xl hover:bg-[#7A3B3B] font-semibold text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
                                        >
                                            <span>Explorar Catálogo</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}

                                    {misOrdenes.length > 0 && (
                                        <button
                                            onClick={() => setActiveTab('mis_pedidos')}
                                            className="bg-[#FAF8F5] text-[#3C3530] border border-[#EDE8E1] py-3 px-6 rounded-xl hover:bg-[#EDE8E1] font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FileText className="w-4 h-4 text-[#7A3B3B]" />
                                            <span>Ver Mis Pedidos ({misOrdenes.length})</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Lista de Items */}
                                <div className="lg:col-span-2 space-y-4">
                                    {items.map((item) => {
                                        const isImage = item.imagen && (
                                            item.imagen.startsWith('http://') ||
                                            item.imagen.startsWith('https://') ||
                                            item.imagen.startsWith('/') ||
                                            item.imagen.startsWith('data:')
                                        );

                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-white rounded-3xl border border-[#EDE8E1] p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex gap-4 sm:gap-6 items-center">
                                                    {/* Contenedor de Imagen adaptativo */}
                                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs">
                                                        {isImage ? (
                                                            <img
                                                                src={item.imagen}
                                                                alt={item.nombre}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : item.imagen && item.imagen.length <= 4 ? (
                                                            <span className="text-3xl">{item.imagen}</span>
                                                        ) : (
                                                            <Package className="w-8 h-8 text-[#7A3B3B]" />
                                                        )}
                                                    </div>

                                                    {/* Información del Producto */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="min-w-0">
                                                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A3B3B] block mb-0.5">
                                                                    {item.marca}
                                                                </span>
                                                                <h3 className="font-bold text-sm sm:text-base text-[#2A2825] truncate">
                                                                    {item.nombre}
                                                                </h3>
                                                            </div>
                                                            <button
                                                                onClick={() => onRemoveItem(item.id)}
                                                                className="p-2 text-[#8A7F74] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                                                                title="Eliminar del carrito"
                                                                aria-label="Eliminar producto"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Controles de Cantidad y Precio */}
                                                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F5F2EB]">
                                                            {/* Selector de cantidad */}
                                                            <div className="flex items-center border border-[#DDD5C8] rounded-xl overflow-hidden bg-[#FAF8F5]">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                                                                    disabled={item.cantidad <= 1}
                                                                    className="p-2 text-[#5A524A] hover:bg-[#EDE8E1] hover:text-[#2A2825] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                    aria-label="Disminuir cantidad"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5" />
                                                                </button>
                                                                <span className="w-9 text-center font-bold text-xs sm:text-sm text-[#3C3530]">
                                                                    {item.cantidad}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                                                                    className="p-2 text-[#5A524A] hover:bg-[#EDE8E1] hover:text-[#2A2825] transition-colors"
                                                                    aria-label="Aumentar cantidad"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>

                                                            {/* Precios */}
                                                            <div className="text-right">
                                                                <span className="text-[11px] text-[#8A7F74] block">
                                                                    ${item.precio.toLocaleString('es-AR')} c/u
                                                                </span>
                                                                <span className="text-base sm:text-lg font-bold text-[#3C3530]">
                                                                    ${(item.precio * item.cantidad).toLocaleString('es-AR')} ARS
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Resumen del Pedido */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-3xl border border-[#EDE8E1] p-6 shadow-xs sticky top-24 space-y-6">
                                        <h2 className="font-bold text-lg text-[#2A2825] pb-3 border-b border-[#EDE8E1]">
                                            Resumen del Pedido
                                        </h2>

                                        <div className="space-y-3.5 text-sm">
                                            <div className="flex justify-between text-[#5A524A]">
                                                <span>Subtotal productos</span>
                                                <span className="font-semibold text-[#3C3530]">
                                                    ${subtotal.toLocaleString('es-AR')} ARS
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-[#5A524A]">
                                                <span>Costo de Envío</span>
                                                <span className="font-semibold">
                                                    {envio === 0 ? (
                                                        <span className="text-emerald-700 font-bold">¡Gratis!</span>
                                                    ) : (
                                                        `$${envio.toLocaleString('es-AR')} ARS`
                                                    )}
                                                </span>
                                            </div>

                                            {/* Barra o alerta de envío gratis */}
                                            {envio > 0 ? (
                                                <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-3.5">
                                                    <p className="text-xs text-[#5A524A] leading-relaxed">
                                                        Sumá <span className="font-bold text-[#7A3B3B]">${(montoMinimoEnvio - subtotal).toLocaleString('es-AR')}</span> más para obtener <span className="font-semibold text-emerald-700">envío gratis</span>.
                                                    </p>
                                                    <div className="w-full bg-[#EDE8E1] h-1.5 rounded-full mt-2.5 overflow-hidden">
                                                        <div
                                                            className="bg-[#7A3B3B] h-full rounded-full transition-all duration-300"
                                                            style={{ width: `${Math.min(100, (subtotal / montoMinimoEnvio) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                                                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                    <span>¡Envío 100% bonificado!</span>
                                                </div>
                                            )}

                                            <div className="border-t border-[#EDE8E1] pt-4">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="font-bold text-base text-[#2A2825]">Total a Pagar</span>
                                                    <div className="text-right">
                                                        <span className="font-extrabold text-2xl text-[#3C3530] block">
                                                            ${total.toLocaleString('es-AR')}
                                                        </span>
                                                        <span className="text-[10px] text-[#8A7F74]">ARS • IVA incluido</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botón de Checkout */}
                                        <button
                                            onClick={onCheckout}
                                            className="w-full bg-[#3C3530] text-white py-3.5 px-4 rounded-xl hover:bg-[#7A3B3B] active:scale-[0.99] transition-all font-semibold text-sm shadow-xs flex items-center justify-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>Pagar con Mercado Pago</span>
                                        </button>

                                        {/* Garantías y Beneficios */}
                                        <div className="pt-2 border-t border-[#EDE8E1] space-y-2.5 text-xs text-[#8A7F74]">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-[#7A3B3B] flex-shrink-0" />
                                                <span>Pago seguro con pasarela Mercado Pago SSL</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4 text-[#7A3B3B] flex-shrink-0" />
                                                <span>Envío a todo el país o retiro en local</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-[#7A3B3B] flex-shrink-0" />
                                                <span>Productos originales certificados</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* VISTA 2: PESTAÑA MIS PEDIDOS REALIZADOS */}
                {activeTab === 'mis_pedidos' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs space-y-6">
                        <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#2A2825]">Historial de Mis Compras</h2>
                                <p className="text-xs text-[#8A7F74]">
                                    Controlá el estado de acreditación de tus pagos y pedidos de productos
                                </p>
                            </div>
                            <button
                                onClick={cargarOrdenesLocales}
                                className="p-2 rounded-xl border border-[#EDE8E1] text-[#7A3B3B] hover:bg-[#FAF8F5] text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Actualizar</span>
                            </button>
                        </div>

                        {misOrdenes.length === 0 ? (
                            <div className="py-14 text-center space-y-3">
                                <Package className="w-12 h-12 text-[#DDD5C8] mx-auto" />
                                <h3 className="font-bold text-base text-[#2A2825]">No tenés compras registradas</h3>
                                <p className="text-xs text-[#8A7F74] max-w-sm mx-auto">
                                    Cuando adquieras productos cosméticos o de cuidado facial, podrás hacer el seguimiento de tu pago aquí.
                                </p>
                                {onNavigate && (
                                    <button
                                        onClick={() => onNavigate('productos')}
                                        className="mt-3 px-6 py-2.5 bg-[#7A3B3B] text-white rounded-xl text-xs font-bold hover:bg-[#5C2B2B] transition-colors"
                                    >
                                        Ir al Catálogo de Productos
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {misOrdenes.map((orden: any) => {
                                    const estNorm = String(orden.estado || '').toLowerCase();
                                    const isPagada = orden.estado === 'Pagada' || orden.estado === 'Aprobado' || orden.estado === 1 || estNorm.includes('pag') || estNorm.includes('aprob') || estNorm.includes('entreg');
                                    const isCancelada = orden.estado === 'Cancelada' || orden.estado === 'Cancelado' || orden.estado === 5 || estNorm.includes('canc');
                                    const isPendiente = !isPagada && !isCancelada;

                                    const fechaFormat = orden.fecha
                                        ? new Date(orden.fecha).toLocaleDateString('es-AR', {
                                            weekday: 'short',
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })
                                        : 'Fecha reciente';

                                    return (
                                        <div
                                            key={orden.ordenId}
                                            className="p-5 sm:p-6 rounded-2xl border border-[#EDE8E1] bg-[#FAF8F5] hover:border-[#7A3B3B]/40 transition-all space-y-4 shadow-2xs"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE8E1] pb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EDE8E1] flex items-center justify-center text-[#7A3B3B] font-bold text-xs shadow-2xs">
                                                        <Package className="w-5 h-5 text-[#7A3B3B]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-sm text-[#2A2825]">
                                                            Orden #{orden.ordenId}
                                                        </h3>
                                                        <p className="text-xs text-[#8A7F74]">
                                                            Registrada el {fechaFormat} hs
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Badge de Estado del Pedido */}
                                                <div>
                                                    {isPendiente && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>🟡 Pendiente de Pago (Mercado Pago)</span>
                                                        </span>
                                                    )}
                                                    {isPagada && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            <span>🟢 Pago Acreditado (En Preparación)</span>
                                                        </span>
                                                    )}
                                                    {isCancelada && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                                            <span>🔴 Cancelada</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Detalles de los productos incluidos */}
                                            <div className="space-y-2">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7F74] block">
                                                    Artículos en el pedido:
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#3C3530]">
                                                    {orden.detalles?.map((det: any, idx: number) => (
                                                        <div key={idx} className="p-2.5 bg-white rounded-xl border border-[#EDE8E1] flex justify-between items-center">
                                                            <span className="font-medium truncate mr-2">
                                                                {det.nombreProducto} (x{det.cantidad})
                                                            </span>
                                                            <span className="font-bold text-[#7A3B3B] shrink-0">
                                                                ${Number(det.subtotal || det.precioUnitario * det.cantidad || 0).toLocaleString('es-AR')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Total y Medio de Pago */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EDE8E1] text-xs">
                                                <div className="text-[#5A524A]">
                                                    Medio: <strong>Mercado Pago Checkout</strong> {orden.codigoOperacion ? `• Ref: ${orden.codigoOperacion}` : ''}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[#8A7F74] mr-2">Total abonado / a pagar:</span>
                                                    <span className="text-base font-extrabold text-[#2A2825]">
                                                        ${Number(orden.total || 0).toLocaleString('es-AR')} ARS
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Acciones y aviso si está pendiente de pago */}
                                            {isPendiente && (
                                                <div className="space-y-2.5 pt-2">
                                                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
                                                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="font-bold">Pago en espera de confirmación</p>
                                                            <p className="mt-0.5 text-amber-800 leading-relaxed">
                                                                Si saliste de la aplicación de Mercado Pago o no completaste la operación, podés reanudar el pago con el botón a continuación. En cuanto Mercado Pago confirme la acreditación a nuestro Webhook, tu pedido pasará automáticamente a estado <strong>Pagado</strong>.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                                        {orden.initPointUrl && (
                                                            <a
                                                                href={orden.initPointUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-2 rounded-xl bg-[#009EE3] hover:bg-[#0089C7] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                <span>Completar Pago en Mercado Pago</span>
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={cargarOrdenesLocales}
                                                            className="px-3.5 py-2 rounded-xl bg-white border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                            <span>Verificar si ya pagué</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {isPagada && (
                                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>
                                                        ¡Tu pago ha sido acreditado exitosamente por Mercado Pago! La administración está preparando tus productos.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Carrito;
