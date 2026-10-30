import { useState } from 'react';
import { Heart, ShoppingCart, Trash2, ArrowRight, Check, Package, ShoppingBag, Eye } from 'lucide-react';
import { DetalleProductoModal, type ProductoModalData } from './DetalleProductoModal';

export interface WishlistItem {
    id: string;
    nombre: string;
    marca: string;
    precio: number;
    imagenUrl?: string;
    descripcion?: string;
}

interface ListaDeseosProps {
    items: WishlistItem[];
    onRemoveItem: (productId: string) => void;
    onAddToCart: (productId: string, itemData?: { nombre: string; marca: string; precio: number; imagen?: string }, quantity?: number) => void;
    onClearWishlist?: () => void;
    onAddAllToCart?: () => void;
    onNavigate: (section: string) => void;
}

export function ListaDeseos({
    items,
    onRemoveItem,
    onAddToCart,
    onClearWishlist,
    onAddAllToCart,
    onNavigate
}: ListaDeseosProps) {
    const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
    const [productoDetalle, setProductoDetalle] = useState<ProductoModalData | null>(null);

    const handleAdd = (item: WishlistItem) => {
        onAddToCart(item.id, {
            nombre: item.nombre,
            marca: item.marca,
            precio: item.precio,
            imagen: item.imagenUrl || '🧴'
        });

        setAddedIds(prev => ({ ...prev, [item.id]: true }));
        setTimeout(() => {
            setAddedIds(prev => ({ ...prev, [item.id]: false }));
        }, 2000);
    };

    if (items.length === 0) {
        return (
            <div className="min-h-[75vh] bg-[#F7F4F0] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#EDE8E1] text-center shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-[#FAF8F5] border border-[#EDE8E1] flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Heart className="w-10 h-10 text-[#7A3B3B] stroke-1" />
                    </div>
                    <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#7A3B3B] bg-[#7A3B3B]/10 px-3 py-1 rounded-full mb-3">
                        Tu espacio de favoritos
                    </span>
                    <h2 className="text-2xl font-bold text-[#2A2825] mb-3">Tu lista de deseos está vacía</h2>
                    <p className="text-sm text-[#8A7F74] mb-8 leading-relaxed">
                        Explorá nuestro catálogo de cosmecéutica profesional y guardá los productos que más te gusten haciendo clic en el corazón.
                    </p>
                    <button
                        onClick={() => onNavigate('productos')}
                        className="w-full bg-[#3C3530] text-white py-3 rounded-xl hover:bg-[#2A2825] font-semibold transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-xs group"
                    >
                        <span>Explorar Productos</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE8E1] text-[#7A3B3B]">
                                <Heart className="w-3.5 h-3.5 fill-[#7A3B3B]" /> Lista de Deseos
                            </span>
                            <span className="text-xs font-medium text-[#8A7F74]">
                                {items.length} {items.length === 1 ? 'producto guardado' : 'productos guardados'}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">
                            Tus Productos Favoritos
                        </h1>
                        <p className="text-sm text-[#8A7F74] mt-1">
                            Conservá tus productos predilectos y sumalos a tu carrito en cualquier momento.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {onAddAllToCart && (
                            <button
                                onClick={onAddAllToCart}
                                className="px-4 py-2.5 rounded-xl bg-[#7A3B3B] text-white hover:bg-[#602D2D] text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>Agregar Todo al Carrito</span>
                            </button>
                        )}
                        <button
                            onClick={() => onNavigate('productos')}
                            className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] text-[#3C3530] hover:bg-[#EDE8E1] border border-[#EDE8E1] text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            <span>Seguir Comprando</span>
                        </button>
                        {onClearWishlist && items.length > 0 && (
                            <button
                                onClick={onClearWishlist}
                                className="px-3 py-2.5 rounded-xl text-xs text-[#8A7F74] hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Vaciar lista de deseos"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid de productos en la wishlist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((producto) => {
                        const isAdded = addedIds[producto.id];

                        const modalData: ProductoModalData = {
                            id: producto.id,
                            nombre: producto.nombre,
                            marca: producto.marca,
                            precio: producto.precio,
                            categoria: 'Cuidado Facial',
                            tipoPiel: ['Todo tipo de piel'],
                            descripcion: producto.descripcion,
                            paraQueSirve: producto.descripcion,
                            imagenUrl: producto.imagenUrl,
                            rating: 4.8,
                            stock: 20,
                        };

                        return (
                            <div
                                key={producto.id}
                                onClick={() => setProductoDetalle(modalData)}
                                className="bg-white rounded-2xl overflow-hidden border border-[#EDE8E1] hover:shadow-xl hover:border-[#DDD5C8] transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                            >
                                {/* Imagen con botón de eliminar de wishlist */}
                                <div className="h-52 bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center border-b border-[#EDE8E1]">
                                    {producto.imagenUrl ? (
                                        <img
                                            src={producto.imagenUrl}
                                            alt={producto.nombre}
                                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#DDD5C8] flex items-center justify-center text-[#7A3B3B]">
                                            <Package className="w-7 h-7" />
                                        </div>
                                    )}

                                    {/* Hover overlay indicativo de Ver Detalle */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                                        <span className="bg-white/95 text-[#2A2825] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                                            <Eye className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                            Ver detalles
                                        </span>
                                    </div>

                                    {/* Botón flotante para quitar de favoritos */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveItem(producto.id);
                                        }}
                                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-xs text-[#7A3B3B] hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors shadow-xs border border-white/60 z-10"
                                        title="Quitar de favoritos"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {/* Badge de marca */}
                                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-[#3C3530] backdrop-blur-xs shadow-xs">
                                        {producto.marca}
                                    </div>
                                </div>

                                {/* Contenido */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <h3 className="font-bold text-base text-[#2A2825] group-hover:text-[#7A3B3B] transition-colors leading-snug">
                                            {producto.nombre}
                                        </h3>
                                        {producto.descripcion && (
                                            <p className="text-xs text-[#8A7F74] mt-1.5 leading-relaxed line-clamp-2">
                                                {producto.descripcion}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-4 pt-3 border-t border-[#F5F2EB]">
                                            <div>
                                                <span className="text-[10px] uppercase font-semibold text-[#8A7F74] tracking-wider block">Precio</span>
                                                <span className="text-lg font-bold text-[#3C3530]">
                                                    ${producto.precio.toLocaleString()} ARS
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProductoDetalle(modalData);
                                                }}
                                                className="col-span-2 bg-[#FAF8F5] hover:bg-[#EDE8E1] text-[#3C3530] border border-[#EDE8E1] py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold"
                                                title="Ver detalles completos"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                <span>Detalle</span>
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAdd(producto);
                                                }}
                                                className={`col-span-3 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs ${
                                                    isAdded
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-[#3C3530] text-white hover:bg-[#7A3B3B]'
                                                }`}
                                            >
                                                {isAdded ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>¡Listo!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingCart className="w-3.5 h-3.5" />
                                                        <span>Al Carrito</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal de Detalle de Producto */}
            <DetalleProductoModal
                producto={productoDetalle}
                isOpen={!!productoDetalle}
                onClose={() => setProductoDetalle(null)}
                onAddToCart={(id, item, qty) => {
                    onAddToCart(id, item, qty);
                    setAddedIds(prev => ({ ...prev, [id]: true }));
                    setTimeout(() => {
                        setAddedIds(prev => ({ ...prev, [id]: false }));
                    }, 2000);
                }}
                isWishlisted={true}
                onToggleWishlist={(id) => {
                    onRemoveItem(id);
                    setProductoDetalle(null);
                }}
            />
        </div>
    );
}
