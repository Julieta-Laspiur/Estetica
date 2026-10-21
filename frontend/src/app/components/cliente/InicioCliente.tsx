import { Calendar, Gift, Sparkles, Clock, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface InicioClienteProps {
    onNavigate: (section: string) => void;
}

const bannerSlides = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWNpYWwlMjB0cmVhdG1lbnQlMjBzcGElMjBwcm9tb3Rpb258ZW58MXx8fHwxNzgyMTU4MjM2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        tag: 'Promoción Especial',
        title: '30% OFF en Faciales Hidratantes',
        subtitle: 'Durante todo el mes de julio. Reservá tu turno y aprovechá.',
        cta: 'Reservar Ahora',
        ctaTarget: 'reservar',
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1778451510207-24f1e204f465?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxiZWF1dHklMjBzcGElMjBza2luY2FyZSUyMHByb2R1Y3RzJTIwZWxlZ2FudHxlbnwxfHx8fDE3ODIxNTgyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        tag: 'Nuevos Productos',
        title: 'Línea Premium de Skincare',
        subtitle: 'Cremas, sérums y tratamientos de las mejores marcas internacionales.',
        cta: 'Ver Productos',
        ctaTarget: 'productos',
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1779117691346-5de09d89a73f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxiZWF1dHklMjBzcGElMjBza2luY2FyZSUyMHByb2R1Y3RzJTIwZWxlZ2FudHxlbnwxfHx8fDE3ODIxNTgyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        tag: 'Programa de Lealtad',
        title: 'Acumulá Estampillas y Ganá',
        subtitle: 'Por cada tratamiento sumás estampillas. Llegá a 10 y recibí un servicio gratis.',
        cta: 'Mi Tarjeta',
        ctaTarget: 'lealtad',
    },
];

const serviciosDestacados = [
    { nombre: 'Facial Hidratante', descripcion: 'Tratamiento profundo de hidratación', precio: '$1,200', emoji: '✨', duracion: '60 min' },
    { nombre: 'Masaje Relajante', descripcion: 'Masaje corporal completo', precio: '$1,500', emoji: '💆', duracion: '90 min' },
    { nombre: 'Depilación Láser', descripcion: 'Sesión de depilación láser', precio: '$800', emoji: '⚡', duracion: '45 min' },
];

const productosDestacados = [
    { nombre: 'Crema Hidratante Premium', marca: 'La Roche-Posay', precio: '$2,500', emoji: '🧴' },
    { nombre: 'Sérum Vitamina C', marca: 'Vichy', precio: '$3,200', emoji: '💧' },
    { nombre: 'Protector Solar FPS 50+', marca: 'Eucerin', precio: '$1,800', emoji: '☀️' },
];

export function InicioCliente({ onNavigate }: InicioClienteProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentSlide(prev => (prev + 1) % bannerSlides.length);
    }, []);

    const prevSlide = () => {
        setCurrentSlide(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    };

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [isPaused, nextSlide]);

    const slide = bannerSlides[currentSlide];

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
                {bannerSlides.map((s, idx) => (
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
                    {bannerSlides.map((_, idx) => (
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
                <div className="mb-8">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#8A7F74] mb-1">Tratamientos</p>
                    <h2 className="text-2xl font-bold text-[#2A2825]">Servicios Destacados</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {serviciosDestacados.map((servicio, idx) => (
                        <div key={idx} className="bg-white rounded-xl overflow-hidden border border-[#EDE8E1] hover:shadow-md transition-shadow">
                            <div className="bg-[#EDE8E1] h-36 flex items-center justify-center text-5xl">
                                {servicio.emoji}
                            </div>
                            <div className="p-5">
                                <h3 className="font-semibold text-[#2A2825] mb-1">{servicio.nombre}</h3>
                                <p className="text-[#8A7F74] text-sm mb-4">{servicio.descripcion}</p>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-1.5 text-sm text-[#8A7F74]">
                                        <Clock className="w-4 h-4" />
                                        {servicio.duracion}
                                    </div>
                                    <div className="text-base font-bold text-[#3C3530]">{servicio.precio}</div>
                                </div>
                                <button
                                    onClick={() => onNavigate('reservar')}
                                    className="w-full bg-[#3C3530] text-white py-2 rounded-lg hover:bg-[#2A2825] transition-colors text-sm font-medium"
                                >
                                    Reservar
                                </button>
                            </div>
                        </div>
                    ))}
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
                        {productosDestacados.map((producto, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden border border-[#EDE8E1] hover:shadow-md transition-shadow bg-[#F7F4F0]">
                                <div className="bg-[#EDE8E1] h-36 flex items-center justify-center text-5xl">
                                    {producto.emoji}
                                </div>
                                <div className="p-5">
                                    <p className="text-xs text-[#8A7F74] mb-1 font-medium">{producto.marca}</p>
                                    <h3 className="font-semibold text-[#2A2825] mb-4 text-sm">{producto.nombre}</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="text-lg font-bold text-[#3C3530]">{producto.precio}</div>
                                        <button
                                            onClick={() => onNavigate('productos')}
                                            className="bg-[#3C3530] text-white px-4 py-1.5 rounded-lg hover:bg-[#2A2825] transition-colors text-sm"
                                        >
                                            Ver más
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonios */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-8">
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#8A7F74] mb-1">Reseñas</p>
                    <h2 className="text-2xl font-bold text-[#2A2825]">Lo que dicen nuestras clientas</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { nombre: 'María González', comentario: 'El mejor centro estético que he visitado. Profesionales excelentes y resultados increíbles.', estrellas: 5 },
                        { nombre: 'Ana Rodríguez', comentario: 'Me encanta el programa de lealtad y la atención personalizada. Totalmente recomendado.', estrellas: 5 },
                        { nombre: 'Laura Fernández', comentario: 'Los productos son de primera calidad y el sistema de reservas online es muy práctico.', estrellas: 5 },
                    ].map((t, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-[#EDE8E1] p-6">
                            <div className="flex items-center gap-1 mb-3">
                                {Array.from({ length: t.estrellas }).map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-[#8A7F74] text-sm mb-4 italic leading-relaxed">"{t.comentario}"</p>
                            <p className="font-semibold text-[#2A2825] text-sm">{t.nombre}</p>
                        </div>
                    ))}
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
        </div>
    );
}
