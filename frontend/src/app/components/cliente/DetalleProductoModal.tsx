import { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, Star, Package, Sparkles, ShieldCheck, Check, Plus, Minus } from 'lucide-react';

export interface ProductoModalData {
    id: string;
    nombre: string;
    marca: string;
    precio: number;
    categoria?: string;
    tipoPiel?: string[];
    descripcion?: string;
    paraQueSirve?: string;
    imagenUrl?: string;
    rating?: number;
    stock?: number;
}

interface DetalleProductoModalProps {
    producto: ProductoModalData | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart?: (productId: string, itemData: { nombre: string; marca: string; precio: number; imagen?: string }, quantity: number) => void;
    isWishlisted?: boolean;
    onToggleWishlist?: (productId: string, itemData: { nombre: string; marca: string; precio: number; imagenUrl?: string; descripcion?: string }) => void;
}

export function DetalleProductoModal({
    producto,
    isOpen,
    onClose,
    onAddToCart,
    isWishlisted = false,
    onToggleWishlist,
}: DetalleProductoModalProps) {
    const [cantidad, setCantidad] = useState(1);
    const [agregadoExito, setAgregadoExito] = useState(false);

    // Reset cantidad al abrir un nuevo producto
    useEffect(() => {
        if (isOpen) {
            setCantidad(1);
            setAgregadoExito(false);
        }
    }, [isOpen, producto?.id]);

    // Manejar tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !producto) return null;

    const maxStock = producto.stock !== undefined ? producto.stock : 99;
    const sinStock = maxStock <= 0;

    const handleIncrement = () => {
        if (cantidad < maxStock) {
            setCantidad(prev => prev + 1);
        }
    };

    const handleDecrement = () => {
        if (cantidad > 1) {
            setCantidad(prev => prev - 1);
        }
    };

    const handleAgregarAlCarrito = () => {
        if (sinStock) return;
        if (onAddToCart) {
            onAddToCart(
                producto.id,
                {
                    nombre: producto.nombre,
                    marca: producto.marca,
                    precio: producto.precio,
                    imagen: producto.imagenUrl || '🧴',
                },
                cantidad
            );
            setAgregadoExito(true);
            setTimeout(() => {
                setAgregadoExito(false);
            }, 2500);
        }
    };

    const ratingVal = producto.rating || 4.8;
    const totalPrecio = producto.precio * cantidad;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl max-w-3xl w-full border border-[#EDE8E1] shadow-2xl overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botón cerrar flotante */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-xs border border-[#EDE8E1] text-[#3C3530] hover:bg-[#EDE8E1] hover:text-[#2A2825] flex items-center justify-center transition-colors shadow-sm"
                    title="Cerrar detalle"
                    aria-label="Cerrar modal"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Columna Izquierda: Imagen y Badges */}
                    <div className="relative bg-gradient-to-b from-[#FAF8F5] to-[#F3EFE9] min-h-[280px] md:min-h-[460px] flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[#EDE8E1]">
                        {/* Botón de lista de deseos en la imagen */}
                        {onToggleWishlist && (
                            <button
                                onClick={() =>
                                    onToggleWishlist(producto.id, {
                                        nombre: producto.nombre,
                                        marca: producto.marca,
                                        precio: producto.precio,
                                        imagenUrl: producto.imagenUrl,
                                        descripcion: producto.paraQueSirve || producto.descripcion,
                                    })
                                }
                                className={`absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border ${
                                    isWishlisted
                                        ? 'bg-[#7A3B3B] text-white border-[#7A3B3B] shadow-md'
                                        : 'bg-white/95 backdrop-blur-xs text-[#8A7F74] hover:text-[#7A3B3B] hover:bg-white border-white/80'
                                }`}
                                title={isWishlisted ? 'Quitar de lista de deseos' : 'Guardar en lista de deseos'}
                                aria-label="Lista de deseos"
                            >
                                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                            </button>
                        )}

                        {/* Imagen del producto */}
                        <div className="w-full h-56 md:h-72 flex items-center justify-center overflow-hidden">
                            {producto.imagenUrl ? (
                                <img
                                    src={producto.imagenUrl}
                                    alt={producto.nombre}
                                    className="max-h-full max-w-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-3xl bg-white shadow-sm border border-[#DDD5C8] flex items-center justify-center text-[#7A3B3B]">
                                    <Package className="w-12 h-12" />
                                </div>
                            )}
                        </div>

                        {/* Badges al pie de la imagen */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                            {producto.categoria && (
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-[#3C3530] border border-[#EDE8E1] shadow-2xs">
                                    {producto.categoria}
                                </span>
                            )}
                            {sinStock ? (
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    Sin stock disponible
                                </span>
                            ) : maxStock < 10 ? (
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                    ¡Últimas {maxStock} unidades!
                                </span>
                            ) : (
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Stock disponible ({maxStock})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Información detallada y acciones */}
                    <div className="p-6 sm:p-7 flex flex-col justify-between max-h-[85vh] md:max-h-[580px] overflow-y-auto">
                        <div className="space-y-4">
                            {/* Marca & Rating */}
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#7A3B3B] bg-[#7A3B3B]/10 px-3 py-1 rounded-full">
                                    {producto.marca}
                                </span>

                                <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#EDE8E1] px-2.5 py-1 rounded-full">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                        <Star
                                            key={idx}
                                            className={`w-3.5 h-3.5 ${
                                                idx < Math.floor(ratingVal)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-[#DDD5C8]'
                                            }`}
                                        />
                                    ))}
                                    <span className="text-xs font-semibold text-[#3C3530] ml-1">
                                        {ratingVal.toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Título */}
                            <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825] leading-snug">
                                {producto.nombre}
                            </h2>

                            {/* Precio */}
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold text-[#3C3530]">
                                    ${producto.precio.toLocaleString('es-AR')}
                                </span>
                                <span className="text-xs text-[#8A7F74]">ARS • IVA incluido</span>
                            </div>

                            {/* Sección destacada: ¿Para qué sirve? */}
                            {producto.paraQueSirve && (
                                <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-4 space-y-1.5 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[#7A3B3B]">
                                        <Sparkles className="w-4 h-4" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider">
                                            ¿Para qué sirve?
                                        </h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-[#3C3530] leading-relaxed">
                                        {producto.paraQueSirve}
                                    </p>
                                </div>
                            )}

                            {/* Descripción completa */}
                            {producto.descripcion && (
                                <div className="space-y-1">
                                    <h3 className="text-xs font-semibold text-[#8A7F74] uppercase tracking-wider">
                                        Descripción del producto
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#5A524A] leading-relaxed">
                                        {producto.descripcion}
                                    </p>
                                </div>
                            )}

                            {/* Biotipos / Tipos de piel aptos */}
                            {producto.tipoPiel && producto.tipoPiel.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <h3 className="text-xs font-semibold text-[#8A7F74] uppercase tracking-wider">
                                        Biotipos de piel recomendados
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {producto.tipoPiel.map((tipo, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs bg-[#F3EFE9] text-[#3C3530] font-medium px-2.5 py-1 rounded-lg border border-[#EDE8E1]"
                                            >
                                                {tipo}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bloque de Compra / Acciones */}
                        <div className="pt-6 mt-6 border-t border-[#EDE8E1] space-y-3">
                            <div className="flex items-center justify-between gap-4">
                                {/* Selector de Cantidad */}
                                <div className="flex items-center border border-[#DDD5C8] rounded-xl overflow-hidden bg-[#FAF8F5]">
                                    <button
                                        type="button"
                                        onClick={handleDecrement}
                                        disabled={cantidad <= 1 || sinStock}
                                        className="p-2.5 text-[#5A524A] hover:bg-[#EDE8E1] hover:text-[#2A2825] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Disminuir cantidad"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-10 text-center font-bold text-sm text-[#3C3530]">
                                        {cantidad}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleIncrement}
                                        disabled={cantidad >= maxStock || sinStock}
                                        className="p-2.5 text-[#5A524A] hover:bg-[#EDE8E1] hover:text-[#2A2825] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Aumentar cantidad"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Total calculado */}
                                <div className="text-right">
                                    <span className="text-[11px] text-[#8A7F74] block">Subtotal ({cantidad} {cantidad === 1 ? 'unidad' : 'unidades'})</span>
                                    <span className="text-lg font-bold text-[#3C3530]">
                                        ${totalPrecio.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>

                            {/* Botón Principal: Agregar al Carrito */}
                            <button
                                onClick={handleAgregarAlCarrito}
                                disabled={sinStock}
                                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
                                    agregadoExito
                                        ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                                        : sinStock
                                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                        : 'bg-[#3C3530] text-white hover:bg-[#7A3B3B] active:scale-[0.99]'
                                }`}
                            >
                                {agregadoExito ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>¡Agregado al Carrito con Éxito!</span>
                                    </>
                                ) : sinStock ? (
                                    <span>Producto Agotado</span>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-4 h-4" />
                                        <span>Agregar al Carrito • ${totalPrecio.toLocaleString('es-AR')}</span>
                                    </>
                                )}
                            </button>

                            {/* Botón secundario: Wishlist toggle */}
                            {onToggleWishlist && (
                                <button
                                    onClick={() =>
                                        onToggleWishlist(producto.id, {
                                            nombre: producto.nombre,
                                            marca: producto.marca,
                                            precio: producto.precio,
                                            imagenUrl: producto.imagenUrl,
                                            descripcion: producto.paraQueSirve || producto.descripcion,
                                        })
                                    }
                                    className="w-full py-2.5 px-4 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-xs font-semibold text-[#5A524A] hover:text-[#7A3B3B] flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#7A3B3B] text-[#7A3B3B]' : ''}`} />
                                    <span>{isWishlisted ? 'En tu lista de deseos' : 'Guardar en mi lista de deseos'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
