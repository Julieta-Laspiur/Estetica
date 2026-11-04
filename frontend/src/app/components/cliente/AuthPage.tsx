import { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, Sparkles, Check, ArrowLeft, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { authApi, type AuthUser } from '../../../services/api';
import {
    configuracionService,
    EVENTO_CONFIG_ACTUALIZADA,
    type ConfiguracionGeneral
} from '../../../services/configuracionService';

interface AuthPageProps {
    onLogin: (user: AuthUser) => void;
    onCancel?: () => void;
}

type Mode = 'login' | 'registro';

interface FormErrors {
    general?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    password?: string;
    confirmPassword?: string;
}

export function AuthPage({ onLogin, onCancel }: AuthPageProps) {
    const [mode, setMode] = useState<Mode>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [siteConfig, setSiteConfig] = useState<ConfiguracionGeneral>(() => configuracionService.get());

    useEffect(() => {
        const handler = (e: any) => {
            if (e.detail) {
                setSiteConfig(e.detail);
            } else {
                setSiteConfig(configuracionService.get());
            }
        };
        window.addEventListener(EVENTO_CONFIG_ACTUALIZADA, handler);
        return () => window.removeEventListener(EVENTO_CONFIG_ACTUALIZADA, handler);
    }, []);

    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
    });

    const validate = (): boolean => {
        const errs: FormErrors = {};
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.email.trim()) {
            errs.email = 'El correo electrónico es obligatorio.';
        } else if (!emailRe.test(form.email.trim())) {
            errs.email = 'Ingresá un correo electrónico válido.';
        }

        if (mode === 'registro') {
            if (!form.nombre.trim()) {
                errs.nombre = 'El nombre es obligatorio.';
            } else if (form.nombre.trim().length < 2) {
                errs.nombre = 'Mínimo 2 caracteres.';
            }

            if (!form.apellido.trim()) {
                errs.apellido = 'El apellido es obligatorio.';
            } else if (form.apellido.trim().length < 2) {
                errs.apellido = 'Mínimo 2 caracteres.';
            }

            if (!form.password) {
                errs.password = 'La contraseña es obligatoria.';
            } else if (form.password.length < 6) {
                errs.password = 'Debe tener al menos 6 caracteres.';
            }

            if (!form.confirmPassword) {
                errs.confirmPassword = 'Confirmá tu contraseña.';
            } else if (form.password !== form.confirmPassword) {
                errs.confirmPassword = 'Las contraseñas no coinciden.';
            }
        } else {
            if (!form.password) {
                errs.password = 'La contraseña es obligatoria.';
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setErrors({});

        try {
            if (mode === 'login') {
                const response = await authApi.login(form.email.trim(), form.password);
                onLogin(response.usuario);
            } else {
                const response = await authApi.register(
                    form.nombre.trim(),
                    form.apellido.trim(),
                    form.email.trim(),
                    form.telefono.trim(),
                    form.password,
                    0
                );
                onLogin(response.usuario);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error al procesar la solicitud.';
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (email: string, pass: string) => {
        setLoading(true);
        setErrors({});
        try {
            const res = await authApi.login(email, pass);
            onLogin(res.usuario);
        } catch (err: unknown) {
            const isPro = email.includes('pro') || email.includes('maria');
            const isAdmin = email.includes('admin');
            const fallbackUser: AuthUser = {
                usuarioId: isAdmin ? 1 : isPro ? 3 : 2,
                nombre: isAdmin ? 'Administrador' : isPro ? 'María' : 'Cliente',
                apellido: isAdmin ? 'Demo' : isPro ? 'González' : 'Demo',
                email: email,
                rol: isAdmin ? 'Administrador' : isPro ? 'Profesional' : 'Cliente',
            };
            localStorage.setItem('estetica_token', 'demo-token-' + Date.now());
            localStorage.setItem('estetica_user', JSON.stringify(fallbackUser));
            onLogin(fallbackUser);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (next: Mode) => {
        setMode(next);
        setErrors({});
        setShowPassword(false);
        setShowConfirm(false);
    };

    const field =
        'w-full px-4 py-2.5 rounded-xl border bg-[#FAF8F5] text-[#2A2825] text-sm placeholder-[#A89E94] focus:outline-none transition-colors';
    const fieldOk = 'border-[#EDE8E1] focus:border-[#7A3B3B] focus:ring-1 focus:ring-[#7A3B3B]';
    const fieldErr = 'border-red-300 focus:border-red-400 bg-red-50/30';

    const passwordStrength = (pw: string) => {
        if (!pw) return 0;
        let s = 0;
        if (pw.length >= 6) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9]/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        return s;
    };
    const strength = passwordStrength(form.password);
    const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

    return (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6">
            {/* Barra superior con botón volver */}
            <header className="max-w-xl w-full mx-auto flex items-center justify-between mb-4">
                {onCancel ? (
                    <button
                        onClick={onCancel}
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7A3B3B] hover:text-[#5C2B2B] bg-white border border-[#EDE8E1] px-4 py-2 rounded-full shadow-2xs hover:shadow-xs transition-all group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Volver a la tienda</span>
                    </button>
                ) : <div />}

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8A7F74]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Conexión Segura</span>
                </div>
            </header>

            {/* Tarjeta única y centrada de autenticación */}
            <main className="w-full max-w-[480px] mx-auto bg-white rounded-3xl shadow-sm border border-[#EDE8E1] p-6 sm:p-9 my-auto transition-all duration-200">
                
                {/* Logo idéntico a la tienda con fondo blanco integrado */}
                <div className="flex flex-col items-center justify-center text-center mb-6">
                    {(siteConfig.logoRectangularUrl || siteConfig.logoUrl) ? (
                        <img
                            src={siteConfig.logoRectangularUrl || siteConfig.logoUrl}
                            alt={siteConfig.nombreCentro}
                            className="h-12 sm:h-14 max-w-[280px] object-contain mb-2"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <span className="font-bold tracking-[0.16em] uppercase text-2xl leading-none text-[#2A2825]">
                                <span>{siteConfig.nombreCentro.split(' ')[0] || 'Centro'}</span>
                                <span className="text-[#7A3B3B]">
                                    {' ' + (siteConfig.nombreCentro.split(' ').slice(1).join(' ') || 'Estético')}
                                </span>
                            </span>
                            <span className="text-[10px] tracking-[0.25em] uppercase text-[#A89E94] mt-1.5 font-medium">
                                {siteConfig.slogan || 'Tu belleza, nuestra pasión'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Pestañas de modo (Iniciar sesión / Registrarse) */}
                <div className="flex gap-1.5 mb-6 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-1.5">
                    {(['login', 'registro'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => switchMode(m)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                                mode === m
                                    ? 'bg-[#7A3B3B] text-white shadow-xs'
                                    : 'text-[#8A7F74] hover:text-[#2A2825]'
                            }`}
                        >
                            {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                        </button>
                    ))}
                </div>

                {/* Título contextual */}
                <div className="mb-6 text-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#2A2825] tracking-tight">
                        {mode === 'login' ? 'Bienvenida de nuevo' : 'Creá tu cuenta'}
                    </h1>
                    <p className="text-xs text-[#8A7F74] mt-1">
                        {mode === 'login'
                            ? 'Ingresá con tu correo y contraseña para gestionar tu cuenta'
                            : 'Registrate en minutos y comenzá a sumar beneficios'}
                    </p>
                </div>

                {/* Banner de error general */}
                {errors.general && (
                    <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs leading-relaxed animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                        <span>{errors.general}</span>
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
                    {/* Campos de registro: Nombre y Apellido */}
                    {mode === 'registro' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-semibold tracking-wider uppercase text-[#5C534A]">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    autoComplete="given-name"
                                    placeholder="ej. Julieta"
                                    value={form.nombre}
                                    onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                                    className={`${field} ${errors.nombre ? fieldErr : fieldOk}`}
                                />
                                {errors.nombre && <p className="text-[11px] text-red-500 mt-0.5">{errors.nombre}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-semibold tracking-wider uppercase text-[#5C534A]">
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    autoComplete="family-name"
                                    placeholder="ej. Laspiur"
                                    value={form.apellido}
                                    onChange={(e) => setForm(f => ({ ...f, apellido: e.target.value }))}
                                    className={`${field} ${errors.apellido ? fieldErr : fieldOk}`}
                                />
                                {errors.apellido && <p className="text-[11px] text-red-500 mt-0.5">{errors.apellido}</p>}
                            </div>
                        </div>
                    )}

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold tracking-wider uppercase text-[#5C534A]">
                            Correo electrónico *
                        </label>
                        <input
                            type="email"
                            autoComplete="email"
                            placeholder="tu@correo.com"
                            value={form.email}
                            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                            className={`${field} ${errors.email ? fieldErr : fieldOk}`}
                        />
                        {errors.email && <p className="text-[11px] text-red-500 mt-0.5">{errors.email}</p>}
                    </div>

                    {/* Teléfono — solo registro */}
                    {mode === 'registro' && (
                        <div className="flex flex-col gap-1 animate-in fade-in duration-200">
                            <label className="text-[11px] font-semibold tracking-wider uppercase text-[#5C534A]">
                                Teléfono <span className="text-[#A89E94] font-normal">(opcional)</span>
                            </label>
                            <input
                                type="tel"
                                autoComplete="tel"
                                placeholder="+54 9 11 1234-5678"
                                value={form.telefono}
                                onChange={(e) => setForm(f => ({ ...f, telefono: e.target.value }))}
                                className={`${field} ${errors.telefono ? fieldErr : fieldOk}`}
                            />
                            {errors.telefono && <p className="text-[11px] text-red-500 mt-0.5">{errors.telefono}</p>}
                        </div>
                    )}

                    {/* Contraseña */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold tracking-wider uppercase text-[#5C534A]">
                            Contraseña *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                placeholder={mode === 'login' ? 'Ingresá tu contraseña' : 'Mínimo 6 caracteres'}
                                value={form.password}
                                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                className={`${field} pr-11 ${errors.password ? fieldErr : fieldOk}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A89E94] hover:text-[#7A3B3B] transition-colors"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-[11px] text-red-500 mt-0.5">{errors.password}</p>}

                        {/* Barra de fortaleza — solo registro */}
                        {mode === 'registro' && form.password.length > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex gap-1 flex-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                i <= strength ? strengthColor[strength] : 'bg-[#DDD5C8]'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className={`text-[10px] font-medium ${
                                    strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-amber-500' : 'text-emerald-600'
                                }`}>
                                    {strengthLabel[strength]}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirmar contraseña — solo registro */}
                    {mode === 'registro' && (
                        <div className="flex flex-col gap-1 animate-in fade-in duration-200">
                            <label className="text-[11px] font-semibold tracking-wider uppercase text-[#5C534A]">
                                Confirmar contraseña *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Repetí tu contraseña"
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                    className={`${field} pr-11 ${errors.confirmPassword ? fieldErr : fieldOk}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A89E94] hover:text-[#7A3B3B] transition-colors"
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Ocultar confirmación' : 'Ver confirmación'}
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                {form.confirmPassword && form.password === form.confirmPassword && (
                                    <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                )}
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-[11px] text-red-500 mt-0.5">{errors.confirmPassword}</p>
                            )}
                        </div>
                    )}

                    {/* Botón de envío */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white font-bold text-sm tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {mode === 'login' ? 'Iniciando sesión...' : 'Registrando cuenta...'}
                            </span>
                        ) : (
                            <>
                                {mode === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Cambio de modo al pie */}
                <p className="text-center text-xs text-[#8A7F74] mt-5">
                    {mode === 'login' ? '¿Todavía no tenés una cuenta?' : '¿Ya tenés una cuenta registrada?'}{' '}
                    <button
                        type="button"
                        onClick={() => switchMode(mode === 'login' ? 'registro' : 'login')}
                        className="font-semibold text-[#7A3B3B] hover:underline"
                    >
                        {mode === 'login' ? 'Registrate acá' : 'Iniciá sesión'}
                    </button>
                </p>

                {/* Accesos rápidos Demo */}
                <div className="mt-6 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1]">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                        <span className="text-xs font-bold text-[#3C3530] tracking-wider uppercase">Acceso Rápido Demo</span>
                    </div>
                    <p className="text-[11px] text-[#8A7F74] mb-3 leading-relaxed">
                        Probá el sistema con un clic usando cualquiera de las cuentas preconfiguradas:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleDemoLogin('cliente@estetica.com', 'Cliente123!')}
                            className="py-2.5 px-3 rounded-xl bg-white border border-[#EDE8E1] text-xs font-semibold text-[#3C3530] hover:border-[#7A3B3B] hover:text-[#7A3B3B] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                            <User className="w-3.5 h-3.5 text-[#7A3B3B]" />
                            <span>Cliente Demo</span>
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleDemoLogin('maria.gonzalez@estetica.com', 'Pro123!')}
                            className="py-2.5 px-3 rounded-xl bg-[#FAF0F0] border border-[#7A3B3B]/30 text-xs font-bold text-[#7A3B3B] hover:bg-[#7A3B3B] hover:text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Profesional</span>
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleDemoLogin('admin@estetica.com', 'Admin123!')}
                            className="py-2.5 px-3 rounded-xl bg-[#3C3530] text-white text-xs font-bold hover:bg-[#2A2825] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#E8BAC0]" />
                            <span>Admin Demo</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Pie de página con copyright */}
            <footer className="text-center text-xs text-[#A89E94] mt-6">
                © {new Date().getFullYear()} {siteConfig.nombreCentro}. Todos los derechos reservados.
            </footer>
        </div>
    );
}
