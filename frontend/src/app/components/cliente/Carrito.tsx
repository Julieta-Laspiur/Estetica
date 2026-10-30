import { Trash2, Plus, Minus, ShoppingBag, ShieldCheck, Truck, Sparkles, ArrowRight, Package, CheckCircle } from 'lucide-react';

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
    const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const envio = subtotal > 5000 ? 0 : 500;
    const total = subtotal + envio;

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
                <div className="max-w-md w-full bg-white rounded-3xl border border-[#EDE8E1] p-8 sm:p-10 text-center shadow-xs">
                    <div className="w-20 h-20 bg-[#FAF8F5] rounded-3xl border border-[#EDE8E1] flex items-center justify-center mx-auto mb-6 text-[#7A3B3B] shadow-2xs">
                        <ShoppingBag className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#2A2825] mb-2">Tu carrito está vacío</h2>
                    <p className="text-sm text-[#8A7F74] mb-8 leading-relaxed">
                        Explorá nuestro catálogo de dermoestética y sumá los mejores productos para el cuidado de tu piel.
                    </p>
                    {onNavigate && (
                        <button
                            onClick={() => onNavigate('productos')}
                            className="w-full bg-[#3C3530] text-white py-3 px-6 rounded-xl hover:bg-[#7A3B3B] font-semibold text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
                        >
                            <span>Explorar Catálogo</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE8E1] text-[#7A3B3B] mb-2">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Bolsa de Compras</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">Carrito de Compras</h1>
                        <p className="text-sm text-[#8A7F74] mt-1">
                            Tenés {items.length} {items.length === 1 ? 'producto seleccionado' : 'productos seleccionados'} listos para confirmar.
                        </p>
                    </div>

                    {onNavigate && (
                        <button
                            onClick={() => onNavigate('productos')}
                            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#FAF8F5] text-[#3C3530] hover:bg-[#EDE8E1] border border-[#EDE8E1] text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            <span>Seguir Comprando</span>
                        </button>
                    )}
                </div>

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
                                            Sumá <span className="font-bold text-[#7A3B3B]">${(5000 - subtotal).toLocaleString('es-AR')}</span> más para obtener <span className="font-semibold text-emerald-700">envío gratis</span>.
                                        </p>
                                        <div className="w-full bg-[#EDE8E1] h-1.5 rounded-full mt-2.5 overflow-hidden">
                                            <div
                                                className="bg-[#7A3B3B] h-full rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(100, (subtotal / 5000) * 100)}%` }}
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
                                <span>Finalizar Compra</span>
                            </button>

                            {/* Garantías y Beneficios */}
                            <div className="pt-2 border-t border-[#EDE8E1] space-y-2.5 text-xs text-[#8A7F74]">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#7A3B3B] flex-shrink-0" />
                                    <span>Pago seguro y protegido</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-[#7A3B3B] flex-shrink-0" />
                                    <span>Envío a todo el país o retiro en cabina</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#7A3B3B] flex-shrink-0" />
                                    <span>Productos originales certificados</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
