import { ShoppingCart, User, QrCode, Calendar, ShoppingBag, MessageCircle, Menu, X, Heart, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavbarClienteProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
    cartCount: number;
    wishlistCount?: number;
    onSwitchToAdmin: () => void;
}

export function NavbarCliente({ activeSection, onSectionChange, cartCount, wishlistCount = 0, onSwitchToAdmin }: NavbarClienteProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const menuItems = [
        { id: 'inicio', label: 'Inicio', icon: null },
        { id: 'reservar', label: 'Reservar Turno', icon: Calendar },
        { id: 'productos', label: 'Productos', icon: ShoppingBag },
        { id: 'lealtad', label: 'Mi Tarjeta', icon: QrCode },
        { id: 'chat', label: 'Consultorio IA', icon: MessageCircle },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchValue.trim()) {
            onSectionChange('productos');
        }
    };

    const iconBtn = "relative p-2 hover:bg-[#F7F4F0] rounded-lg transition-colors text-[#3C3530] hover:text-[#7A3B3B]";

    const iconGroup = (
        <div className="flex items-center gap-1">
            <button onClick={() => onSectionChange('perfil')} className={iconBtn} title="Mi Perfil">
                <User className="w-5 h-5" />
            </button>
            <button onClick={() => onSectionChange('wishlist')} className={iconBtn} title="Lista de deseos">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7A3B3B] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                        {wishlistCount}
                    </span>
                )}
            </button>
            <button onClick={() => onSectionChange('carrito')} className={iconBtn} title="Carrito">
                <ShoppingCart className="w-5 h-5" />
                {cartCount >= 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3C3530] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                        {cartCount}
                    </span>
                )}
            </button>
            <button
                onClick={onSwitchToAdmin}
                className="hidden lg:block ml-1 px-3 py-1.5 bg-[#EDE8E1] text-xs rounded-lg hover:bg-[#DDD5C8] transition-colors text-[#8A7F74]"
            >
                Admin
            </button>
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 hover:bg-[#EDE8E1] rounded-lg transition-colors ml-1"
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
                /* ── Compact single-row (scrolled) ── */
                <div className="border-b border-[#DDD5C8]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center h-[52px] gap-4">

                            {/* Logo */}
                            <button
                                onClick={() => onSectionChange('inicio')}
                                className="shrink-0 group"
                            >
                                <span className="font-bold tracking-[0.18em] uppercase text-base leading-none group-hover:opacity-80 transition-opacity">
                                    <span className="text-[#2A2825]">Centro</span>
                                    <span className="text-[#7A3B3B]"> Estético</span>
                                </span>
                            </button>

                            {/* Nav links center */}
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

                            {/* Icons */}
                            <div className="ml-auto">{iconGroup}</div>
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
                <div className="md:hidden border-t border-[#DDD5C8] bg-white shadow-lg">
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
                        <div className="mt-2 pt-2 border-t border-[#EDE8E1] flex gap-2">
                            <button
                                onClick={() => { onSectionChange('perfil'); setMenuOpen(false); }}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-[#5C534A] hover:bg-[#F7F4F0] transition-colors"
                            >
                                <User className="w-4 h-4" />
                                Mi Perfil
                            </button>
                            <button
                                onClick={onSwitchToAdmin}
                                className="flex-1 py-2 bg-[#EDE8E1] rounded-lg text-sm text-[#5C534A] hover:bg-[#DDD5C8] transition-colors"
                            >
                                Vista Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
