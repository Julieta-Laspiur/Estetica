import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Star, SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react';
import { productosApi } from '../../../services/api';

interface Producto {
    id: string;
    nombre: string;
    marca: string;
    precio: number;
    categoria: string;
    tipoPiel: string[];
    descripcion: string;
    paraQueSirve?: string;
    imagenUrl?: string;
    imagen: string;
    rating: number;
    stock: number;
}

interface ProductosClienteProps {
    onAddToCart: (productId: string) => void;
}

const PRODUCTOS: Producto[] = [
    { id: '1', nombre: 'Crema Hidratante Premium', marca: 'La Roche-Posay', precio: 2500, categoria: 'Cuidado Facial', tipoPiel: ['Seca', 'Normal'], descripcion: 'Crema hidratante para todo tipo de pieles con ácido hialurónico', imagen: '🧴', rating: 4.8, stock: 45 },
    { id: '2', nombre: 'Sérum Vitamina C', marca: 'Vichy', precio: 3200, categoria: 'Cuidado Facial', tipoPiel: ['Normal', 'Mixta'], descripcion: 'Sérum antioxidante con vitamina C pura para iluminar la piel', imagen: '💧', rating: 4.9, stock: 28 },
    { id: '3', nombre: 'Protector Solar FPS 50+', marca: 'Eucerin', precio: 1800, categoria: 'Protección Solar', tipoPiel: ['Seca', 'Sensible', 'Normal', 'Mixta', 'Grasa'], descripcion: 'Protección solar de amplio espectro con textura ligera', imagen: '☀️', rating: 4.7, stock: 62 },
    { id: '4', nombre: 'Aceite Esencial Lavanda', marca: 'doTERRA', precio: 1500, categoria: 'Aromaterapia', tipoPiel: ['Sensible', 'Normal'], descripcion: 'Aceite esencial 100% puro de lavanda para relajación', imagen: '🌿', rating: 4.6, stock: 8 },
    { id: '5', nombre: 'Exfoliante Corporal', marca: 'The Body Shop', precio: 2100, categoria: 'Cuidado Corporal', tipoPiel: ['Normal', 'Mixta', 'Grasa'], descripcion: 'Exfoliante corporal con sales marinas y aceites naturales', imagen: '🧂', rating: 4.5, stock: 33 },
    { id: '6', nombre: 'Máscara Facial Purificante', marca: 'Natura', precio: 1900, categoria: 'Cuidado Facial', tipoPiel: ['Grasa', 'Mixta'], descripcion: 'Máscara de arcilla para pieles grasas y mixtas', imagen: '🎭', rating: 4.4, stock: 5 },
];

const FILTER_SECTIONS = [
    {
        id: 'categoria',
        label: 'Categoría',
        options: ['Cuidado Facial', 'Cuidado Corporal', 'Protección Solar', 'Aromaterapia'],
    },
    {
        id: 'tipoPiel',
        label: 'Tipo de Piel',
        options: ['Seca', 'Grasa', 'Mixta', 'Sensible', 'Normal'],
    },
    {
        id: 'marca',
        label: 'Marca',
        options: ['La Roche-Posay', 'Vichy', 'Eucerin', 'doTERRA', 'The Body Shop', 'Natura'],
    },
    {
        id: 'precio',
        label: 'Precio',
        options: ['Hasta $1.500', '$1.500 – $2.500', 'Más de $2.500'],
    },
    {
        id: 'stock',
        label: 'Disponibilidad',
        options: ['En stock', 'Últimas unidades'],
    },
];

function getCountForOption(section: string, option: string): number {
    return PRODUCTOS.filter(p => {
        if (section === 'categoria') return p.categoria === option;
        if (section === 'tipoPiel') return p.tipoPiel.includes(option);
        if (section === 'marca') return p.marca === option;
        if (section === 'precio') {
            if (option === 'Hasta $1.500') return p.precio <= 1500;
            if (option === '$1.500 – $2.500') return p.precio > 1500 && p.precio <= 2500;
            if (option === 'Más de $2.500') return p.precio > 2500;
        }
        if (section === 'stock') {
            if (option === 'En stock') return p.stock >= 10;
            if (option === 'Últimas unidades') return p.stock < 10;
        }
        return false;
    }).length;
}

function matchesPrecio(precio: number, option: string): boolean {
    if (option === 'Hasta $1.500') return precio <= 1500;
    if (option === '$1.500 – $2.500') return precio > 1500 && precio <= 2500;
    if (option === 'Más de $2.500') return precio > 2500;
    return false;
}

export function ProductosCliente({ onAddToCart }: ProductosClienteProps) {
    const [productosList, setProductosList] = useState<Producto[]>(PRODUCTOS);
    const [searchTerm, setSearchTerm] = useState('');
    const [openSections, setOpenSections] = useState<string[]>(['categoria', 'tipoPiel']);
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        productosApi.getProductos()
            .then(apiProds => {
                if (apiProds && apiProds.length > 0) {
                    const mapped: Producto[] = apiProds.map(p => ({
                        id: p.productoId.toString(),
                        nombre: p.nombre,
                        marca: p.marca,
                        precio: p.precio,
                        categoria: 'Cuidado Facial',
                        tipoPiel: (p.tiposPiel && p.tiposPiel.length > 0) ? p.tiposPiel : (p.tiposPielAptos && p.tiposPielAptos.length > 0) ? p.tiposPielAptos : ['Normal', 'Seca'],
                        descripcion: p.descripcion || '',
                        paraQueSirve: p.paraQueSirve,
                        imagenUrl: p.imagenUrl,
                        imagen: '🧴',
                        rating: 4.8,
                        stock: p.stockActual,
                    }));
                    setProductosList(mapped);
                }
            })
            .catch(() => {
                // Mantiene los datos iniciales si no hay conexión
            });
    }, []);

    const toggleSection = (id: string) => {
        setOpenSections(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleFilter = (section: string, option: string) => {
        setActiveFilters(prev => {
            const current = prev[section] ?? [];
            const updated = current.includes(option)
                ? current.filter(o => o !== option)
                : [...current, option];
            return { ...prev, [section]: updated };
        });
    };

    const clearAll = () => setActiveFilters({});

    const totalActiveFilters = Object.values(activeFilters).flat().length;

    const filteredProductos = productosList.filter(p => {
        const matchesSearch =
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.marca.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategoria =
            !activeFilters.categoria?.length || activeFilters.categoria.includes(p.categoria);

        const matchesTipoPiel =
            !activeFilters.tipoPiel?.length ||
            activeFilters.tipoPiel.some(t => p.tipoPiel.includes(t));

        const matchesMarca =
            !activeFilters.marca?.length || activeFilters.marca.includes(p.marca);

        const matchesPrecioFilter =
            !activeFilters.precio?.length ||
            activeFilters.precio.some(o => matchesPrecio(p.precio, o));

        const matchesStock =
            !activeFilters.stock?.length ||
            activeFilters.stock.some(o => {
                if (o === 'En stock') return p.stock >= 10;
                if (o === 'Últimas unidades') return p.stock < 10;
                return false;
            });

        return matchesSearch && matchesCategoria && matchesTipoPiel && matchesMarca && matchesPrecioFilter && matchesStock;
    });

    const FilterPanel = () => (
        <aside className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#3C3530]" />
                    <span className="font-semibold text-sm tracking-widest uppercase text-[#3C3530]">Filtros</span>
                    {totalActiveFilters > 0 && (
                        <span className="bg-[#3C3530] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {totalActiveFilters}
                        </span>
                    )}
                </div>
                {totalActiveFilters > 0 && (
                    <button
                        onClick={clearAll}
                        className="text-xs text-[#8A7F74] hover:text-[#3C3530] underline underline-offset-2 transition-colors"
                    >
                        Limpiar todo
                    </button>
                )}
            </div>

            {/* Active filter chips */}
            {totalActiveFilters > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {Object.entries(activeFilters).flatMap(([section, options]) =>
                        options.map(option => (
                            <button
                                key={`${section}-${option}`}
                                onClick={() => toggleFilter(section, option)}
                                className="flex items-center gap-1 bg-[#EDE8E1] text-[#3C3530] text-xs px-2 py-1 rounded-full hover:bg-[#DDD5C8] transition-colors"
                            >
                                {option}
                                <X className="w-3 h-3" />
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Accordion sections */}
            <div className="space-y-0">
                {FILTER_SECTIONS.map((section, idx) => {
                    const isOpen = openSections.includes(section.id);
                    return (
                        <div key={section.id} className={`border-t border-[#DDD5C8] ${idx === FILTER_SECTIONS.length - 1 ? 'border-b' : ''}`}>
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between py-3.5 text-left hover:text-[#3C3530] transition-colors"
                            >
                                <span className="font-semibold text-sm text-[#2A2825]">{section.label}</span>
                                {isOpen
                                    ? <ChevronUp className="w-4 h-4 text-[#8A7F74]" />
                                    : <ChevronDown className="w-4 h-4 text-[#8A7F74]" />
                                }
                            </button>

                            {isOpen && (
                                <div className="pb-4 space-y-2">
                                    {section.options.map(option => {
                                        const count = getCountForOption(section.id, option);
                                        const checked = activeFilters[section.id]?.includes(option) ?? false;
                                        return (
                                            <label
                                                key={option}
                                                className="flex items-center gap-2.5 cursor-pointer group"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleFilter(section.id, option)}
                                                    className="w-4 h-4 rounded border-[#DDD5C8] accent-[#3C3530] cursor-pointer"
                                                />
                                                <span className={`text-sm flex-1 transition-colors ${checked ? 'text-[#3C3530] font-medium' : 'text-[#8A7F74] group-hover:text-[#3C3530]'}`}>
                                                    {option}
                                                </span>
                                                <span className="text-xs text-[#8A7F74]">({count})</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );

    return (
        <div className="bg-[#F7F4F0] min-h-screen">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                {/* Header + Search */}
                <div className="mb-6">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#8A7F74] mb-1">Tienda</p>
                    <h1 className="text-2xl font-bold text-[#2A2825] mb-4">Productos</h1>

                    <div className="flex gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
                            <input
                                type="text"
                                placeholder="Buscar productos o marcas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-[#DDD5C8] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3C3530]/20 focus:border-[#3C3530] text-[#2A2825] placeholder:text-[#8A7F74]"
                            />
                        </div>

                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-[#DDD5C8] rounded-lg text-sm text-[#3C3530] hover:bg-[#EDE8E1] transition-colors"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filtros
                            {totalActiveFilters > 0 && (
                                <span className="bg-[#3C3530] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {totalActiveFilters}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Results count */}
                    <p className="text-xs text-[#8A7F74] mt-3">
                        {filteredProductos.length} producto{filteredProductos.length !== 1 ? 's' : ''} encontrado{filteredProductos.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex gap-8">

                    {/* Sidebar - desktop */}
                    <div className="hidden lg:block w-56 flex-shrink-0">
                        <FilterPanel />
                    </div>

                    {/* Mobile sidebar overlay */}
                    {sidebarOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 flex">
                            <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                            <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto p-5 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-semibold text-[#2A2825]">Filtros</span>
                                    <button onClick={() => setSidebarOpen(false)}>
                                        <X className="w-5 h-5 text-[#8A7F74]" />
                                    </button>
                                </div>
                                <FilterPanel />
                            </div>
                        </div>
                    )}

                    {/* Products grid */}
                    <div className="flex-1 min-w-0">
                        {filteredProductos.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-[#8A7F74] text-base">No se encontraron productos con los filtros seleccionados.</p>
                                <button onClick={clearAll} className="mt-3 text-sm text-[#3C3530] underline underline-offset-2">
                                    Limpiar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredProductos.map((producto) => (
                                    <div
                                        key={producto.id}
                                        className="bg-white rounded-xl overflow-hidden border border-[#EDE8E1] hover:shadow-md transition-shadow"
                                    >
                                        <div className="bg-[#FAF8F5] h-48 flex items-center justify-center overflow-hidden border-b border-[#EDE8E1] relative">
                                            {producto.imagenUrl ? (
                                                <img
                                                    src={producto.imagenUrl}
                                                    alt={producto.nombre}
                                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-6xl">{producto.imagen}</span>
                                            )}
                                        </div>

                                        <div className="p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium bg-[#EDE8E1] text-[#3C3530] px-2 py-0.5 rounded-full">
                                                    {producto.categoria}
                                                </span>
                                                {producto.tipoPiel.length > 0 && (
                                                    <span className="text-[10px] text-[#8A7F74]">
                                                        Piel: {producto.tipoPiel.slice(0, 2).join(', ')}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-[#8A7F74] mt-1 mb-0.5">{producto.marca}</p>
                                            <h3 className="font-semibold text-[#2A2825] mb-1.5 line-clamp-1 text-sm">{producto.nombre}</h3>
                                            
                                            {producto.paraQueSirve ? (
                                                <div className="mb-3 p-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#5A524A]">
                                                    <span className="font-bold text-[#7A3B3B] block text-[10px] uppercase tracking-wider mb-0.5">
                                                        ¿Para qué sirve?
                                                    </span>
                                                    <p className="line-clamp-2 text-xs leading-relaxed text-[#3C3530]">
                                                        {producto.paraQueSirve}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[#8A7F74] mb-3 line-clamp-2 leading-relaxed">
                                                    {producto.descripcion}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-1 mb-3">
                                                {Array.from({ length: 5 }).map((_, idx) => (
                                                    <Star
                                                        key={idx}
                                                        className={`w-3.5 h-3.5 ${idx < Math.floor(producto.rating) ? 'fill-amber-400 text-amber-400' : 'text-[#DDD5C8]'}`}
                                                    />
                                                ))}
                                                <span className="text-xs text-[#8A7F74] ml-1">({producto.rating})</span>
                                            </div>

                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-lg font-bold text-[#3C3530]">${producto.precio.toLocaleString()}</div>
                                                {producto.stock < 10 && (
                                                    <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                                                        ¡Últimas {producto.stock}!
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => onAddToCart(producto.id)}
                                                className="w-full bg-[#3C3530] text-white py-2.5 rounded-lg hover:bg-[#2A2825] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                Agregar al Carrito
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bottom banner */}
                        <div className="mt-10 bg-[#3C3530] rounded-xl p-7 text-white">
                            <h2 className="text-lg font-bold mb-1">¿Necesitás ayuda para elegir?</h2>
                            <p className="text-white/70 text-sm mb-5">
                                Nuestro asistente con IA te recomienda los productos ideales para tu tipo de piel.
                            </p>
                            <button className="bg-white text-[#3C3530] px-5 py-2 rounded-lg font-semibold hover:bg-[#F7F4F0] transition-colors text-sm">
                                Consultar Ahora
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
