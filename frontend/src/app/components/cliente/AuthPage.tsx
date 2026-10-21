import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Sparkles, Check } from 'lucide-react';

interface AuthPageProps {
    onLogin: (user: { email: string; username: string }) => void;
}

type Mode = 'login' | 'registro';

interface FormErrors {
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
}

export function AuthPage({ onLogin }: AuthPageProps) {
    const [mode, setMode] = useState<Mode>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const [form, setForm] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });

    const validate = (): boolean => {
        const errs: FormErrors = {};
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.email) errs.email = 'El correo es obligatorio.';
        else if (!emailRe.test(form.email)) errs.email = 'Ingresá un correo válido.';

        if (mode === 'registro') {
            if (!form.username.trim()) errs.username = 'El nombre de usuario es obligatorio.';
            else if (form.username.trim().length < 3) errs.username = 'Mínimo 3 caracteres.';
        }

        if (!form.password) errs.password = 'La contraseña es obligatoria.';
        else if (form.password.length < 8) errs.password = 'Debe tener al menos 8 caracteres.';

        if (mode === 'registro') {
            if (!form.confirmPassword) errs.confirmPassword = 'Confirmá tu contraseña.';
            else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden.';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            const username = mode === 'login'
                ? form.email.split('@')[0]
                : form.username;
            onLogin({ email: form.email, username });
        }, 900);
    };

    const switchMode = (next: Mode) => {
        setMode(next);
        setErrors({});
        setForm({ email: '', username: '', password: '', confirmPassword: '' });
        setShowPassword(false);
        setShowConfirm(false);
    };

    const field =
        'w-full px-4 py-3 rounded-xl border bg-[#FDFBF8] text-[#2A2825] text-sm placeholder-[#B0A89F] focus:outline-none transition-colors';
    const fieldOk = 'border-[#DDD5C8] focus:border-[#7A3B3B]';
    const fieldErr = 'border-red-300 focus:border-red-400 bg-red-50/30';

    const passwordStrength = (pw: string) => {
        if (!pw) return 0;
        let s = 0;
        if (pw.length >= 8) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9]/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        return s;
    };
    const strength = passwordStrength(form.password);
    const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

    return (
        <div className="min-h-screen bg-[#F7F4F0] flex">
            {/* Left panel — decorative */}
            <div
                className="hidden lg:flex flex-col justify-between w-[46%] relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #2A2825 0%, #3C3530 55%, #7A3B3B 100%)' }}
            >
                {/* Subtle texture overlay */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
                        backgroundSize: '12px 12px',
                    }}
                />

                <div className="relative z-10 p-12">
                    <div className="flex flex-col gap-1">
                        <span className="font-bold tracking-[0.22em] uppercase text-2xl text-white leading-none">
                            Centro<span className="text-[#C48E8E]"> Estético</span>
                        </span>
                        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A89E94]">Tu belleza, nuestra pasión</span>
                    </div>
                </div>

                <div className="relative z-10 px-12 pb-16 flex flex-col gap-10">
                    <div className="flex flex-col gap-5">
                        {[
                            { icon: '✦', text: 'Reservá turnos online en segundos' },
                            { icon: '✦', text: 'Acumulá estampitas y canjeá premios' },
                            { icon: '✦', text: 'Consultá con nuestra IA especializada' },
                            { icon: '✦', text: 'Explorá nuestro catálogo de productos' },
                        ].map((item) => (
                            <div key={item.text} className="flex items-start gap-3">
                                <span className="text-[#C48E8E] text-xs mt-0.5 shrink-0">{item.icon}</span>
                                <p className="text-[#D6CFC8] text-sm leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-8">
                        <p className="text-[#8A8078] text-xs leading-relaxed italic">
                            "El cuidado de la piel es un acto de amor propio.<br />Aquí encontrás todo lo que necesitás."
                        </p>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-[420px]">

                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-10">
                        <span className="font-bold tracking-[0.18em] uppercase text-xl text-[#2A2825]">
                            Centro<span className="text-[#7A3B3B]"> Estético</span>
                        </span>
                    </div>

                    {/* Mode tabs */}
                    <div className="flex gap-0 mb-8 bg-[#EDE8E1] rounded-2xl p-1">
                        {(['login', 'registro'] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${mode === m
                                        ? 'bg-white text-[#2A2825] shadow-sm'
                                        : 'text-[#8A7F74] hover:text-[#5C534A]'
                                    }`}
                            >
                                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                            </button>
                        ))}
                    </div>

                    <div className="mb-7">
                        <h1 className="text-2xl font-bold text-[#2A2825] tracking-tight">
                            {mode === 'login' ? 'Bienvenida de nuevo' : 'Creá tu cuenta'}
                        </h1>
                        <p className="text-sm text-[#8A7F74] mt-1">
                            {mode === 'login'
                                ? 'Ingresá a tu espacio personal'
                                : 'Empezá tu experiencia de bienestar'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                        {/* Email */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold tracking-wider uppercase text-[#5C534A]">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="tu@correo.com"
                                value={form.email}
                                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                className={`${field} ${errors.email ? fieldErr : fieldOk}`}
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
                        </div>

                        {/* Username — registro only */}
                        {mode === 'registro' && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold tracking-wider uppercase text-[#5C534A]">
                                    Nombre de usuario
                                </label>
                                <input
                                    type="text"
                                    autoComplete="username"
                                    placeholder="ej. maria_belleza"
                                    value={form.username}
                                    onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                                    className={`${field} ${errors.username ? fieldErr : fieldOk}`}
                                />
                                {errors.username && <p className="text-xs text-red-500 mt-0.5">{errors.username}</p>}
                            </div>
                        )}

                        {/* Password */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold tracking-wider uppercase text-[#5C534A]">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    placeholder="Mínimo 8 caracteres"
                                    value={form.password}
                                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                    className={`${field} pr-11 ${errors.password ? fieldErr : fieldOk}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A89E94] hover:text-[#7A3B3B] transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>}

                            {/* Strength bar — registro only */}
                            {mode === 'registro' && form.password.length > 0 && (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : 'bg-[#DDD5C8]'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className={`text-[11px] font-medium ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-amber-500' : 'text-emerald-600'
                                        }`}>
                                        {strengthLabel[strength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm password — registro only */}
                        {mode === 'registro' && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold tracking-wider uppercase text-[#5C534A]">
                                    Confirmar contraseña
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
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    {form.confirmPassword && form.password === form.confirmPassword && (
                                        <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    )}
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword}</p>
                                )}
                            </div>
                        )}

                        {/* Forgot password */}
                        {mode === 'login' && (
                            <div className="flex justify-end -mt-1">
                                <button
                                    type="button"
                                    className="text-xs text-[#7A3B3B] hover:underline transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#3C3530] hover:bg-[#2A2825] text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {mode === 'login' ? 'Ingresando...' : 'Creando cuenta...'}
                                </span>
                            ) : (
                                <>
                                    {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        {/* Terms — registro */}
                        {mode === 'registro' && (
                            <p className="text-center text-xs text-[#A89E94] leading-relaxed">
                                Al registrarte aceptás nuestros{' '}
                                <button type="button" className="text-[#7A3B3B] hover:underline">
                                    Términos de uso
                                </button>{' '}
                                y{' '}
                                <button type="button" className="text-[#7A3B3B] hover:underline">
                                    Política de privacidad
                                </button>
                                .
                            </p>
                        )}
                    </form>

                    {/* Switch link */}
                    <p className="text-center text-sm text-[#8A7F74] mt-8">
                        {mode === 'login' ? '¿Todavía no tenés cuenta?' : '¿Ya tenés una cuenta?'}{' '}
                        <button
                            onClick={() => switchMode(mode === 'login' ? 'registro' : 'login')}
                            className="font-semibold text-[#7A3B3B] hover:underline"
                        >
                            {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
                        </button>
                    </p>

                    {/* Demo shortcut */}
                    <div className="mt-6 p-3 rounded-xl bg-[#EDE8E1] border border-[#DDD5C8]">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#7A3B3B]" />
                            <span className="text-xs font-semibold text-[#5C534A] tracking-wide">Demo rápido</span>
                        </div>
                        <p className="text-xs text-[#8A7F74] mb-2">Ingresá con datos de prueba para explorar la plataforma.</p>
                        <button
                            type="button"
                            onClick={() => onLogin({ email: 'demo@centrostetico.com', username: 'demo_user' })}
                            className="w-full py-2 rounded-lg bg-white border border-[#DDD5C8] text-xs font-medium text-[#5C534A] hover:border-[#7A3B3B] hover:text-[#7A3B3B] transition-colors"
                        >
                            Entrar como invitado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
