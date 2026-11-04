import { Calendar, Gift, Sparkles, Clock, ChevronLeft, ChevronRight, Flower2, Zap, Package, Droplets, Sun, Scissors, ArrowRight, Heart, Eye, MapPin, Phone, MessageSquare, Mail, Shield } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { serviciosApi, productosApi } from '../../../services/api';
import { DetalleProductoModal, type ProductoModalData } from './DetalleProductoModal';
import {
    configuracionService,
    EVENTO_CONFIG_ACTUALIZADA,
    type ConfiguracionGeneral
} from '../../../services/configuracionService';

interface InicioClienteProps {
    onNavigate: (section: string) => void;
    onSelectService?: (serviceId: string) => void;
    wishlistIds?: string[];
    onToggleWishlist?: (productId: string, itemData?: { nombre: string; marca: string; precio: number; imagenUrl?: string; descripcion?: string }) => void;
    onAddToCart?: (productId: string, itemData?: { nombre: string; marca: string; precio: number; imagen?: string }, quantity?: number) => void;
}



function getServiceIcon(nombre: string) {
    const n = nombre.toLowerCase();
    if (n.includes('facial') || n.includes('limpieza') || n.includes('peeling') || n.includes('cutáneo') || n.includes('hidratante')) {
        return Sparkles;
    }
    if (n.includes('masaje') || n.includes('relax') || n.includes('descontracturante') || n.includes('drenaje')) {
        return Flower2;
    }
    if (n.includes('láser') || n.includes('laser') || n.includes('radiofrecuencia') || n.includes('depilación')) {
        return Zap;
    }
    return Scissors;
}

function getProductIcon(nombre: string, marca?: string) {
    const n = `${nombre} ${marca || ''}`.toLowerCase();
    if (n.includes('solar') || n.includes('fps') || n.includes('sun')) {
        return Sun;
    }
    if (n.includes('sérum') || n.includes('serum') || n.includes('vitamina') || n.includes('ácido') || n.includes('gotas') || n.includes('hialurónico')) {
        return Droplets;
    }
    if (n.includes('aceite') || n.includes('lavanda') || n.includes('esencial') || n.includes('aroma')) {
        return Flower2;
    }
    if (n.includes('crema') || n.includes('hidratante') || n.includes('bálsamo') || n.includes('gel')) {
        return Sparkles;
    }
    return Package;
}

const SERVICIOS_DEFAULT = [
    {
        id: '1',
        nombre: 'Limpieza Facial Profunda',
        descripcion: 'Higiene cutánea completa con punta de diamante y máscara descongestiva',
        precio: '$4,500',
        duracion: '60 min',
        imagenUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    },
    {
        id: '2',
        nombre: 'Masaje Relajante & Descontracturante',
        descripcion: 'Sesión corporal completa con aceites botánicos y aromaterapia',
        precio: '$5,200',
        duracion: '50 min',
        imagenUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    },
    {
        id: '3',
        nombre: 'Depilación Láser & Radiofrecuencia',
        descripcion: 'Tecnología avanzada para máxima suavidad y firmeza de la piel',
        precio: '$6,500',
        duracion: '45 min',
        imagenUrl: 'https://images.unsplash.com/photo-1512290900672-1f4153ae5891?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    },
];

const PRODUCTOS_DEFAULT = [
    {
        id: '1',
        nombre: 'Crema Hidratante Premium',
        marca: 'La Roche-Posay',
        precio: '$2,500',
        precioNumerico: 2500,
        descripcion: 'Crema hidratante reparadora con ácido hialurónico puro y niacinamida calmante.',
        paraQueSirve: 'Hidratación profunda, restauración de la barrera cutánea y prevención de tirantez.',
        tipoPiel: ['Seca', 'Normal', 'Sensible'],
        rating: 4.8,
        stock: 45,
        imagenUrl: 'https://images.unsplash.com/photo-1608248597359-242858b2e1bf?w=500&auto=format&fit=crop&q=80',
    },
    {
        id: '2',
        nombre: 'Sérum Vitamina C Pura',
        marca: 'Vichy',
        precio: '$3,200',
        precioNumerico: 3200,
        descripcion: 'Sérum antioxidante concentrado para iluminar el rostro y neutralizar radicales libres.',
        paraQueSirve: 'Aporta luminosidad, combate manchas superficiales, unifica el tono y protege del fotoenvejecimiento.',
        tipoPiel: ['Normal', 'Mixta', 'Grasa'],
        rating: 4.9,
        stock: 28,
        imagenUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
    },
    {
        id: '3',
        nombre: 'Protector Solar FPS 50+ Toque Seco',
        marca: 'Eucerin',
        precio: '$1,800',
        precioNumerico: 1800,
        descripcion: 'Protector solar facial de amplio espectro UVA/UVB con textura ultra ligera.',
        paraQueSirve: 'Protección solar diaria de amplio espectro para prevenir manchas solares, arrugas y daño celular.',
        tipoPiel: ['Seca', 'Sensible', 'Normal', 'Mixta', 'Grasa'],
        rating: 4.7,
        stock: 62,
        imagenUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
    },
];

export function InicioCliente({ onNavigate, onSelectService, wishlistIds = [], onToggleWishlist, onAddToCart }: InicioClienteProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [servicios, setServicios] = useState(SERVICIOS_DEFAULT);
    const [productos, setProductos] = useState(PRODUCTOS_DEFAULT);
    const [selectedProducto, setSelectedProducto] = useState<ProductoModalData | null>(null);
    const [config, setConfig] = useState<ConfiguracionGeneral>(() => configuracionService.get());

    useEffect(() => {
        const handler = (e: any) => {
            if (e.detail) {
                setConfig(e.detail);
            } else {
                setConfig(configuracionService.get());
            }
        };
        window.addEventListener(EVENTO_CONFIG_ACTUALIZADA, handler);
        return () => window.removeEventListener(EVENTO_CONFIG_ACTUALIZADA, handler);
    }, []);

    useEffect(() => {
        serviciosApi.getActivos()
            .then(data => {
                if (data && data.length > 0) {
                    const topServicios = data.slice(0, 3).map((s, idx) => ({
                        id: s.servicioId.toString(),
                        nombre: s.nombre,
                        descripcion: s.descripcion || 'Tratamiento estético profesional adaptado a tus necesidades.',
                        precio: `$${s.precio.toLocaleString()}`,
                        duracion: `${s.duracionMin} min`,
                        imagenUrl: s.imagenUrl || SERVICIOS_DEFAULT[idx % SERVICIOS_DEFAULT.length]?.imagenUrl,
                    }));
                    setServicios(topServicios);
                }
            })
            .catch(() => {});

        productosApi.getProductos()
            .then(data => {
                if (data && data.length > 0) {
                    const topProductos = data.slice(0, 3).map((p, idx) => ({
                        id: p.productoId.toString(),
                        nombre: p.nombre,
                        marca: p.marca,
                        precio: `$${p.precio.toLocaleString()}`,
                        precioNumerico: p.precio,
                        descripcion: p.descripcion || '',
                        paraQueSirve: p.paraQueSirve || '',
                        tipoPiel: (p.tiposPiel && p.tiposPiel.length > 0) ? p.tiposPiel : (p.tiposPielAptos && p.tiposPielAptos.length > 0) ? p.tiposPielAptos : ['Normal', 'Seca'],
                        rating: 4.8,
                        stock: p.stockActual,
                        imagenUrl: p.imagenUrl || PRODUCTOS_DEFAULT[idx % PRODUCTOS_DEFAULT.length]?.imagenUrl,
                    }));
                    setProductos(topProductos);
                }
            })
            .catch(() => {});
    }, []);

    const bannerHeroConfig = config.bannerHero || {
        imagenUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
        tag: 'Promoción Especial',
        titulo: '30% OFF en Faciales Hidratantes',
        subtitulo: 'Durante todo este mes. Reservá tu turno y aprovechá el cuidado exclusivo de tu piel.',
        cta: 'Reservar Ahora',
        ctaTarget: 'reservar',
    };

    const slides = [
        {
            id: 1,
            image: bannerHeroConfig.imagenUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
            tag: bannerHeroConfig.tag || 'Promoción Especial',
            title: bannerHeroConfig.titulo || config.nombreCentro,
            subtitle: bannerHeroConfig.subtitulo || config.slogan,
            cta: bannerHeroConfig.cta || 'Reservar Ahora',
            ctaTarget: bannerHeroConfig.ctaTarget || 'reservar',
        },
        {
            id: 2,
            image: 'https://images.unsplash.com/photo-1778451510207-24f1e204f465?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
            tag: 'Nuevos Productos',
            title: 'Línea Premium de Skincare',
            subtitle: 'Cremas, sérums y tratamientos de las mejores marcas internacionales.',
            cta: 'Ver Productos',
            ctaTarget: 'productos',
        },
        {
            id: 3,
            image: 'https://images.unsplash.com/photo-1779117691346-5de09d89a73f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
            tag: 'Programa de Lealtad',
            title: 'Acumulá Estampillas y Ganá',
            subtitle: `Por cada tratamiento sumás sellos. ¡Completá ${config.estampitasParaRecompensa || 6} estampitas y recibí un premio!`,
            cta: 'Mi Tarjeta',
            ctaTarget: 'lealtad',
        },
    ];

    const nextSlide = useCallback(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = () => {
        setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    };

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isPaused, nextSlide]);

    const slide = slides[currentSlide] || slides[0];

    return (
        <div className="min-h-screen bg-[#F7F4F0]">

            {/* Banner Carrusel */}
            <div
                className="relative w-full overflow-hidden"
                style={{ height: '480px' }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Slides */}
                {slides.map((s, idx) => (
                    <div
                        key={s.id}
                        className="absolute inset-0 transition-opacity duration-700"
                        style={{ opacity: idx === currentSlide ? 1 : 0, pointerEvents: idx === currentSlide ? 'auto' : 'none' }}
                    >
                        <img
                            src={s.image}
                            alt={s.title}
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                    </div>
                ))}

                {/* Text Content */}
                <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 w-full">
                        <div className="max-w-lg">
                            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-white/80 bg-white/10 border border-white/20 px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
                                {slide.tag}
                            </span>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                                {slide.title}
                            </h1>
                            <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
                                {slide.subtitle}
                            </p>
                            <button
                                onClick={() => onNavigate(slide.ctaTarget)}
                                className="bg-white text-[#3C3530] px-6 py-3 rounded-lg font-semibold hover:bg-[#F7F4F0] transition-colors inline-flex items-center gap-2 text-sm"
                            >
                                {slide.cta}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-white" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`rounded-full transition-all duration-300 ${idx === currentSlide
                                ? 'bg-white w-6 h-2'
                                : 'bg-white/50 w-2 h-2 hover:bg-white/80'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => onNavigate('reservar')}
                        className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow text-left flex items-start gap-4 border border-[#EDE8E1]"
                    >
                        <div className="w-11 h-11 bg-[#EDE8E1] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-[#3C3530]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#2A2825] mb-1">Reserva Online</h3>
                            <p className="text-[#8A7F74] text-sm">Agenda tu turno con disponibilidad en tiempo real</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onNavigate('lealtad')}
                        className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow text-left flex items-start gap-4 border border-[#EDE8E1]"
                    >
                        <div className="w-11 h-11 bg-[#EDE8E1] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Gift className="w-5 h-5 text-[#3C3530]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#2A2825] mb-1">Programa de Lealtad</h3>
                            <p className="text-[#8A7F74] text-sm">Acumulá estampillas y obtené descuentos exclusivos</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onNavigate('chat')}
                        className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow text-left flex items-start gap-4 border border-[#EDE8E1]"
                    >
                        <div className="w-11 h-11 bg-[#EDE8E1] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-[#3C3530]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#2A2825] mb-1">Consultorio IA</h3>
                            <p className="text-[#8A7F74] text-sm">Recomendaciones personalizadas para tu piel</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Servicios Destacados */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-xs font-semibold tracking-widest uppercase text-[#8A7F74] mb-1">Tratamientos</p>
                        <h2 className="text-2xl font-bold text-[#2A2825]">Servicios Destacados</h2>
                    </div>
                    <button
                        onClick={() => onNavigate('servicios')}
                        className="text-sm text-[#7A3B3B] hover:text-[#5C2B2B] font-semibold underline underline-offset-4 transition-colors"
                    >
                        Ver todos los servicios &rarr;
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {servicios.map((servicio, idx) => {
                        const IconComponent = getServiceIcon(servicio.nombre);
                        return (
                            <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-[#EDE8E1] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                                <div className="h-44 bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center border-b border-[#EDE8E1]">
                                    {servicio.imagenUrl ? (
                                        <img
                                            src={servicio.imagenUrl}
                                            alt={servicio.nombre}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    ) : null}

                                    {/* Icono central de fallback si no hay foto */}
                                    {!servicio.imagenUrl && (
                                        <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EDE8E1] flex flex-col items-center justify-center">
                                            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#DDD5C8] flex items-center justify-center text-[#7A3B3B] group-hover:scale-110 transition-transform duration-300">
                                                <IconComponent className="w-7 h-7" />
                                            </div>
                                            <span className="text-[11px] font-semibold text-[#8A7F74] mt-2 uppercase tracking-wider">Tratamiento</span>
                                        </div>
                                    )}

                                    {/* Badge flotante con icono Lucide identificador */}
                                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center text-[#7A3B3B] shadow-sm border border-white/60">
                                        <IconComponent className="w-4 h-4" />
                                    </div>

                                    {/* Gradiente decorativo sutil */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-[#2A2825] mb-1 group-hover:text-[#7A3B3B] transition-colors">{servicio.nombre}</h3>
                                        <p className="text-[#8A7F74] text-xs leading-relaxed mb-4 line-clamp-2">{servicio.descripcion}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-4 pt-2 border-t border-[#F5F2EB]">
                                            <div className="flex items-center gap-1.5 text-xs text-[#8A7F74] font-medium">
                                                <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                {servicio.duracion}
                                            </div>
                                            <div className="text-base font-bold text-[#3C3530]">{servicio.precio}</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (onSelectService && servicio.id) {
                                                    onSelectService(servicio.id);
                                                } else {
                                                    onNavigate('reservar');
                                                }
                                            }}
                                            className="w-full bg-[#3C3530] text-white py-2.5 rounded-xl hover:bg-[#7A3B3B] transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-xs"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>Reservar Turno</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Productos Destacados */}
            <div className="bg-white border-t border-b border-[#EDE8E1] py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-xs font-semibold tracking-widest uppercase text-[#8A7F74] mb-1">Tienda</p>
                            <h2 className="text-2xl font-bold text-[#2A2825]">Productos Destacados</h2>
                        </div>
                        <button
                            onClick={() => onNavigate('productos')}
                            className="text-sm text-[#3C3530] underline underline-offset-4 hover:text-[#2A2825] transition-colors"
                        >
                            Ver todo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {productos.map((producto, idx) => {
                            const IconComponent = getProductIcon(producto.nombre, producto.marca);
                            const numericPrice = typeof producto.precioNumerico === 'number'
                                ? producto.precioNumerico
                                : typeof producto.precio === 'number'
                                ? producto.precio
                                : parseInt(String(producto.precio).replace(/\D/g, '') || '0');

                            const modalData: ProductoModalData = {
                                id: producto.id,
                                nombre: producto.nombre,
                                marca: producto.marca,
                                precio: numericPrice,
                                categoria: 'Cuidado de la Piel',
                                tipoPiel: producto.tipoPiel || ['Normal', 'Seca'],
                                descripcion: producto.descripcion,
                                paraQueSirve: producto.paraQueSirve,
                                imagenUrl: producto.imagenUrl,
                                rating: producto.rating || 4.8,
                                stock: producto.stock !== undefined ? producto.stock : 25,
                            };

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedProducto(modalData)}
                                    className="rounded-2xl overflow-hidden border border-[#EDE8E1] hover:shadow-xl hover:border-[#DDD5C8] transition-all duration-300 bg-white flex flex-col justify-between group cursor-pointer"
                                >
                                    <div className="h-48 bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center border-b border-[#EDE8E1]">
                                        {producto.imagenUrl ? (
                                            <img
                                                src={producto.imagenUrl}
                                                alt={producto.nombre}
                                                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : null}

                                        {/* Icono central de fallback si no hay foto */}
                                        {!producto.imagenUrl && (
                                            <div className="w-full h-full bg-gradient-to-br from-[#FAF8F5] to-[#EDE8E1] flex flex-col items-center justify-center">
                                                <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#DDD5C8] flex items-center justify-center text-[#7A3B3B] group-hover:scale-110 transition-transform duration-300">
                                                    <IconComponent className="w-7 h-7" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-[#8A7F74] mt-2 uppercase tracking-wider">{producto.marca || 'Cosmética'}</span>
                                            </div>
                                        )}

                                        {/* Badge flotante con icono Lucide identificador */}
                                        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center text-[#7A3B3B] shadow-sm border border-white/60">
                                            <IconComponent className="w-4 h-4" />
                                        </div>

                                        {/* Overlay indicativo de Ver Detalle al hacer hover */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                                            <span className="bg-white/95 text-[#2A2825] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                                                <Eye className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                Ver detalles
                                            </span>
                                        </div>

                                        {/* Botón de Lista de Deseos (Favorito) */}
                                        {onToggleWishlist && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleWishlist(producto.id, {
                                                        nombre: producto.nombre,
                                                        marca: producto.marca,
                                                        precio: numericPrice,
                                                        imagenUrl: producto.imagenUrl,
                                                        descripcion: producto.paraQueSirve || producto.descripcion
                                                    });
                                                }}
                                                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm z-10 ${
                                                    wishlistIds.includes(producto.id)
                                                        ? 'bg-[#7A3B3B] text-white shadow-md'
                                                        : 'bg-white/95 backdrop-blur-xs text-[#8A7F74] hover:text-[#7A3B3B] hover:bg-white border border-white/60'
                                                }`}
                                                title={wishlistIds.includes(producto.id) ? 'Quitar de lista de deseos' : 'Guardar en lista de deseos'}
                                                aria-label="Lista de deseos"
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${wishlistIds.includes(producto.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A3B3B] bg-[#7A3B3B]/10 px-2.5 py-0.5 rounded-full inline-block mb-2">
                                                {producto.marca}
                                            </span>
                                            <h3 className="font-bold text-[#2A2825] mb-3 text-sm line-clamp-1 group-hover:text-[#7A3B3B] transition-colors">{producto.nombre}</h3>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-[#F5F2EB] gap-2">
                                            <div className="text-base font-bold text-[#3C3530]">{producto.precio}</div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedProducto(modalData);
                                                    }}
                                                    className="bg-[#FAF8F5] hover:bg-[#EDE8E1] text-[#3C3530] border border-[#EDE8E1] px-2.5 py-1.5 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1"
                                                    title="Ver detalles del producto"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                    <span>Detalle</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onNavigate('productos');
                                                    }}
                                                    className="bg-[#3C3530] text-white px-3 py-1.5 rounded-xl hover:bg-[#7A3B3B] transition-colors text-xs font-semibold flex items-center gap-1 shadow-xs"
                                                >
                                                    <span>Tienda</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CTA Final */}
            <div className="bg-[#3C3530] text-white py-14">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-3">Oferta de bienvenida</p>
                    <h2 className="text-3xl font-bold mb-3">¿Lista para empezar?</h2>
                    <p className="text-white/70 text-lg mb-8">
                        Reservá tu primer turno y obtené un 15% de descuento
                    </p>
                    <button
                        onClick={() => onNavigate('reservar')}
                        className="bg-white text-[#3C3530] px-8 py-3 rounded-lg font-semibold hover:bg-[#F7F4F0] transition-colors inline-flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        Reservar Mi Turno
                    </button>
                </div>
            </div>

            {/* Pie de Página / Footer Informativo Sincronizado en Vivo */}
            <footer className="bg-[#2A2825] text-[#EDE8E1] pt-14 pb-10 border-t border-[#3C3530]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-white/10 text-xs">
                        {/* Columna 1: Identidad */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-base text-white tracking-wider uppercase">
                                {config.nombreCentro}
                            </h3>
                            <p className="text-white/70 leading-relaxed">
                                {config.slogan}
                            </p>
                            <div className="pt-2 flex items-center gap-3">
                                {config.instagram && (
                                    <span className="text-[11px] font-semibold text-[#EDE8E1] bg-white/10 px-2.5 py-1 rounded-full">
                                        Instagram: {config.instagram}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Columna 2: Ubicación & Contacto */}
                        <div className="space-y-2.5">
                            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Contacto & Ubicación</h4>
                            <p className="flex items-start gap-2 text-white/80">
                                <MapPin className="w-4 h-4 text-[#7A3B3B] shrink-0 mt-0.5" />
                                <span>{config.direccion}, {config.ciudad}</span>
                            </p>
                            <p className="flex items-center gap-2 text-white/80">
                                <Phone className="w-4 h-4 text-[#7A3B3B] shrink-0" />
                                <span>{config.telefono}</span>
                            </p>
                            <p className="flex items-center gap-2 text-white/80">
                                <Mail className="w-4 h-4 text-[#7A3B3B] shrink-0" />
                                <span>{config.email}</span>
                            </p>
                            <a
                                href={`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors text-[11px]"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp: {config.whatsapp}</span>
                            </a>
                        </div>

                        {/* Columna 3: Horarios de Atención */}
                        <div className="space-y-2.5">
                            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Horarios de Atención</h4>
                            <div className="space-y-1.5 text-white/80">
                                <p className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                    <span>Lunes a Viernes: <strong>{config.horarioSemana}</strong></span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                    <span>Sábados: <strong>{config.horarioSabados}</strong></span>
                                </p>
                                <p className="flex items-center gap-2 text-white/60">
                                    <Clock className="w-3.5 h-3.5 text-white/40" />
                                    <span>Domingos: {config.atiendeDomingos ? config.horarioDomingos : 'Cerrado'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Columna 4: Políticas & Garantías */}
                        <div className="space-y-2.5">
                            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Políticas de Turnos</h4>
                            <p className="text-white/70 leading-relaxed">
                                {config.politicaCancelacionTexto}
                            </p>
                            <div className="pt-2 flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                                <Shield className="w-3.5 h-3.5" />
                                <span>Atención personalizada y segura</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50">
                        <p>© {new Date().getFullYear()} {config.nombreCentro}. Todos los derechos reservados.</p>
                        <div className="flex items-center gap-4">
                            <button onClick={() => onNavigate('servicios')} className="hover:text-white transition-colors">Servicios</button>
                            <button onClick={() => onNavigate('productos')} className="hover:text-white transition-colors">Tienda</button>
                            <button onClick={() => onNavigate('reservar')} className="hover:text-white transition-colors">Reservas</button>
                            <button onClick={() => onNavigate('lealtad')} className="hover:text-white transition-colors">Lealtad</button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Modal de Detalle de Producto */}
            <DetalleProductoModal
                producto={selectedProducto}
                isOpen={!!selectedProducto}
                onClose={() => setSelectedProducto(null)}
                onAddToCart={(id, item, qty) => {
                    if (onAddToCart) onAddToCart(id, item, qty);
                }}
                isWishlisted={selectedProducto ? wishlistIds.includes(selectedProducto.id) : false}
                onToggleWishlist={onToggleWishlist}
            />
        </div>
    );
}
