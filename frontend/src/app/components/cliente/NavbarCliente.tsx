import { ShoppingCart, User, QrCode, Calendar, ShoppingBag, MessageCircle, Menu, X, Heart, Search, LogOut, Shield, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { AuthUser } from '../../../services/api';

interface NavbarClienteProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
    cartCount: number;
    wishlistCount?: number;
    currentUser?: AuthUser | null;
    onLogout?: () => void;
    onSwitchToAdmin?: () => void;
    onSearch?: (query: string) => void;
}

export function NavbarCliente({
    activeSection,
    onSectionChange,
    cartCount,
    wishlistCount = 0,
    currentUser,
    onLogout,
    onSwitchToAdmin,
    onSearch
}: NavbarClienteProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [compactSearchOpen, setCompactSearchOpen] = useState(false);

    const isAdmin = currentUser?.rol === 'Administrador';

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    setScrolled(prev => {
                        // Histeresis amplia para prevenir que la disminución de altura
                        // de la navbar provoque un bucle de parpadeo y congelamiento (jitter):
                        if (!prev && scrollY > 115) return true;
                        if (prev && scrollY < 25) {
                            setCompactSearchOpen(false);
                            return false;
                        }
                        return prev;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const allMenuItems = [
        { id: 'inicio', label: 'Inicio', icon: null },
        { id: 'servicios', label: 'Servicios', icon: Sparkles },
        { id: 'reservar', label: 'Reservar Turno', icon: Calendar },
        { id: 'productos', label: 'Productos', icon: ShoppingBag },
        { id: 'lealtad', label: 'Mi Tarjeta', icon: QrCode },
        { id: 'chat', label: 'Consultorio IA', icon: MessageCircle },
    ];

    // El administrador no utiliza la tarjeta de lealtad como cliente
    const menuItems = isAdmin
        ? allMenuItems.filter(item => item.id !== 'lealtad')
        : allMenuItems;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchValue.trim());
        } else {
            onSectionChange('productos');
        }
        setCompactSearchOpen(false);
        setMenuOpen(false);
    };

    const iconBtn = "relative p-2 hover:bg-[#F7F4F0] rounded-lg transition-colors text-[#3C3530] hover:text-[#7A3B3B]";

    const iconGroup = (
        <div className="flex items-center gap-1.5">
            {/* User Session Button or Iniciar Sesion */}
            {currentUser ? (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onSectionChange('perfil')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${activeSection === 'perfil'
                            ? 'bg-[#7A3B3B] text-white border-[#7A3B3B]'
                            : 'bg-[#F7F4F0] text-[#3C3530] border-[#DDD5C8] hover:border-[#7A3B3B]'
                            }`}
                        title="Ver mi perfil"
                    >
                        <span className="w-5 h-5 rounded-full bg-[#3C3530] text-white flex items-center justify-center text-[10px] font-bold uppercase">
                            {currentUser.nombre.charAt(0)}
                        </span>
                        <span className="hidden sm:inline font-semibold max-w-[100px] truncate">
                            {currentUser.nombre}
                        </span>
                        {isAdmin && (
                            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#7A3B3B]/15 text-[#7A3B3B] uppercase tracking-wider">
                                Admin
                            </span>
                        )}
                    </button>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className={iconBtn}
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-4 h-4 text-[#8A7F74] hover:text-red-600 transition-colors" />
                        </button>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => onSectionChange('auth')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-semibold ${activeSection === 'auth'
                        ? 'bg-[#7A3B3B] text-white border-[#7A3B3B]'
                        : 'border-[#DDD5C8] text-[#3C3530] hover:text-[#7A3B3B] hover:border-[#7A3B3B] hover:bg-[#F7F4F0]'
                        }`}
                    title="Iniciar sesión o registrarse"
                >
                    <User className="w-3.5 h-3.5" />
                    <span>Iniciar Sesión</span>
                </button>
            )}

            {/* Carrito y Lista de Deseos: SOLO para Clientes e Invitados, NO para Administradores */}
            {!isAdmin && (
                <>
                    <button
                        onClick={() => onSectionChange('wishlist')}
                        className={`${iconBtn} ${activeSection === 'wishlist' ? 'text-[#7A3B3B] bg-[#EDE8E1]' : ''}`}
                        title="Lista de deseos"
                    >
                        <Heart className={`w-5 h-5 ${activeSection === 'wishlist' ? 'fill-current' : ''}`} />
                        {wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7A3B3B] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                                {wishlistCount}
                            </span>
                        )}
                    </button>
                    <button onClick={() => onSectionChange('carrito')} className={iconBtn} title="Carrito">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3C3530] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </>
            )}

            {/* Acceso rápido directo al Panel Administrativo cuando un administrador recorre la tienda */}
            {isAdmin && onSwitchToAdmin && (
                <button
                    onClick={onSwitchToAdmin}
                    className="ml-1 px-3 py-1.5 bg-[#EDE8E1] hover:bg-[#DDD5C8] text-[#7A3B3B] text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="Volver al panel administrativo"
                >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Panel Admin</span>
                </button>
            )}

            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 hover:bg-[#EDE8E1] rounded-lg transition-colors ml-1"
                aria-label="Abrir menú"
            >
                {menuOpen ? <X className="w-5 h-5 text-[#3C3530]" /> : <Menu className="w-5 h-5 text-[#3C3530]" />}
            </button>
        </div>
    );

    return (
        <nav
            className="bg-white sticky top-0 z-40 transition-shadow duration-300"
            style={{
                borderTop: scrolled ? 'none' : '3px solid #7A3B3B',
                boxShadow: scrolled ? '0 2px 12px rgba(42,28,25,0.10)' : 'none',
            }}
        >
            {scrolled ? (
                /* ── Compact single-row (scrolled / chiquito) ── */
                <div className="border-b border-[#DDD5C8]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center h-[52px] gap-3">

                            {/* Logo */}
                            <button
                                onClick={() => {
                                    onSectionChange('inicio');
                                    setCompactSearchOpen(false);
                                }}
                                className="shrink-0 group"
                            >
                                <span className="font-bold tracking-[0.18em] uppercase text-base leading-none group-hover:opacity-80 transition-opacity">
                                    <span className="text-[#2A2825]">Centro</span>
                                    <span className="text-[#7A3B3B]"> Estético</span>
                                </span>
                            </button>

                            {/* Búsqueda en el chiquito: Input expandido */}
                            {compactSearchOpen ? (
                                <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto relative animate-in fade-in duration-200">
                                    <input
                                        type="text"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        placeholder="Buscar en el catálogo..."
                                        className="w-full pl-9 pr-9 py-1.5 rounded-full border border-[#7A3B3B] bg-[#FAF8F5] text-xs sm:text-sm text-[#2A2825] placeholder-[#8A7F74] focus:outline-none focus:ring-1 focus:ring-[#7A3B3B]"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A3B3B]"
                                        title="Buscar"
                                    >
                                        <Search className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCompactSearchOpen(false)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7F74] hover:text-[#2A2825]"
                                        title="Cerrar búsqueda"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </form>
                            ) : (
                                /* Nav links center */
                                <div className="hidden md:flex flex-1 items-center justify-center gap-0 h-full">
                                    {menuItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => onSectionChange(item.id)}
                                            className={`relative px-4 h-full text-xs font-semibold tracking-widest uppercase transition-colors ${activeSection === item.id
                                                ? 'text-[#7A3B3B]'
                                                : 'text-[#5C534A] hover:text-[#7A3B3B]'
                                                }`}
                                        >
                                            {item.label}
                                            {activeSection === item.id && (
                                                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#7A3B3B] rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Icons (incluye botón lupa de búsqueda en el chiquito) */}
                            <div className="ml-auto flex items-center gap-1">
                                {!compactSearchOpen && (
                                    <button
                                        onClick={() => setCompactSearchOpen(true)}
                                        className={iconBtn}
                                        title="Buscar productos o servicios"
                                        aria-label="Buscar"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                )}
                                {iconGroup}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Full two-row (top of page) ── */
                <>
                    <div className="border-b border-[#DDD5C8]">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-3 items-center h-[68px] gap-4">

                                {/* Left: Search */}
                                <div className="flex items-center">
                                    <form onSubmit={handleSearch} className="w-full max-w-xs">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchValue}
                                                onChange={(e) => setSearchValue(e.target.value)}
                                                placeholder="Buscar..."
                                                className="w-full pl-4 pr-10 py-2 rounded-full border border-[#DDD5C8] bg-[#F7F4F0] text-sm text-[#2A2825] placeholder-[#A89E94] focus:outline-none focus:border-[#7A3B3B] transition-colors"
                                            />
                                            <button
                                                type="submit"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7F74] hover:text-[#7A3B3B] transition-colors"
                                                aria-label="Buscar"
                                            >
                                                <Search className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Center: Logo */}
                                <div className="flex justify-center items-center">
                                    <button onClick={() => onSectionChange('inicio')} className="flex flex-col items-center gap-0 group">
                                        <span className="font-bold tracking-[0.18em] uppercase text-xl leading-none text-[#2A2825] group-hover:text-[#7A3B3B] transition-colors">
                                            <span className="text-[#2A2825]">Centro</span>
                                            <span className="text-[#7A3B3B]"> Estético</span>
                                        </span>
                                        <span className="text-[9px] tracking-[0.25em] uppercase text-[#A89E94] mt-0.5">Tu belleza, nuestra pasión</span>
                                    </button>
                                </div>

                                {/* Right: icons */}
                                <div className="flex justify-end">{iconGroup}</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom row: nav links */}
                    <div className="hidden md:block border-b border-[#EDE8E1]">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-center gap-0 h-10">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => onSectionChange(item.id)}
                                        className={`relative px-4 h-full text-xs font-semibold tracking-widest uppercase transition-colors ${activeSection === item.id
                                            ? 'text-[#7A3B3B]'
                                            : 'text-[#5C534A] hover:text-[#7A3B3B]'
                                            }`}
                                    >
                                        {item.label}
                                        {activeSection === item.id && (
                                            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#7A3B3B] rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-[#DDD5C8] bg-white shadow-lg animate-in slide-in-from-top-2">
                    <div className="px-4 py-3">
                        <form onSubmit={handleSearch} className="mb-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder="Buscar productos o servicios..."
                                    className="w-full pl-4 pr-10 py-2.5 rounded-full border border-[#DDD5C8] bg-[#F7F4F0] text-sm text-[#2A2825] placeholder-[#A89E94] focus:outline-none"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
                            </div>
                        </form>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { onSectionChange(item.id); setMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activeSection === item.id
                                    ? 'bg-[#F7F4F0] text-[#7A3B3B]'
                                    : 'text-[#5C534A] hover:bg-[#F7F4F0]'
                                    }`}
                            >
                                {item.icon && <item.icon className="w-4 h-4" />}
                                {item.label}
                            </button>
                        ))}
                        {!isAdmin && (
                            <button
                                onClick={() => { onSectionChange('wishlist'); setMenuOpen(false); }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${activeSection === 'wishlist'
                                    ? 'bg-[#F7F4F0] text-[#7A3B3B]'
                                    : 'text-[#5C534A] hover:bg-[#F7F4F0]'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <Heart className="w-4 h-4 text-[#7A3B3B]" />
                                    Lista de Deseos
                                </span>
                                {wishlistCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#7A3B3B] text-white">
                                        {wishlistCount}
                                    </span>
                                )}
                            </button>
                        )}
                        <div className="mt-3 pt-3 border-t border-[#EDE8E1] flex flex-col gap-2">
                            {currentUser ? (
                                <>
                                    <div className="flex items-center justify-between p-3 bg-[#F7F4F0] rounded-xl">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-8 h-8 rounded-full bg-[#3C3530] text-white flex items-center justify-center text-xs font-bold uppercase">
                                                {currentUser.nombre.charAt(0)}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-bold text-[#2A2825]">{currentUser.nombre} {currentUser.apellido}</p>
                                                    {isAdmin && (
                                                        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#7A3B3B]/15 text-[#7A3B3B] uppercase">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-[#8A7F74]">{currentUser.email}</p>
                                            </div>
                                        </div>
                                        {onLogout && (
                                            <button
                                                onClick={() => { onLogout(); setMenuOpen(false); }}
                                                className="text-xs font-medium text-red-600 hover:underline px-2 py-1"
                                            >
                                                Salir
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { onSectionChange('perfil'); setMenuOpen(false); }}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-[#5C534A] hover:bg-[#F7F4F0] transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        Mi Perfil
                                    </button>

                                    {isAdmin && onSwitchToAdmin && (
                                        <button
                                            onClick={() => { onSwitchToAdmin(); setMenuOpen(false); }}
                                            className="w-full py-2 bg-[#EDE8E1] rounded-lg text-sm font-semibold text-[#7A3B3B] hover:bg-[#DDD5C8] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Ir al Panel de Administración
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={() => { onSectionChange('auth'); setMenuOpen(false); }}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#3C3530] text-white text-sm font-semibold hover:bg-[#2A2825] transition-colors shadow-xs"
                                >
                                    <User className="w-4 h-4" />
                                    Iniciar Sesión / Registrarse
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
