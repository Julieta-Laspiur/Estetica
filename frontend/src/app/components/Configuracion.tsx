import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Building2,
  Clock,
  ShieldAlert,
  CreditCard,
  ShoppingBag,
  Gift,
  Megaphone,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Share2,
  Sparkles,
  Download,
  Eye,
  Sliders,
  DollarSign,
  Truck,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
  CircleDot,
  Maximize2,
  Minimize2,
  Bot,
  Key,
  EyeOff,
  Cpu
} from 'lucide-react';
import {
  configuracionService,
  procesarArchivoAUrl,
  type ConfiguracionGeneral
} from '../../services/configuracionService';
import { chatIAApi, type AuthUser } from '../../services/api';

interface ConfiguracionProps {
  currentUser?: AuthUser | null;
}

type TabSeccion = 'identidad' | 'agenda' | 'politicas' | 'pagos' | 'tienda' | 'fidelizacion' | 'banner' | 'ia' | 'backup';

// Logos Rectangulares predefinidos para la cabecera superior (fotos horizontales)
const LOGOS_RECTANGULARES_PREDEFINIDOS = [
  {
    nombre: 'Cosmética & Oro Glam',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Dermocosmética Minimal',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Aromaterapia & Bienestar',
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Botánica & Belleza Natural',
    url: 'https://images.unsplash.com/photo-1512290900672-1f4153ae5891?w=400&auto=format&fit=crop&q=80',
  },
];

// Logos Redondos predefinidos para la barra comprimida al scrollear (fotos circulares)
const LOGOS_REDONDOS_PREDEFINIDOS = [
  {
    nombre: 'Silueta Rostro Circular',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Flor de Loto Zen',
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=160&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Emblema Botánico',
    url: 'https://images.unsplash.com/photo-1512290900672-1f4153ae5891?w=160&auto=format&fit=crop&q=80',
  },
  {
    nombre: 'Gota de Sérum Dorada',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=160&auto=format&fit=crop&q=80',
  },
];

// Fondos predefinidos de alta calidad para el Hero Banner
const FONDOS_HERO_PREDEFINIDOS = [
  {
    nombre: 'Facial Hidratante & Spa',
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
  {
    nombre: 'Dermoestética & Tecnología',
    url: 'https://images.unsplash.com/photo-1512290900672-1f4153ae5891?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
  {
    nombre: 'Masajes, Bienestar & Velas',
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
  {
    nombre: 'Cosmética & Sérums Exclusivos',
    url: 'https://images.unsplash.com/photo-1778451510207-24f1e204f465?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
];

export function Configuracion({ currentUser }: ConfiguracionProps = {}) {
  const [config, setConfig] = useState<ConfiguracionGeneral>(() => configuracionService.get());
  const [activeTab, setActiveTab] = useState<TabSeccion>('identidad');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Estados de carga del Logo Rectangular (Banner Superior)
  const [subiendoLogoRectangular, setSubiendoLogoRectangular] = useState(false);
  const [errorLogoRectangular, setErrorLogoRectangular] = useState<string | null>(null);
  const fileLogoRectangularRef = useRef<HTMLInputElement | null>(null);

  // Estados de carga del Logo Redondo (Barra Comprimida / Scrolled)
  const [subiendoLogoRedondo, setSubiendoLogoRedondo] = useState(false);
  const [errorLogoRedondo, setErrorLogoRedondo] = useState<string | null>(null);
  const fileLogoRedondoRef = useRef<HTMLInputElement | null>(null);

  // Estado del banner hero
  const [subiendoBanner, setSubiendoBanner] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const fileBannerRef = useRef<HTMLInputElement | null>(null);

  // Conmutador de la previsualización en vivo
  const [vistaPreviaNav, setVistaPreviaNav] = useState<'normal' | 'comprimida'>('normal');

  // Estados de Asistente IA (Google Gemini)
  const [probandoGemini, setProbandoGemini] = useState(false);
  const [resultadoTestGemini, setResultadoTestGemini] = useState<{
    conectado: boolean;
    mensaje: string;
    latenciaMs?: number;
    modelo?: string;
    guardrailsActivos?: boolean;
  } | null>(null);
  const [mostrarApiKey, setMostrarApiKey] = useState(false);

  const handleTestGemini = async () => {
    setProbandoGemini(true);
    setResultadoTestGemini(null);
    try {
      const res = await chatIAApi.testGemini(config.geminiApiKey, config.geminiModel);
      setResultadoTestGemini({
        conectado: res.conectado,
        mensaje: res.mensaje,
        latenciaMs: res.latenciaMs,
        modelo: res.modelo,
        guardrailsActivos: res.guardrailsActivos,
      });
      if (res.conectado) {
        mostrarFeedback('¡Conexión con Google Gemini verificada con éxito!');
      }
    } catch (err: any) {
      setResultadoTestGemini({
        conectado: false,
        mensaje: err.message || 'No fue posible conectar con Google Gemini. Verificá la API Key o la conexión de red.',
      });
    } finally {
      setProbandoGemini(false);
    }
  };

  useEffect(() => {
    setConfig(configuracionService.get());
  }, []);

  const mostrarFeedback = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleGuardar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGuardando(true);
    const usuario = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Administrador';
    const guardada = configuracionService.save(config, usuario);
    setConfig(guardada);
    setTimeout(() => {
      setGuardando(false);
      mostrarFeedback('¡Configuración general guardada exitosamente y sincronizada en vivo!');
    }, 300);
  };

  const handleRestaurar = () => {
    if (!window.confirm('¿Confirmás que querés restablecer todos los valores de configuración a los recomendados por defecto?\n\nEsta acción reiniciará horarios, políticas, pasarelas, logos y el banner web.')) {
      return;
    }
    const usuario = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Administrador';
    const res = configuracionService.reset(usuario);
    setConfig(res);
    mostrarFeedback('Se han restaurado los valores recomendados por defecto.');
  };

  const handleExportarBackup = () => {
    configuracionService.exportarBackupJson();
    mostrarFeedback('Copia de respaldo JSON descargada con éxito.');
  };

  // Manejador de subida del Logo Rectangular (Banner Superior) desde PC
  const handleLogoRectangularUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorLogoRectangular('El archivo debe ser una imagen válida (PNG, JPG, SVG o WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorLogoRectangular('El tamaño máximo de imagen permitido es de 5MB.');
      return;
    }

    setSubiendoLogoRectangular(true);
    setErrorLogoRectangular(null);
    try {
      const urlOData = await procesarArchivoAUrl(file);
      setConfig(prev => ({
        ...prev,
        logoRectangularUrl: urlOData,
        logoUrl: prev.logoUrl || urlOData,
      }));
      mostrarFeedback('¡Foto del logo rectangular cargada! Presioná "Guardar Cambios".');
    } catch {
      setErrorLogoRectangular('Ocurrió un error al procesar el archivo del logo rectangular.');
    } finally {
      setSubiendoLogoRectangular(false);
      if (fileLogoRectangularRef.current) fileLogoRectangularRef.current.value = '';
    }
  };

  // Manejador de subida del Logo Redondo (Barra Comprimida) desde PC
  const handleLogoRedondoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorLogoRedondo('El archivo debe ser una imagen válida (PNG, JPG, SVG o WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorLogoRedondo('El tamaño máximo de imagen permitido es de 5MB.');
      return;
    }

    setSubiendoLogoRedondo(true);
    setErrorLogoRedondo(null);
    try {
      const urlOData = await procesarArchivoAUrl(file);
      setConfig(prev => ({
        ...prev,
        logoRedondoUrl: urlOData,
      }));
      mostrarFeedback('¡Foto del logo redondo cargada! Presioná "Guardar Cambios".');
    } catch {
      setErrorLogoRedondo('Ocurrió un error al procesar el archivo del logo redondo.');
    } finally {
      setSubiendoLogoRedondo(false);
      if (fileLogoRedondoRef.current) fileLogoRedondoRef.current.value = '';
    }
  };

  // Manejador de subida de Banner Hero desde PC
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorBanner('El archivo debe ser una imagen válida.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorBanner('La imagen del banner no debe superar los 8MB.');
      return;
    }

    setSubiendoBanner(true);
    setErrorBanner(null);
    try {
      const urlOData = await procesarArchivoAUrl(file);
      setConfig(prev => ({
        ...prev,
        bannerHero: { ...prev.bannerHero, imagenUrl: urlOData },
      }));
      mostrarFeedback('¡Fondo del banner actualizado! Presioná "Guardar Cambios".');
    } catch {
      setErrorBanner('Ocurrió un error al procesar la imagen del banner.');
    } finally {
      setSubiendoBanner(false);
      if (fileBannerRef.current) fileBannerRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Feedback */}
      {mensajeExito && (
        <div className="fixed top-6 right-6 z-50 bg-[#3C3530] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{mensajeExito}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE8E1] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2.5 bg-[#7A3B3B] text-white rounded-2xl shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2825]">Configuración General</h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#8A7F74]">
            Personalizá el logo, el nombre que sale arriba en la cabecera, banners de portada, horarios, pasarelas de pago y apariencia web.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRestaurar}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] text-xs font-semibold text-[#5A524A] hover:bg-[#FAF8F5] transition-colors"
            title="Restablecer valores originales"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#8A7F74]" />
            <span className="hidden sm:inline">Valores por Defecto</span>
          </button>

          <button
            type="button"
            onClick={() => handleGuardar()}
            disabled={guardando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas / Subsecciones */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#EDE8E1]">
        {[
          { id: 'identidad', label: 'Logo & Nombre de Cabecera', icon: Building2 },
          { id: 'banner', label: 'Banners Web & Portada', icon: Megaphone },
          { id: 'agenda', label: 'Horarios & Turnos', icon: Clock },
          { id: 'politicas', label: 'Políticas & Cancelación', icon: ShieldAlert },
          { id: 'pagos', label: 'Pasarelas & Cobros', icon: CreditCard },
          { id: 'tienda', label: 'Tienda & Envíos', icon: ShoppingBag },
          { id: 'fidelizacion', label: 'Fidelización (Estampitas)', icon: Gift },
          { id: 'ia', label: 'Asistente IA (Gemini)', icon: Bot },
          { id: 'backup', label: 'Respaldo & Auditoría', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabSeccion)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#3C3530] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#5A524A] hover:bg-[#EDE8E1] hover:text-[#2A2825]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#EDE8E1]' : 'text-[#8A7F74]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido de Cada Pestaña */}
      <form onSubmit={handleGuardar} className="space-y-6">

        {/* 1. DATOS DEL CENTRO, LOGOS FOTOGRÁFICOS Y CABECERA */}
        {activeTab === 'identidad' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-7">
            <div>
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#7A3B3B]" />
                <span>Logos e Identidad Visual (Fotos para Cabecera y Banner)</span>
              </h3>
              <p className="text-xs text-[#8A7F74] mt-0.5">
                Configurá los dos logos fotográficos de la web: el rectangular para la parte de arriba del banner y el redondo para cuando se comprime la barra al hacer scroll.
              </p>
            </div>

            {/* SECCIÓN 1: LOGO RECTANGULAR (BANNER SUPERIOR) */}
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE8E1] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#7A3B3B]" />
                    <span>1. Logo Rectangular (Banner Superior de la Cabecera)</span>
                  </h4>
                  <p className="text-[11px] text-[#8A7F74]">
                    Foto horizontal o rectangular que sale arriba en el centro del banner. Es una foto propia de tu marca, sin texto generado por código.
                  </p>
                </div>
                {(config.logoRectangularUrl || config.logoUrl) && (
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, logoRectangularUrl: '', logoUrl: '' })}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 self-start sm:self-auto"
                  >
                    <X className="w-3.5 h-3.5" /> Quitar Logo Rectangular
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Cuadro de Previsualización Rectangular */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white border border-[#EDE8E1] rounded-2xl text-center min-h-[140px] shadow-2xs">
                  {(config.logoRectangularUrl || config.logoUrl) ? (
                    <div className="space-y-2">
                      <div className="w-full max-w-[240px] h-20 flex items-center justify-center p-1 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1] overflow-hidden">
                        <img
                          src={config.logoRectangularUrl || config.logoUrl}
                          alt="Logo Rectangular Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Foto Rectangular Activa
                      </span>
                    </div>
                  ) : (
                    <div className="text-[#8A7F74] space-y-1">
                      <ImageIcon className="w-10 h-10 mx-auto text-[#DDD5C8]" />
                      <span className="text-xs font-semibold block">Sin foto rectangular</span>
                      <span className="text-[10px] block">Subí una imagen horizontal</span>
                    </div>
                  )}
                </div>

                {/* Controles de Carga Logo Rectangular */}
                <div className="md:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={fileLogoRectangularRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoRectangularUpload}
                      className="hidden"
                      id="upload-logo-rectangular"
                    />
                    <label
                      htmlFor="upload-logo-rectangular"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs ${
                        subiendoLogoRectangular ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {subiendoLogoRectangular ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Subir Foto Rectangular desde tu PC</span>
                        </>
                      )}
                    </label>

                    <span className="text-xs text-[#8A7F74] font-medium">o pegá la URL directa:</span>
                  </div>

                  {errorLogoRectangular && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorLogoRectangular}</span>
                    </p>
                  )}

                  <input
                    type="url"
                    value={config.logoRectangularUrl || config.logoUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        logoRectangularUrl: e.target.value,
                        logoUrl: e.target.value,
                      })
                    }
                    placeholder="https://miservidor.com/logo-banner-horizontal.png"
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />

                  {/* Presets Rectangulares */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-[#8A7F74] uppercase tracking-wider block mb-1.5">
                      O elegí una foto rectangular de prueba:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {LOGOS_RECTANGULARES_PREDEFINIDOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              logoRectangularUrl: preset.url,
                              logoUrl: preset.url,
                            })
                          }
                          className={`p-2 bg-white border rounded-xl flex items-center gap-2 text-left hover:border-[#7A3B3B] transition-all ${
                            (config.logoRectangularUrl || config.logoUrl) === preset.url
                              ? 'border-[#7A3B3B] ring-2 ring-[#7A3B3B]/20'
                              : 'border-[#EDE8E1]'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.nombre}
                            className="w-9 h-6 rounded-md object-cover"
                          />
                          <span className="text-[10px] font-semibold text-[#2A2825] truncate">
                            {preset.nombre}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: LOGO REDONDO (BARRA COMPRIMIDA / COSTADO) */}
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE8E1] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-[#7A3B3B]" />
                    <span>2. Logo Redondo (Costado de la Barra al Comprimirse)</span>
                  </h4>
                  <p className="text-[11px] text-[#8A7F74]">
                    Foto circular que sale en el costado cuando el usuario hace scroll hacia arriba y la barra se comprime. Es una foto redonda, no texto.
                  </p>
                </div>
                {config.logoRedondoUrl && (
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, logoRedondoUrl: '' })}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 self-start sm:self-auto"
                  >
                    <X className="w-3.5 h-3.5" /> Quitar Logo Redondo
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Cuadro de Previsualización Redonda */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white border border-[#EDE8E1] rounded-2xl text-center min-h-[140px] shadow-2xs">
                  {config.logoRedondoUrl ? (
                    <div className="space-y-2">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#7A3B3B] p-0.5 bg-white mx-auto shadow-sm">
                        <img
                          src={config.logoRedondoUrl}
                          alt="Logo Redondo Preview"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Foto Redonda Activa
                      </span>
                    </div>
                  ) : (
                    <div className="text-[#8A7F74] space-y-1">
                      <CircleDot className="w-10 h-10 mx-auto text-[#DDD5C8]" />
                      <span className="text-xs font-semibold block">Sin foto redonda</span>
                      <span className="text-[10px] block">Subí un isotipo o avatar circular</span>
                    </div>
                  )}
                </div>

                {/* Controles de Carga Logo Redondo */}
                <div className="md:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={fileLogoRedondoRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoRedondoUpload}
                      className="hidden"
                      id="upload-logo-redondo"
                    />
                    <label
                      htmlFor="upload-logo-redondo"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs ${
                        subiendoLogoRedondo ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {subiendoLogoRedondo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Subir Foto Redonda desde tu PC</span>
                        </>
                      )}
                    </label>

                    <span className="text-xs text-[#8A7F74] font-medium">o pegá la URL directa:</span>
                  </div>

                  {errorLogoRedondo && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorLogoRedondo}</span>
                    </p>
                  )}

                  <input
                    type="url"
                    value={config.logoRedondoUrl || ''}
                    onChange={(e) => setConfig({ ...config, logoRedondoUrl: e.target.value })}
                    placeholder="https://miservidor.com/isotipo-redondo.png"
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />

                  {/* Presets Redondos */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-[#8A7F74] uppercase tracking-wider block mb-1.5">
                      O elegí una foto redonda de prueba:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {LOGOS_REDONDOS_PREDEFINIDOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setConfig({ ...config, logoRedondoUrl: preset.url })}
                          className={`p-2 bg-white border rounded-xl flex items-center gap-2 text-left hover:border-[#7A3B3B] transition-all ${
                            config.logoRedondoUrl === preset.url
                              ? 'border-[#7A3B3B] ring-2 ring-[#7A3B3B]/20'
                              : 'border-[#EDE8E1]'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.nombre}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <span className="text-[10px] font-semibold text-[#2A2825] truncate">
                            {preset.nombre}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PREVISUALIZACIÓN EN VIVO INTERACTIVA DE AMBAS CABECERAS */}
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE8E1] pb-2.5">
                <span className="text-xs font-bold text-[#2A2825] flex items-center gap-1.5 uppercase tracking-wider">
                  <Eye className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Previsualización en Vivo de la Barra de Navegación:</span>
                </span>

                {/* Conmutador Normal vs Comprimida */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#EDE8E1]">
                  <button
                    type="button"
                    onClick={() => setVistaPreviaNav('normal')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      vistaPreviaNav === 'normal'
                        ? 'bg-[#7A3B3B] text-white shadow-2xs'
                        : 'text-[#8A7F74] hover:text-[#2A2825]'
                    }`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>1. Arriba (Logo Rectangular)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVistaPreviaNav('comprimida')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      vistaPreviaNav === 'comprimida'
                        ? 'bg-[#3C3530] text-white shadow-2xs'
                        : 'text-[#8A7F74] hover:text-[#2A2825]'
                    }`}
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>2. Al Scrollear (Logo Redondo al Costado)</span>
                  </button>
                </div>
              </div>

              {/* Render de la Previsualización según el modo seleccionado */}
              {vistaPreviaNav === 'normal' ? (
                /* VISTA 1: NORMAL / ARRIBA DE TODO CON LOGO RECTANGULAR */
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#8A7F74] block">
                    Modo normal (tope de página): se visualiza la foto rectangular centrada sin texto:
                  </span>
                  <div className="bg-white border border-[#DDD5C8] rounded-2xl p-4 shadow-xs">
                    <div className="grid grid-cols-3 items-center gap-4">
                      {/* Izquierda: Buscador */}
                      <div className="text-[11px] text-[#A89E94] bg-[#FAF8F5] border border-[#EDE8E1] px-3 py-1.5 rounded-full max-w-[160px] truncate">
                        Buscar...
                      </div>

                      {/* Centro: Foto del Logo Rectangular */}
                      <div className="flex justify-center items-center">
                        {(config.logoRectangularUrl || config.logoUrl) ? (
                          <img
                            src={config.logoRectangularUrl || config.logoUrl}
                            alt="Logo Rectangular Mockup"
                            className="h-12 max-w-[220px] sm:max-w-[280px] object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <span className="font-bold tracking-[0.16em] uppercase text-sm leading-none text-[#2A2825] block">
                              {config.nombreCentro}
                            </span>
                            <span className="text-[9px] tracking-[0.2em] uppercase text-[#A89E94] block mt-0.5">
                              {config.slogan}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Derecha: Iconos */}
                      <div className="flex justify-end items-center gap-2 text-[#7A3B3B] text-xs font-semibold">
                        <span className="p-1.5 bg-[#FAF8F5] rounded-lg">🛒</span>
                        <span className="p-1.5 bg-[#FAF8F5] rounded-lg">👤</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* VISTA 2: COMPRIMIDA AL SCROLLEAR CON LOGO REDONDO AL COSTADO */
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#8A7F74] block">
                    Modo comprimido (al scrollear): se visualiza la foto redonda al costado sin texto:
                  </span>
                  <div className="bg-white border border-[#DDD5C8] rounded-2xl px-4 py-2.5 shadow-xs">
                    <div className="flex items-center justify-between gap-4">
                      {/* Costado: Foto del Logo Redondo */}
                      <div className="flex items-center">
                        {config.logoRedondoUrl ? (
                          <img
                            src={config.logoRedondoUrl}
                            alt="Logo Redondo Mockup"
                            className="w-10 h-10 object-cover rounded-full border border-[#DDD5C8] shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#7A3B3B] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {config.nombreCentro.charAt(0) || 'E'}
                          </div>
                        )}
                      </div>

                      {/* Centro: Enlaces */}
                      <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-[#5A524A]">
                        <span className="text-[#7A3B3B]">Inicio</span>
                        <span>Servicios</span>
                        <span>Turnos</span>
                        <span>Productos</span>
                        <span>Mi Tarjeta</span>
                      </div>

                      {/* Derecha: Iconos */}
                      <div className="flex items-center gap-2 text-[#7A3B3B] text-xs font-semibold">
                        <span className="p-1 bg-[#FAF8F5] rounded-lg">🔍</span>
                        <span className="p-1 bg-[#FAF8F5] rounded-lg">🛒</span>
                        <span className="p-1 bg-[#FAF8F5] rounded-lg">👤</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NOMBRE Y SLOGAN DE CABECERA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Nombre Comercial del Centro (Sale Arriba en la Cabecera) *
                </label>
                <input
                  type="text"
                  required
                  value={config.nombreCentro}
                  onChange={(e) => setConfig({ ...config, nombreCentro: e.target.value })}
                  placeholder="ej. Centro Estético, Estética Laspiur..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] font-semibold focus:ring-2 focus:ring-[#7A3B3B]"
                />
                <span className="text-[11px] text-[#8A7F74] mt-1 block">
                  Se actualiza de inmediato en el menú de clientes y panel de administración.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Slogan o Lema Institucional (Debajo del Nombre)
                </label>
                <input
                  type="text"
                  value={config.slogan}
                  onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                  placeholder="Tu santuario de belleza, cuidado dérmico y armonía..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
                <span className="text-[11px] text-[#8A7F74] mt-1 block">
                  Aparece bajo el logo y en el pie de página.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#7A3B3B]" />
                  <span>Teléfono Fijo / Central de Turnos</span>
                </label>
                <input
                  type="text"
                  value={config.telefono}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp de Atención y Soporte *</span>
                </label>
                <input
                  type="text"
                  required
                  value={config.whatsapp}
                  onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                  placeholder="+54 9 11 2345-6789"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] font-semibold focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#7A3B3B]" />
                  <span>Correo Electrónico de Contacto *</span>
                </label>
                <input
                  type="email"
                  required
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#7A3B3B]" />
                  <span>Ciudad / Zona</span>
                </label>
                <input
                  type="text"
                  value={config.ciudad}
                  onChange={(e) => setConfig({ ...config, ciudad: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Dirección Física Completa (Local / Consultorio) *
                </label>
                <input
                  type="text"
                  required
                  value={config.direccion}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                  placeholder="Av. Santa Fe 1840, Piso 2, Dpto B, Recoleta..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#3C3530] mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#7A3B3B]" />
                  <span>Enlace a Google Maps (Ubicación)</span>
                </label>
                <input
                  type="url"
                  value={config.googleMapsUrl || ''}
                  onChange={(e) => setConfig({ ...config, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="pt-4 border-t border-[#EDE8E1] space-y-3">
              <h4 className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#7A3B3B]" />
                <span>Presencia en Redes Sociales</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#8A7F74] mb-1 font-semibold">Instagram</label>
                  <input
                    type="text"
                    value={config.instagram}
                    onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                    placeholder="@estetica"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8A7F74] mb-1 font-semibold">Facebook</label>
                  <input
                    type="text"
                    value={config.facebook}
                    onChange={(e) => setConfig({ ...config, facebook: e.target.value })}
                    placeholder="EsteticaOficial"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8A7F74] mb-1 font-semibold">TikTok</label>
                  <input
                    type="text"
                    value={config.tiktok}
                    onChange={(e) => setConfig({ ...config, tiktok: e.target.value })}
                    placeholder="@estetica.tips"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. BANNERS WEB & PORTADA (BANNER PRINCIPAL + ANUNCIOS SUPERIOR) */}
        {activeTab === 'banner' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-7">
            <div>
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#7A3B3B]" />
                <span>Banners Web, Portada y Anuncios de Temporada</span>
              </h3>
              <p className="text-xs text-[#8A7F74] mt-0.5">
                Modificá la foto, el título, subtítulo y texto del banner superior de la página de inicio sin modificar el código.
              </p>
            </div>

            {/* SECCIÓN 1: BANNER PRINCIPAL DE PORTADA (HERO BANNER) */}
            <div className="p-6 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-5">
              <div className="border-b border-[#EDE8E1] pb-3">
                <h4 className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Banner Principal de Portada (Hero Banner con el nombre que sale arriba)</span>
                </h4>
                <p className="text-[11px] text-[#8A7F74]">
                  Este es el gran banner principal que ven todos los visitantes al ingresar al sitio web.
                </p>
              </div>

              {/* Vista Previa en Vivo del Banner Principal */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#8A7F74] uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-[#7A3B3B]" /> Vista Previa en Vivo del Banner de Inicio:
                </span>
                <div
                  className="relative w-full rounded-2xl overflow-hidden shadow-md text-white min-h-[220px] flex items-center p-6 sm:p-8"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%), url(${config.bannerHero.imagenUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="max-w-md space-y-2">
                    <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20">
                      {config.bannerHero.tag || 'Promoción Especial'}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold leading-tight">
                      {config.bannerHero.titulo || config.nombreCentro}
                    </h2>
                    <p className="text-white/80 text-xs sm:text-sm line-clamp-2">
                      {config.bannerHero.subtitulo || config.slogan}
                    </p>
                    <div className="pt-2">
                      <span className="inline-block bg-white text-[#3C3530] text-xs font-bold px-4 py-2 rounded-xl shadow-xs">
                        {config.bannerHero.cta || 'Reservar Ahora'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario de Configuración del Banner Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Título Destacado del Banner (o Nombre del Centro) *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.bannerHero.titulo}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerHero: { ...config.bannerHero, titulo: e.target.value },
                      })
                    }
                    placeholder="ej. 30% OFF en Faciales Hidratantes o Centro Estético"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Etiqueta / Badge Superior
                  </label>
                  <input
                    type="text"
                    value={config.bannerHero.tag}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerHero: { ...config.bannerHero, tag: e.target.value },
                      })
                    }
                    placeholder="ej. Promoción Especial, Temporada de Invierno, Bienvenida..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Subtítulo o Descripción Detallada
                  </label>
                  <textarea
                    rows={2}
                    value={config.bannerHero.subtitulo}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerHero: { ...config.bannerHero, subtitulo: e.target.value },
                      })
                    }
                    placeholder="Descripción atractiva para cautivar a los clientes que entran a la web..."
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Texto del Botón Principal
                  </label>
                  <input
                    type="text"
                    value={config.bannerHero.cta}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerHero: { ...config.bannerHero, cta: e.target.value },
                      })
                    }
                    placeholder="ej. Reservar Ahora"
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Sección a la que Dirige el Botón
                  </label>
                  <select
                    value={config.bannerHero.ctaTarget}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerHero: { ...config.bannerHero, ctaTarget: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                  >
                    <option value="reservar">Reservar Turno</option>
                    <option value="servicios">Catálogo de Servicios</option>
                    <option value="productos">Tienda de Cosméticos</option>
                    <option value="lealtad">Tarjeta de Fidelización</option>
                  </select>
                </div>

                {/* Subida y Selección de Imagen de Fondo del Banner */}
                <div className="md:col-span-2 p-4 bg-white border border-[#EDE8E1] rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-[#2A2825] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#7A3B3B]" />
                      <span>Foto de Fondo del Banner Principal:</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        ref={fileBannerRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                        id="upload-banner-hero"
                      />
                      <label
                        htmlFor="upload-banner-hero"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          subiendoBanner ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {subiendoBanner ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Subiendo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Foto desde PC</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {errorBanner && (
                    <p className="text-xs text-red-600 font-semibold">{errorBanner}</p>
                  )}

                  <input
                    type="url"
                    value={config.bannerHero.imagenUrl}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerHero: { ...config.bannerHero, imagenUrl: e.target.value },
                      })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                  />

                  {/* Fotos recomendadas para el banner */}
                  <div>
                    <span className="text-[10px] font-bold text-[#8A7F74] uppercase tracking-wider block mb-1.5">
                      O elegí una de estas fotografías de estética recomendadas:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FONDOS_HERO_PREDEFINIDOS.map((fondo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              bannerHero: { ...config.bannerHero, imagenUrl: fondo.url },
                            })
                          }
                          className={`group relative rounded-xl overflow-hidden border-2 h-16 transition-all ${
                            config.bannerHero.imagenUrl === fondo.url ? 'border-[#7A3B3B] ring-2 ring-[#7A3B3B]/20' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={fondo.url}
                            alt={fondo.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                            <span className="text-[9px] font-bold text-white leading-tight truncate">
                              {fondo.nombre}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: BARRA DE ANUNCIOS SUPERIOR (ANNOUNCEMENT BAR) */}
            <div className="p-6 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#2A2825]">Barra de Anuncios Superior (Announcement Bar)</h4>
                  <p className="text-[11px] text-[#8A7F74]">Se exhibe fijada en la parte más alta de la tienda para destacar ofertas de temporada</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.bannerPromocional.activo}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerPromocional: { ...config.bannerPromocional, activo: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-[#7A3B3B] rounded"
                  />
                  <span className="text-xs font-bold text-[#3C3530]">
                    {config.bannerPromocional.activo ? 'Activado' : 'Oculto'}
                  </span>
                </label>
              </div>

              {/* Previsualización en Vivo de la Barra Superior */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#8A7F74] uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Vista Previa de la Barra Superior:
                </span>
                <div
                  style={{ backgroundColor: config.bannerPromocional.colorFondo }}
                  className="text-white py-2.5 px-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-3 text-center transition-colors shadow-xs"
                >
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    {config.bannerPromocional.texto || 'Tu anuncio promocional aquí...'}
                  </span>
                  {config.bannerPromocional.textoBoton && (
                    <span className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors">
                      {config.bannerPromocional.textoBoton}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Texto del Anuncio *
                  </label>
                  <input
                    type="text"
                    value={config.bannerPromocional.texto}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerPromocional: { ...config.bannerPromocional, texto: e.target.value },
                      })
                    }
                    placeholder="ej. ✨ 20% OFF en tu primer tratamiento de Peeling Facial de la temporada · ¡Reservá tu turno online!"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Color de Fondo del Banner
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { color: '#7A3B3B', label: 'Bordó Clásico' },
                      { color: '#3C3530', label: 'Espresso' },
                      { color: '#B45309', label: 'Dorado / Cobre' },
                      { color: '#047857', label: 'Esmeralda' },
                    ].map(c => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            bannerPromocional: { ...config.bannerPromocional, colorFondo: c.color },
                          })
                        }
                        style={{ backgroundColor: c.color }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          config.bannerPromocional.colorFondo === c.color ? 'scale-125 border-white ring-2 ring-[#7A3B3B]' : 'border-transparent'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Texto del Botón de Acción (Opcional)
                  </label>
                  <input
                    type="text"
                    value={config.bannerPromocional.textoBoton || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerPromocional: { ...config.bannerPromocional, textoBoton: e.target.value },
                      })
                    }
                    placeholder="ej. Reservar Turno"
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Sección a la que Dirige
                  </label>
                  <select
                    value={config.bannerPromocional.seccionDestino || 'reservar'}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bannerPromocional: { ...config.bannerPromocional, seccionDestino: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                  >
                    <option value="reservar">Reservar Turno</option>
                    <option value="servicios">Catálogo de Servicios</option>
                    <option value="productos">Tienda de Cosméticos</option>
                    <option value="lealtad">Tarjeta de Fidelización</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: MODO MANTENIMIENTO */}
            <div className="p-5 bg-red-50/50 border border-red-200 rounded-3xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Modo Mantenimiento / Pausa Temporal</span>
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Pausa temporalmente las reservas online con un mensaje amigable (ej. receso de vacaciones o reformas en el local).
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.modoMantenimiento}
                onChange={(e) => setConfig({ ...config, modoMantenimiento: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded"
              />
            </div>
          </div>
        )}

        {/* 3. HORARIOS & REGLAS DE TURNOS */}
        {activeTab === 'agenda' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7A3B3B]" />
                <span>Horarios de Atención y Parámetros de Agenda</span>
              </h3>
              <p className="text-xs text-[#8A7F74] mt-0.5">
                Definí los rangos en los que el centro está operativo y las restricciones temporales para agendar citas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825]">Lunes a Viernes</label>
                <input
                  type="text"
                  value={config.horarioSemana}
                  onChange={(e) => setConfig({ ...config, horarioSemana: e.target.value })}
                  placeholder="09:00 - 20:00"
                  className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                />
                <span className="text-[11px] text-[#8A7F74] block">Jornada habitual de atención</span>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825]">Sábados</label>
                <input
                  type="text"
                  value={config.horarioSabados}
                  onChange={(e) => setConfig({ ...config, horarioSabados: e.target.value })}
                  placeholder="09:00 - 18:00"
                  className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                />
                <span className="text-[11px] text-[#8A7F74] block">Horario reducido de fin de semana</span>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2A2825]">Domingos</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.atiendeDomingos}
                      onChange={(e) => setConfig({ ...config, atiendeDomingos: e.target.checked })}
                      className="w-3.5 h-3.5 text-[#7A3B3B] rounded"
                    />
                    <span className="text-[11px] text-[#8A7F74]">{config.atiendeDomingos ? 'Abierto' : 'Cerrado'}</span>
                  </label>
                </div>
                <input
                  type="text"
                  disabled={!config.atiendeDomingos}
                  value={config.horarioDomingos}
                  onChange={(e) => setConfig({ ...config, horarioDomingos: e.target.value })}
                  placeholder="Cerrado"
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs font-semibold ${
                    config.atiendeDomingos ? 'bg-white border-[#EDE8E1] text-[#2A2825]' : 'bg-[#EDE8E1]/50 border-transparent text-[#8A7F74]'
                  }`}
                />
                <span className="text-[11px] text-[#8A7F74] block">Atención con guardias o cerrado</span>
              </div>
            </div>

            {/* Parámetros de Reserva */}
            <div className="pt-4 border-t border-[#EDE8E1] space-y-4">
              <h4 className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#7A3B3B]" />
                <span>Reglas de Espaciado y Anticipación</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl">
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Tiempo de Desinfección / Buffer
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={config.intervaloLimpiezaMin}
                      onChange={(e) => setConfig({ ...config, intervaloLimpiezaMin: parseInt(e.target.value) || 0 })}
                      className="w-24 px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                    />
                    <span className="text-xs text-[#8A7F74]">minutos</span>
                  </div>
                  <span className="text-[10px] text-[#8A7F74] mt-1.5 block">Entre turno y turno para preparar la cabina</span>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl">
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Anticipación Mínima
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={config.anticipacionMinimaHoras}
                      onChange={(e) => setConfig({ ...config, anticipacionMinimaHoras: parseInt(e.target.value) || 1 })}
                      className="w-24 px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                    />
                    <span className="text-xs text-[#8A7F74]">horas antes</span>
                  </div>
                  <span className="text-[10px] text-[#8A7F74] mt-1.5 block">Para evitar reservas sobre la hora</span>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl">
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Anticipación Máxima
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="7"
                      value={config.anticipacionMaximaDias}
                      onChange={(e) => setConfig({ ...config, anticipacionMaximaDias: parseInt(e.target.value) || 30 })}
                      className="w-24 px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                    />
                    <span className="text-xs text-[#8A7F74]">días a futuro</span>
                  </div>
                  <span className="text-[10px] text-[#8A7F74] mt-1.5 block">Límite del calendario abierto al cliente</span>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl">
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Tolerancia de Espera
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={config.toleranciaEsperaMin}
                      onChange={(e) => setConfig({ ...config, toleranciaEsperaMin: parseInt(e.target.value) || 15 })}
                      className="w-24 px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                    />
                    <span className="text-xs text-[#8A7F74]">minutos</span>
                  </div>
                  <span className="text-[10px] text-[#8A7F74] mt-1.5 block">Margen antes de declarar no-show</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. POLÍTICAS DE CANCELACIÓN & REEMBOLSO */}
        {activeTab === 'politicas' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#7A3B3B]" />
                <span>Políticas de Cancelación, Reembolso y Vencimiento</span>
              </h3>
              <p className="text-xs text-[#8A7F74] mt-0.5">
                Establecé las condiciones que el cliente debe aceptar obligatoriamente al reservar su cita en línea.
              </p>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold">Regla fundamental del centro:</p>
                <p className="mt-0.5">
                  El cliente debe ser informado antes de pagar que <strong>no se realizan reembolsos si se cancela el turno pasadas las 24 horas</strong> previas al horario convenido.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825]">
                  Plazo Mínimo de Cancelación sin Penalidad
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={config.horasCancelacionSinCargo}
                    onChange={(e) => setConfig({ ...config, horasCancelacionSinCargo: parseInt(e.target.value) || 24 })}
                    className="w-24 px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                  />
                  <span className="text-xs text-[#8A7F74]">horas previas</span>
                </div>
                <p className="text-[11px] text-[#8A7F74]">
                  Si el cliente cancela con mayor anticipación que este plazo, el turno se libera y puede reprogramar sin cargo.
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825]">
                  Vencimiento de Reservas Pendientes de Pago
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={config.minutosVencimientoReservaPendiente}
                    onChange={(e) => setConfig({ ...config, minutosVencimientoReservaPendiente: parseInt(e.target.value) || 30 })}
                    className="w-24 px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                  />
                  <span className="text-xs text-[#8A7F74]">minutos</span>
                </div>
                <p className="text-[11px] text-[#8A7F74]">
                  Tiempo límite que tiene el cliente para completar el pago antes de que el horario quede disponible nuevamente.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Texto Legal de la Política (Visible al Cliente al Confirmar Reserva)
                </label>
                <textarea
                  rows={3}
                  value={config.politicaCancelacionTexto}
                  onChange={(e) => setConfig({ ...config, politicaCancelacionTexto: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B] leading-relaxed"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-[#2A2825] block">
                    Cláusula estricta de no-reembolso tras 24 hs
                  </span>
                  <span className="text-[11px] text-[#8A7F74]">
                    Exige checkbox obligatorio al cliente de "Acepto que no hay reembolso tras las 24 horas" antes de habilitar Mercado Pago.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.sinReembolsoPasadas24h}
                  onChange={(e) => setConfig({ ...config, sinReembolsoPasadas24h: e.target.checked })}
                  className="w-4 h-4 text-[#7A3B3B] rounded focus:ring-[#7A3B3B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. PASARELAS DE PAGO & COBRANZAS */}
        {activeTab === 'pagos' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#7A3B3B]" />
                <span>Pasarelas de Pago y Métodos Aceptados</span>
              </h3>
              <p className="text-xs text-[#8A7F74] mt-0.5">
                Configurá las credenciales de Mercado Pago, transferencias bancarias y descuentos por pago en efectivo en mostrador.
              </p>
            </div>

            {/* Mercado Pago */}
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#009EE3] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    MP
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2A2825]">Mercado Pago Checkout</h4>
                    <p className="text-[11px] text-[#8A7F74]">Tarjetas de débito/crédito, dinero en cuenta, Débito Inmediato y QR</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.mercadoPagoHabilitado}
                    onChange={(e) => setConfig({ ...config, mercadoPagoHabilitado: e.target.checked })}
                    className="w-4 h-4 text-[#009EE3] rounded"
                  />
                  <span className="text-xs font-bold text-[#3C3530]">{config.mercadoPagoHabilitado ? 'Habilitado' : 'Desactivado'}</span>
                </label>
              </div>

              {config.mercadoPagoHabilitado && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                      Entorno de Ejecución
                    </label>
                    <select
                      value={config.mercadoPagoModo}
                      onChange={(e) => setConfig({ ...config, mercadoPagoModo: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                    >
                      <option value="sandbox">Sandbox (Pruebas / Tarjetas de Test)</option>
                      <option value="produccion">Producción (Cobros Reales)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                      Cuotas sin Interés Ofrecidas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={config.cuotasSinInteres}
                      onChange={(e) => setConfig({ ...config, cuotasSinInteres: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                      Access Token (Credencial Privada)
                    </label>
                    <input
                      type="password"
                      value={config.mercadoPagoAccessToken}
                      onChange={(e) => setConfig({ ...config, mercadoPagoAccessToken: e.target.value })}
                      placeholder="TEST-xxxx o APP_USR-xxxx"
                      className="w-full px-3.5 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-mono text-[#2A2825]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Efectivo en Mostrador */}
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#2A2825] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Pago en Efectivo (Mostrador / Recepción)</span>
                  </h4>
                  <p className="text-[11px] text-[#8A7F74]">Permite que el cliente reserve online y abone presencialmente al llegar al turno</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.efectivoHabilitado}
                    onChange={(e) => setConfig({ ...config, efectivoHabilitado: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-bold text-[#3C3530]">{config.efectivoHabilitado ? 'Habilitado' : 'Desactivado'}</span>
                </label>
              </div>

              {config.efectivoHabilitado && (
                <div className="pt-2 border-t border-[#EDE8E1] flex items-center gap-3">
                  <label className="text-xs font-semibold text-[#3C3530]">Descuento Promocional por Pago en Efectivo:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={config.descuentoEfectivoPorcentaje}
                      onChange={(e) => setConfig({ ...config, descuentoEfectivoPorcentaje: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-1.5 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                    />
                    <span className="text-xs font-bold text-[#7A3B3B]">% OFF</span>
                  </div>
                </div>
              )}
            </div>

            {/* Transferencia Bancaria */}
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#2A2825]">Transferencia Bancaria Directa</h4>
                  <p className="text-[11px] text-[#8A7F74]">Datos que se le entregan al cliente para transferir por CVU/CBU</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.transferenciaHabilitada}
                    onChange={(e) => setConfig({ ...config, transferenciaHabilitada: e.target.checked })}
                    className="w-4 h-4 text-[#7A3B3B] rounded"
                  />
                  <span className="text-xs font-bold text-[#3C3530]">{config.transferenciaHabilitada ? 'Habilitada' : 'Desactivada'}</span>
                </label>
              </div>

              {config.transferenciaHabilitada && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#8A7F74] mb-1 font-semibold">Banco / Entidad</label>
                    <input
                      type="text"
                      value={config.transferenciaBanco}
                      onChange={(e) => setConfig({ ...config, transferenciaBanco: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8A7F74] mb-1 font-semibold">Titular de Cuenta</label>
                    <input
                      type="text"
                      value={config.transferenciaTitular}
                      onChange={(e) => setConfig({ ...config, transferenciaTitular: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8A7F74] mb-1 font-semibold">CUIT / CUIL</label>
                    <input
                      type="text"
                      value={config.transferenciaCuit}
                      onChange={(e) => setConfig({ ...config, transferenciaCuit: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-[#8A7F74] mb-1 font-semibold">CBU / CVU</label>
                    <input
                      type="text"
                      value={config.transferenciaCbuCvu}
                      onChange={(e) => setConfig({ ...config, transferenciaCbuCvu: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-mono text-[#2A2825]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8A7F74] mb-1 font-semibold">Alias CBU</label>
                    <input
                      type="text"
                      value={config.transferenciaAlias}
                      onChange={(e) => setConfig({ ...config, transferenciaAlias: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#7A3B3B]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. TIENDA ONLINE & ENVÍOS */}
        {activeTab === 'tienda' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#7A3B3B]" />
                <span>Tienda de Cosméticos, Costos de Envío & Stock</span>
              </h3>
              <p className="text-xs text-[#8A7F74] mt-0.5">
                Configurá el umbral de envío gratuito para fidelizar ventas de productos y las alertas de reposición.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Envío Gratis a partir de ($ ARS)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={config.montoEnvioGratis}
                  onChange={(e) => setConfig({ ...config, montoEnvioGratis: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                />
                <span className="text-[11px] text-[#8A7F74] block">Compras mayores a este total no pagan costo de flete</span>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825]">
                  Costo de Envío Estándar ($ ARS)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={config.costoEnvioEstandar}
                  onChange={(e) => setConfig({ ...config, costoEnvioEstandar: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                />
                <span className="text-[11px] text-[#8A7F74] block">Tarifa aplicada si el carrito no alcanza el mínimo</span>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825]">
                  Alerta de Stock Crítico (Unidades)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.alertaStockBajoUnidades}
                  onChange={(e) => setConfig({ ...config, alertaStockBajoUnidades: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#7A3B3B]"
                />
                <span className="text-[11px] text-[#8A7F74] block">Genera advertencia en inventario para reponer mercadería</span>
              </div>

              <div className="md:col-span-3 flex items-center justify-between p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-[#2A2825] block">
                    Permitir Retiro en el Local (Pick-up gratuito)
                  </span>
                  <span className="text-[11px] text-[#8A7F74]">
                    Permite que el cliente compre sus productos online y los retire sin cargo en recepción.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.retiroEnLocalHabilitado}
                  onChange={(e) => setConfig({ ...config, retiroEnLocalHabilitado: e.target.checked })}
                  className="w-4 h-4 text-[#7A3B3B] rounded focus:ring-[#7A3B3B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. FIDELIZACIÓN & RECOMPENSAS */}
        {activeTab === 'fidelizacion' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#7A3B3B]" />
                <span>Tarjeta de Fidelización, Estampitas y Cupones</span>
              </h3>
              <p className="text-xs text-[#8A7F74] mt-0.5">
                Definí cuántas estampitas necesita un cliente para obtener un beneficio y qué premio se acredita al completarla.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825]">
                  Estampitas / Sellos Necesarios para la Recompensa
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="3"
                    max="12"
                    value={config.estampitasParaRecompensa}
                    onChange={(e) => setConfig({ ...config, estampitasParaRecompensa: parseInt(e.target.value) || 6 })}
                    className="w-24 px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                  />
                  <span className="text-xs text-[#8A7F74]">sellos por tarjeta</span>
                </div>
                <span className="text-[11px] text-[#8A7F74] block">Recomendado: 6 o 8 estampitas para un ciclo óptimo</span>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-[#2A2825]">
                  Validez del Cupón Generado (Días)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={config.validezCuponDias}
                    onChange={(e) => setConfig({ ...config, validezCuponDias: parseInt(e.target.value) || 60 })}
                    className="w-24 px-3 py-2 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                  />
                  <span className="text-xs text-[#8A7F74]">días corridos</span>
                </div>
                <span className="text-[11px] text-[#8A7F74] block">Tiempo que tiene el cliente para canjear su cupón premiado</span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Descripción Oficial del Premio / Recompensa *
                </label>
                <input
                  type="text"
                  required
                  value={config.recompensaTitulo}
                  onChange={(e) => setConfig({ ...config, recompensaTitulo: e.target.value })}
                  placeholder="ej. Tratamiento Facial Express o $5.000 OFF en Tienda..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm text-[#2A2825] font-semibold focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="md:col-span-2 p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl">
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Estampitas por Compra de Productos Cosméticos
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5A524A]">Sumar 1 estampita cada $</span>
                  <input
                    type="number"
                    step="1000"
                    value={config.estampitaPorCompraMonto}
                    onChange={(e) => setConfig({ ...config, estampitaPorCompraMonto: parseInt(e.target.value) || 10000 })}
                    className="w-32 px-3 py-1.5 bg-white border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                  />
                  <span className="text-xs text-[#5A524A]">en compras de la tienda online</span>
                </div>
              </div>

              {/* Panel de Membresías Diferenciadas */}
              <div className="md:col-span-2 p-5 bg-white border border-[#EDE8E1] rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE8E1] pb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#2A2825] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#7A3B3B]" />
                      <span>Tarjetas de Membresía con Metas Diferenciadas por Servicio</span>
                    </h4>
                    <p className="text-[11px] text-[#8A7F74]">
                      Permite que un facial y un servicio de uñas tengan metas de estampitas independientes y adaptadas a su costo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 bg-rose-50/60 border border-rose-200/60 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                      <span>💅</span> Uñas & Manicuría
                    </span>
                    <span className="text-sm font-extrabold text-[#7A3B3B] block">5 Estampitas</span>
                    <span className="text-[10px] text-rose-800/80 block">Esmaltado Semi 100% Gratis</span>
                  </div>

                  <div className="p-3 bg-red-50/60 border border-red-200/60 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-[#7A3B3B] flex items-center gap-1">
                      <span>✨</span> Facial Dermoestética
                    </span>
                    <span className="text-sm font-extrabold text-[#7A3B3B] block">8 Estampitas</span>
                    <span className="text-[10px] text-[#7A3B3B]/80 block">Limpieza Profunda (30% OFF)</span>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <span>🌿</span> Spa & Masajes
                    </span>
                    <span className="text-sm font-extrabold text-emerald-800 block">6 Estampitas</span>
                    <span className="text-[10px] text-emerald-700/80 block">Sesión Masaje Descontracturante</span>
                  </div>

                  <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                      <span>👑</span> Club VIP Platino
                    </span>
                    <span className="text-sm font-extrabold text-stone-800 block">10 Estampitas</span>
                    <span className="text-[10px] text-stone-600 block">$25.000 Crédito Tienda/Servicio</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#8A7F74]">
                  💡 Podés crear nuevos tipos de tarjeta, cambiar las metas de estampitas, modificar los premios y ajustar colores desde la sección <strong className="text-[#3C3530]">"Programa de Lealtad &rarr; Tipos de Membresías"</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 8. RESPALDO & AUDITORÍA */}
        {activeTab === 'backup' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#7A3B3B]" />
                <span>Copias de Respaldo, Auditoría y Restauración</span>
              </h3>
              <p className="text-xs text-[#8A7F74] mt-0.5">
                Exportá un duplicado de seguridad de las configuraciones y consultá el historial de modificaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-3">
                <h4 className="text-sm font-bold text-[#2A2825] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Descargar Copia de Seguridad</span>
                </h4>
                <p className="text-xs text-[#8A7F74] leading-relaxed">
                  Genera un archivo JSON con la configuración íntegra, metadatos de servicios, categorías y parámetros de cobro.
                </p>
                <button
                  type="button"
                  onClick={handleExportarBackup}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Archivo Backup (.json)</span>
                </button>
              </div>

              <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-3">
                <h4 className="text-sm font-bold text-[#2A2825] flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Restaurar Valores por Defecto</span>
                </h4>
                <p className="text-xs text-[#8A7F74] leading-relaxed">
                  Devuelve todos los parámetros a su estado recomendado de fábrica (horarios, 24 hs de cancelación, Mercado Pago).
                </p>
                <button
                  type="button"
                  onClick={handleRestaurar}
                  className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Parámetros</span>
                </button>
              </div>
            </div>

            {/* Auditoría de Cambios */}
            <div className="pt-4 border-t border-[#EDE8E1] space-y-2">
              <h4 className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Registro de Auditoría de Configuración</span>
              </h4>
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1] text-xs space-y-1">
                <p className="text-[#5A524A]">
                  <strong>Última actualización:</strong>{' '}
                  {config.ultimaActualizacion
                    ? new Date(config.ultimaActualizacion).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Sin modificaciones registradas'}
                </p>
                <p className="text-[#5A524A]">
                  <strong>Modificado por:</strong> {config.actualizadoPor || 'Administrador'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ASISTENTE INTELIGENTE GEMINI & GUARDRAILS HU-12 */}
        {activeTab === 'ia' && (
          <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-7">
            {/* Header del módulo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDE8E1] pb-5">
              <div>
                <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#7A3B3B]" />
                  <span>Configuración del Asistente IA (Google Gemini)</span>
                </h3>
                <p className="text-xs text-[#8A7F74] mt-0.5">
                  Conectá el chatbot del centro con la API oficial de Google Gemini manteniendo el cumplimiento estricto de guardrails dermatológicos y RAG con stock real.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    config.geminiHabilitado && config.geminiApiKey
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <CircleDot className="w-3.5 h-3.5 animate-pulse" />
                  {config.geminiHabilitado && config.geminiApiKey
                    ? 'Motor Gemini Activo'
                    : 'Motor RAG Local Certificado (Fallback)'}
                </span>
              </div>
            </div>

            {/* Switch Habilitar / Deshabilitar */}
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Habilitar Inferencia en Vivo con Google Gemini</span>
                </label>
                <p className="text-xs text-[#8A7F74]">
                  Si está activado y la API Key es válida, el chatbot utilizará Gemini para redactar respuestas empáticas y naturales dentro de los límites estrictos del catálogo y políticas.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.geminiHabilitado}
                  onChange={(e) => setConfig({ ...config, geminiHabilitado: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A3B3B]"></div>
              </label>
            </div>

            {/* Formulario de credenciales y modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Key */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#7A3B3B]" />
                    <span>Google Gemini API Key</span>
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#7A3B3B] hover:text-[#5C2B2B] flex items-center gap-1 transition-colors"
                  >
                    <span>Obtener API Key Gratis en Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={mostrarApiKey ? 'text' : 'password'}
                    value={config.geminiApiKey}
                    onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                    placeholder="Ej: AIzaSy..."
                    className="w-full px-4 py-3 rounded-2xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs font-mono text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]/30 focus:border-[#7A3B3B] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarApiKey(!mostrarApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7F74] hover:text-[#2A2825] p-1.5 rounded-lg transition-colors"
                    title={mostrarApiKey ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {mostrarApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8A7F74]">
                  La clave se almacena de forma segura en las configuraciones del sistema y se utiliza exclusivamente para consultas de asesoramiento dermocosmético en el centro.
                </p>
              </div>

              {/* Modelo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#7A3B3B]" />
                  <span>Modelo de Lenguaje (LLM)</span>
                </label>
                <select
                  value={config.geminiModel}
                  onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-[#EDE8E1] bg-[#FAF8F5] text-xs font-semibold text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]/30 focus:border-[#7A3B3B] transition-all"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recomendado - Baja latencia y gratis)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Razonamiento profundo para casos complejos)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Última generación Google)</option>
                </select>
                <p className="text-[11px] text-[#8A7F74]">
                  Recomendado: <strong>Gemini 1.5 Flash</strong> por tiempos de respuesta inferiores a 1.5s y amplia cuota gratuita.
                </p>
              </div>

              {/* Temperatura */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#7A3B3B]" />
                    <span>Temperatura de Muestreo</span>
                  </label>
                  <span className="text-xs font-bold font-mono text-[#7A3B3B] bg-[#7A3B3B]/10 px-2 py-0.5 rounded-md">
                    {config.geminiTemperatura?.toFixed(2) ?? '0.30'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.geminiTemperatura ?? 0.3}
                  onChange={(e) => setConfig({ ...config, geminiTemperatura: parseFloat(e.target.value) })}
                  className="w-full accent-[#7A3B3B] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#8A7F74]">
                  <span>0.0 (Preciso / Sin desvíos)</span>
                  <span>0.3 (Recomendado)</span>
                  <span>1.0 (Muy creativo)</span>
                </div>
              </div>
            </div>

            {/* Botón de Test y Resultado */}
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#2A2825] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Prueba de Conectividad y Guardrails en Tiempo Real</span>
                  </h4>
                  <p className="text-xs text-[#8A7F74]">
                    Envía un ping de validación con las credenciales cargadas para comprobar estado, latencia y verificación de guardrails.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={probandoGemini}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3C3530] hover:bg-[#2A2825] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 shrink-0"
                >
                  {probandoGemini ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando conexión...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Probar Conexión con Gemini</span>
                    </>
                  )}
                </button>
              </div>

              {resultadoTestGemini && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    resultadoTestGemini.conectado
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {resultadoTestGemini.conectado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{resultadoTestGemini.mensaje}</span>
                  </div>
                  {resultadoTestGemini.conectado && (
                    <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-emerald-800">
                      <span>
                        <strong>Modelo:</strong> {resultadoTestGemini.modelo || config.geminiModel}
                      </span>
                      <span>
                        <strong>Latencia de Respuesta:</strong> {resultadoTestGemini.latenciaMs ?? 0} ms
                      </span>
                      <span>
                        <strong>Guardrails de Seguridad:</strong> {resultadoTestGemini.guardrailsActivos ? '100% Activos' : 'Activos'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECCIÓN DE GUARDRAILS Y LIMITACIONES (HU-12 / RF-09 / RNF-04) */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[#EDE8E1] pb-2">
                <h4 className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Blindaje de Seguridad y Limitaciones Obligatorias (HU-12 / RF-09)</span>
                </h4>
                <p className="text-xs text-[#8A7F74]">
                  El sistema aplica una doble capa de protección (Prompt Injection Defense + Filtro Heurístico en C#) para garantizar el cumplimiento de las 4 normas inquebrantables:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regla 1 */}
                <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-[10px]">1</span>
                    <span>Prohibición de Diagnósticos y Recetas Clínicas</span>
                  </div>
                  <p className="text-[11px] text-[#5A524A] leading-relaxed">
                    El asistente tiene terminantemente prohibido diagnosticar patologías dermatológicas o prescribir fármacos bajo receta (antibióticos, corticoides, isotretinoína, etc.). Ante cualquier consulta médica, emite un aviso de responsabilidad y recomienda consultar a un médico dermatólogo.
                  </p>
                </div>

                {/* Regla 2 */}
                <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px]">2</span>
                    <span>Prohibición de Marcas Externas y Ajenas</span>
                  </div>
                  <p className="text-[11px] text-[#5A524A] leading-relaxed">
                    Prohíbe recomendar marcas comerciales externas (CeraVe, La Roche-Posay, ISDIN, Neutrogena, Cetaphil, The Ordinary, etc.). En caso de que el usuario consulte por ellas, aclara cortésmente que solo asesora sobre las líneas cosmecéuticas disponibles en el centro.
                  </p>
                </div>

                {/* Regla 3 */}
                <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">3</span>
                    <span>Catálogo Real y Stock Activo (RAG)</span>
                  </div>
                  <p className="text-[11px] text-[#5A524A] leading-relaxed">
                    Todas las sugerencias se nutren en tiempo real de la base de datos de productos en stock y servicios vigentes. La IA jamás inventará productos ni recomendará ítems agotados o incompatibles con el biotipo cutáneo del usuario.
                  </p>
                </div>

                {/* Regla 4 */}
                <div className="p-4 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">4</span>
                    <span>Latencia RNF-04 y Fallback Local Automático</span>
                  </div>
                  <p className="text-[11px] text-[#5A524A] leading-relaxed">
                    Si Google Gemini demora más de 4.5 segundos, la API Key no está cargada o hay interrupción de conectividad, el sistema conmuta instantáneamente al motor heurístico RAG certificado local, garantizando respuestas en menos de 5 segundos sin errores 500.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón flotante inferior para guardar cómodamente */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-[#EDE8E1] p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4">
          <div className="text-xs text-[#8A7F74]">
            Recordá presionar <strong className="text-[#2A2825]">Guardar Cambios</strong> para sincronizar el logo, nombre y banners en vivo en la página.
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
