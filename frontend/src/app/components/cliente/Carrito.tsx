import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

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
}

export function Carrito({ items, onUpdateQuantity, onRemoveItem, onCheckout }: CarritoProps) {
    const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const envio = subtotal > 5000 ? 0 : 500;
    const total = subtotal + envio;

    if (items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center">
                <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
                <p className="text-muted-foreground mb-8">
                    Agrega productos desde nuestra tienda para comenzar tu compra
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Carrito de Compras</h1>
                <p className="text-muted-foreground">{items.length} producto{items.length !== 1 ? 's' : ''} en tu carrito</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-md border border-border p-6">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                                    {item.imagen}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">{item.marca}</p>
                                            <h3 className="font-semibold text-lg">{item.nombre}</h3>
                                        </div>
                                        <button
                                            onClick={() => onRemoveItem(item.id)}
                                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5 text-destructive" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                                                disabled={item.cantidad <= 1}
                                                className="w-8 h-8 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-12 text-center font-medium">{item.cantidad}</span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                                                className="w-8 h-8 rounded-lg border border-border hover:bg-secondary transition-colors flex items-center justify-center"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">${item.precio} c/u</p>
                                            <p className="text-xl font-bold text-purple-600">${item.precio * item.cantidad}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md border border-border p-6 sticky top-24">
                        <h3 className="font-semibold text-lg mb-4">Resumen del Pedido</h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">${subtotal}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Envío</span>
                                <span className="font-medium">
                                    {envio === 0 ? (
                                        <span className="text-green-600">¡Gratis!</span>
                                    ) : (
                                        `$${envio}`
                                    )}
                                </span>
                            </div>

                            {envio > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-900">
                                        Agrega ${5000 - subtotal} más para obtener envío gratis
                                    </p>
                                </div>
                            )}

                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-lg">Total</span>
                                    <span className="font-bold text-2xl text-purple-600">${total}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onCheckout}
                            className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                        >
                            Finalizar Compra
                        </button>

                        <div className="mt-6 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600">✓</span>
                                </div>
                                <span>Envío asegurado</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600">✓</span>
                                </div>
                                <span>Devolución gratuita</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600">✓</span>
                                </div>
                                <span>Pago seguro</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
