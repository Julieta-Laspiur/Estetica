import { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Award,
  Search,
  RefreshCw,
  Loader2,
  X,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Check,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Layers,
  Gift,
  Heart
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { usuariosApi, fidelizacionApi, type UsuarioDetalleDto, type TarjetaFidelizacionDto, type ResultadoEscaneoQrDto } from '../../services/api';
import {
  lealtadService,
  type SolicitudEstampitaQr,
  type TipoTarjetaMembresia,
  type CategoriaTarjeta,
  type TipoPremioTarjeta,
  type ColorTemaTarjeta,
  EVENTO_QR_SOLICITUD_CREADA,
  EVENTO_ESTAMPITA_ACREDITADA,
  EVENTO_TIPOS_TARJETAS_ACTUALIZADOS
} from '../../services/lealtadService';

interface ClienteConTarjeta {
  usuario: UsuarioDetalleDto;
  tarjeta?: TarjetaFidelizacionDto;
}

export function ProgramaLealtad() {
  const [solicitudes, setSolicitudes] = useState<SolicitudEstampitaQr[]>(() => lealtadService.getSolicitudes());
  const [tiposTarjetas, setTiposTarjetas] = useState<TipoTarjetaMembresia[]>(() => lealtadService.getTiposTarjetas());
  const [activeTab, setActiveTab] = useState<'pendientes' | 'validar' | 'clientes' | 'tarjetas'>('tarjetas');
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [validatingQr, setValidatingQr] = useState(false);
  const [resultadoEscaneo, setResultadoEscaneo] = useState<ResultadoEscaneoQrDto | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [feedbackAcreditacion, setFeedbackAcreditacion] = useState<string | null>(null);

  // Escaneo con Cámara
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [clientesTarjetas, setClientesTarjetas] = useState<ClienteConTarjeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para Crear / Editar Tipo de Tarjeta de Membresía
  const [modalTarjetaAbierto, setModalTarjetaAbierto] = useState(false);
  const [tarjetaEnEdicion, setTarjetaEnEdicion] = useState<TipoTarjetaMembresia | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaTarjeta>('Uñas');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formEstampitas, setFormEstampitas] = useState(5);
  const [formRecompensa, setFormRecompensa] = useState('');
  const [formTipoPremio, setFormTipoPremio] = useState<TipoPremioTarjeta>('servicio_gratis');
  const [formValorPremio, setFormValorPremio] = useState(100);
  const [formValidezDias, setFormValidezDias] = useState(45);
  const [formColorTema, setFormColorTema] = useState<ColorTemaTarjeta>('rose');
  const [formIcono, setFormIcono] = useState('💅');
  const [formActiva, setFormActiva] = useState(true);

  // Modal de Acreditación Manual Directa para un Cliente
  const [modalAcreditarManual, setModalAcreditarManual] = useState(false);
  const [clienteSeleccionadoManual, setClienteSeleccionadoManual] = useState<UsuarioDetalleDto | null>(null);
  const [tipoTarjetaSeleccionadaManual, setTipoTarjetaSeleccionadaManual] = useState<string>('');

  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const solicitudesAcreditadas = solicitudes.filter(s => s.estado === 'acreditado');

  const cargarDatosLealtad = async () => {
    setLoading(true);
    try {
      setSolicitudes(lealtadService.getSolicitudes());
      setTiposTarjetas(lealtadService.getTiposTarjetas());
      const clientes: UsuarioDetalleDto[] = await usuariosApi.getClientes().catch(() => [
        { usuarioId: 101, nombre: 'Carla', apellido: 'Gómez', email: 'carla.gomez@gmail.com', telefono: '+54 9 11 5566-7788', rol: 'Cliente' as const, fechaRegistro: '2026-01-10', activo: true, bloqueado: false, intentosFallidos: 0 },
        { usuarioId: 102, nombre: 'Luciana', apellido: 'Martínez', email: 'luciana.m@hotmail.com', telefono: '+54 9 11 4433-2211', rol: 'Cliente' as const, fechaRegistro: '2026-02-15', activo: true, bloqueado: false, intentosFallidos: 0 },
        { usuarioId: 103, nombre: 'Mariana', apellido: 'Benítez', email: 'mbenitez@yahoo.com', telefono: '+54 9 11 3322-1100', rol: 'Cliente' as const, fechaRegistro: '2026-03-20', activo: true, bloqueado: false, intentosFallidos: 0 },
        { usuarioId: 104, nombre: 'Sofía', apellido: 'Romero', email: 'sofia.romero@gmail.com', telefono: '+54 9 11 9988-7766', rol: 'Cliente' as const, fechaRegistro: '2026-04-05', activo: true, bloqueado: false, intentosFallidos: 0 },
      ]);

      const tarjetasLocales = lealtadService.getTarjetas();

      const conTarjetas: ClienteConTarjeta[] = await Promise.all(
        clientes.map(async (u) => {
          try {
            const apiTarjeta = await fidelizacionApi.getTarjetaPorUsuario(u.usuarioId);
            const local = tarjetasLocales[u.usuarioId];
            if (local && local.estampitasActuales > (apiTarjeta?.estampitasActuales || 0)) {
              return {
                usuario: u,
                tarjeta: {
                  ...apiTarjeta,
                  estampitasActuales: local.estampitasActuales,
                }
              };
            }
            return { usuario: u, tarjeta: apiTarjeta };
          } catch {
            const local = tarjetasLocales[u.usuarioId];
            return {
              usuario: u,
              tarjeta: {
                fidelizacionId: u.usuarioId,
                usuarioId: u.usuarioId,
                estampitasActuales: local ? local.estampitasActuales : 3,
                estampitasParaPremio: 10,
                cuponesDisponibles: local ? local.totalCanjeadas : 0,
              }
            };
          }
        })
      );
      setClientesTarjetas(conTarjetas);
    } catch (err) {
      console.error('Error al cargar datos de fidelización:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosLealtad();
  }, []);

  // Escuchar eventos en vivo
  useEffect(() => {
    const handleNuevaSolicitud = () => {
      setSolicitudes(lealtadService.getSolicitudes());
      setFeedbackAcreditacion('¡Nueva solicitud de estampita QR recibida de cabina profesional!');
      setTimeout(() => setFeedbackAcreditacion(null), 5000);
    };

    const handleAcreditacion = () => {
      setSolicitudes(lealtadService.getSolicitudes());
      cargarDatosLealtad();
    };

    const handleTiposActualizados = () => {
      setTiposTarjetas(lealtadService.getTiposTarjetas());
    };

    window.addEventListener(EVENTO_QR_SOLICITUD_CREADA, handleNuevaSolicitud);
    window.addEventListener(EVENTO_ESTAMPITA_ACREDITADA, handleAcreditacion);
    window.addEventListener(EVENTO_TIPOS_TARJETAS_ACTUALIZADOS, handleTiposActualizados);
    window.addEventListener('estetica_qr_solicitud_actualizada', handleAcreditacion);

    return () => {
      window.removeEventListener(EVENTO_QR_SOLICITUD_CREADA, handleNuevaSolicitud);
      window.removeEventListener(EVENTO_ESTAMPITA_ACREDITADA, handleAcreditacion);
      window.removeEventListener(EVENTO_TIPOS_TARJETAS_ACTUALIZADOS, handleTiposActualizados);
      window.removeEventListener('estetica_qr_solicitud_actualizada', handleAcreditacion);
    };
  }, []);

  // Escaneo con Cámara
  const startCamera = async () => {
    try {
      setQrError(null);
      setCameraActive(true);
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode('qr-reader-container');
          scannerRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              await stopCamera();
              await procesarToken(decodedText);
            },
            () => {}
          );
        } catch (camErr: any) {
          console.error('Error al iniciar cámara interna:', camErr);
          setQrError('No se pudo acceder a la cámara. Verificá los permisos del navegador.');
          setCameraActive(false);
        }
      }, 200);
    } catch (err: any) {
      console.error('Error al iniciar cámara:', err);
      setQrError('No se pudo acceder a la cámara.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const procesarToken = async (token: string, tipoTarjetaIdOverride?: string) => {
    if (!token) return;
    setValidatingQr(true);
    setQrError(null);
    setResultadoEscaneo(null);

    const resLocal = lealtadService.acreditarQr(token, 'Administradora', tipoTarjetaIdOverride);
    if (resLocal.exito && resLocal.solicitud) {
      setResultadoEscaneo({
        exitoso: true,
        mensaje: resLocal.mensaje,
        clienteNombre: resLocal.solicitud.clienteNombre,
        estampitasActuales: resLocal.estampitasActualesTarjeta || 1,
        progreso: `${resLocal.estampitasActualesTarjeta || 1}/${resLocal.estampitasRequeridasTarjeta || 10}`,
        cicloCompletado: resLocal.premioAlcanzado || false,
        cuponGenerado: resLocal.premioAlcanzado
          ? {
              cuponId: 999,
              codigo: `PREMIO-${resLocal.tipoTarjeta?.categoria.toUpperCase() || 'VIP'}-${Date.now().toString().slice(-4)}`,
              descuento: resLocal.tipoTarjeta?.valorPremio || 100,
              fechaExpiracion: '2026-12-31',
              mensaje: `¡Premio desbloqueado! ${resLocal.tipoTarjeta?.recompensaTitulo || 'Recompensa de membresía'}.`
            }
          : undefined,
      });
      setQrCode('');
      setSolicitudes(lealtadService.getSolicitudes());
      await cargarDatosLealtad();
      setValidatingQr(false);
      return;
    }

    try {
      const res = await fidelizacionApi.escanearQr(token.trim());
      setResultadoEscaneo(res);
      setQrCode('');
      await cargarDatosLealtad();
    } catch (err: any) {
      setQrError(resLocal.mensaje || err.message || 'Error al validar código QR.');
    } finally {
      setValidatingQr(false);
    }
  };

  const handleValidarQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode) return;
    await procesarToken(qrCode);
  };

  const handleAcreditarDirecto = (sol: SolicitudEstampitaQr, tipoTarjetaId?: string) => {
    const res = lealtadService.acreditarQr(sol.codigoQr, 'Administradora', tipoTarjetaId);
    if (res.exito) {
      setFeedbackAcreditacion(`¡Estampita acreditada con éxito a ${sol.clienteNombre}! Ya se reflejó en su tarjeta digital.`);
      setSolicitudes(lealtadService.getSolicitudes());
      cargarDatosLealtad();
      setTimeout(() => setFeedbackAcreditacion(null), 5000);
    } else {
      setQrError(res.mensaje);
      setTimeout(() => setQrError(null), 4000);
    }
  };

  // ── MÉTODOS DE GESTIÓN DE TIPOS DE TARJETAS (NUEVO REQUERIMIENTO) ──

  const abrirModalCrearTarjeta = () => {
    setTarjetaEnEdicion(null);
    setFormNombre('');
    setFormCategoria('Uñas');
    setFormDescripcion('');
    setFormEstampitas(5); // Por defecto para Uñas sugerimos 5
    setFormRecompensa('Esmaltado Semipermanente 100% Bonificado');
    setFormTipoPremio('servicio_gratis');
    setFormValorPremio(100);
    setFormValidezDias(45);
    setFormColorTema('rose');
    setFormIcono('💅');
    setFormActiva(true);
    setModalTarjetaAbierto(true);
  };

  const abrirModalEditarTarjeta = (tipo: TipoTarjetaMembresia) => {
    setTarjetaEnEdicion(tipo);
    setFormNombre(tipo.nombre);
    setFormCategoria(tipo.categoria);
    setFormDescripcion(tipo.descripcion);
    setFormEstampitas(tipo.estampitasRequeridas);
    setFormRecompensa(tipo.recompensaTitulo);
    setFormTipoPremio(tipo.tipoPremio);
    setFormValorPremio(tipo.valorPremio);
    setFormValidezDias(tipo.validezDias);
    setFormColorTema(tipo.colorTema);
    setFormIcono(tipo.icono);
    setFormActiva(tipo.activa);
    setModalTarjetaAbierto(true);
  };

  const handleGuardarTarjeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    lealtadService.guardarTipoTarjeta({
      id: tarjetaEnEdicion?.id,
      nombre: formNombre.trim(),
      categoria: formCategoria,
      descripcion: formDescripcion.trim() || `Beneficio tras completar ${formEstampitas} visitas.`,
      estampitasRequeridas: Number(formEstampitas) || 5,
      recompensaTitulo: formRecompensa.trim() || 'Beneficio Especial',
      tipoPremio: formTipoPremio,
      valorPremio: Number(formValorPremio) || 20,
      validezDias: Number(formValidezDias) || 45,
      colorTema: formColorTema,
      icono: formIcono || '✨',
      activa: formActiva,
      fechaCreacion: tarjetaEnEdicion?.fechaCreacion,
    });

    setModalTarjetaAbierto(false);
    setFeedbackAcreditacion(
      tarjetaEnEdicion
        ? `¡Tarjeta "${formNombre}" actualizada exitosamente!`
        : `¡Nueva membresía "${formNombre}" con meta de ${formEstampitas} estampitas creada!`
    );
    setTimeout(() => setFeedbackAcreditacion(null), 5000);
    setTiposTarjetas(lealtadService.getTiposTarjetas());
  };

  const handleEliminarTarjeta = (id: string, nombre: string) => {
    if (tiposTarjetas.length <= 1) {
      alert('Debe existir al menos un tipo de tarjeta de membresía en el sistema.');
      return;
    }
    if (window.confirm(`¿Confirmás que querés eliminar la tarjeta "${nombre}"?\nEsta acción retirará la tarjeta de la lista activa.`)) {
      lealtadService.eliminarTipoTarjeta(id);
      setTiposTarjetas(lealtadService.getTiposTarjetas());
      setFeedbackAcreditacion(`Tarjeta "${nombre}" eliminada correctamente.`);
      setTimeout(() => setFeedbackAcreditacion(null), 4000);
    }
  };

  const handleToggleActivar = (id: string) => {
    lealtadService.toggleActivarTipoTarjeta(id);
    setTiposTarjetas(lealtadService.getTiposTarjetas());
  };

  // Abrir modal para acreditar manualmente a un cliente
  const abrirModalAcreditarManual = (usuario: UsuarioDetalleDto) => {
    setClienteSeleccionadoManual(usuario);
    const activas = tiposTarjetas.filter(t => t.activa);
    setTipoTarjetaSeleccionadaManual(activas[0]?.id || 'card-unas');
    setModalAcreditarManual(true);
  };

  const handleConfirmarAcreditacionManual = () => {
    if (!clienteSeleccionadoManual || !tipoTarjetaSeleccionadaManual) return;
    const res = lealtadService.acreditarEstampitaDirecta(
      clienteSeleccionadoManual.usuarioId,
      tipoTarjetaSeleccionadaManual,
      'Atención en Mostrador',
      'Recepción General',
      'Administradora'
    );
    setModalAcreditarManual(false);
    setFeedbackAcreditacion(res.mensaje);
    setTimeout(() => setFeedbackAcreditacion(null), 5000);
    cargarDatosLealtad();
  };

  // Helpers de color y borde fino para la tarjeta blanca
  const getCardBorderStyle = (tema: ColorTemaTarjeta) => {
    switch (tema) {
      case 'rose':
        return {
          borderStyle: 'border-[#E08A97]',
          badgeColor: 'bg-pink-50 text-[#A04355] border-pink-200',
          accentText: 'text-[#A04355]',
          lightBg: 'bg-pink-50/60',
        };
      case 'wine':
        return {
          borderStyle: 'border-[#7A3B3B]',
          badgeColor: 'bg-[#FAF0F0] text-[#7A3B3B] border-[#7A3B3B]/30',
          accentText: 'text-[#7A3B3B]',
          lightBg: 'bg-[#FAF0F0]/60',
        };
      case 'emerald':
        return {
          borderStyle: 'border-[#4A8068]',
          badgeColor: 'bg-emerald-50 text-[#2D5A46] border-emerald-200',
          accentText: 'text-[#2D5A46]',
          lightBg: 'bg-emerald-50/60',
        };
      case 'dark':
        return {
          borderStyle: 'border-[#4A423A]',
          badgeColor: 'bg-stone-100 text-[#3C3530] border-stone-300',
          accentText: 'text-[#3C3530]',
          lightBg: 'bg-stone-100/60',
        };
      case 'gold':
        return {
          borderStyle: 'border-[#C5A358]',
          badgeColor: 'bg-amber-50 text-[#8C6D2E] border-amber-200',
          accentText: 'text-[#8C6D2E]',
          lightBg: 'bg-amber-50/60',
        };
      case 'violet':
        return {
          borderStyle: 'border-[#8F5B9B]',
          badgeColor: 'bg-purple-50 text-[#694273] border-purple-200',
          accentText: 'text-[#694273]',
          lightBg: 'bg-purple-50/60',
        };
      default:
        return {
          borderStyle: 'border-[#7A3B3B]',
          badgeColor: 'bg-[#FAF0F0] text-[#7A3B3B] border-[#7A3B3B]/30',
          accentText: 'text-[#7A3B3B]',
          lightBg: 'bg-[#FAF0F0]/60',
        };
    }
  };

  const totalClientes = clientesTarjetas.length;
  const totalEstampitas = clientesTarjetas.reduce((acc, c) => acc + (c.tarjeta?.estampitasActuales || 0), 0);

  const filteredClientes = clientesTarjetas.filter(c => {
    const fullName = `${c.usuario.nombre} ${c.usuario.apellido}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || c.usuario.email.toLowerCase().includes(query);
  });

  // Renderiza los corazones de estampitas que se ponen rojos al acumularse
  const renderEstampillasDinamicas = (actual: number, total: number) => {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, idx) => {
          const isStamped = idx < actual;
          return (
            <div
              key={idx}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                isStamped
                  ? 'bg-rose-50 border border-red-200 shadow-2xs scale-105'
                  : 'bg-[#FAF8F5] border border-[#EDE8E1]'
              }`}
            >
              {isStamped ? (
                <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-in zoom-in-75" />
              ) : (
                <Heart className="w-4 h-4 text-[#DDD5C8] stroke-[1.5]" />
              )}
              <span className={`text-[8px] font-mono font-bold mt-0.5 ${isStamped ? 'text-red-500 font-extrabold' : 'text-[#8A7F74]'}`}>
                {isStamped ? '✓' : idx + 1}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackAcreditacion && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border bg-[#3C3530] text-white border-emerald-500/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{feedbackAcreditacion}</span>
        </div>
      )}

      {/* Alerta de Error */}
      {qrError && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border bg-[#3C3530] text-white border-rose-500/40 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{qrError}</span>
        </div>
      )}

      {/* Header General del Módulo */}
      <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2.5 bg-[#7A3B3B] text-white rounded-2xl shadow-xs">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2825]">Programa de Fidelización & Membresías</h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#8A7F74]">
            Configurá distintos tipos de tarjetas de membresía con metas de estampitas adaptadas a cada servicio (ej: 5 sellos para Uñas vs 8 para Facial).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={abrirModalCrearTarjeta}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Tipo de Membresía</span>
          </button>

          <button
            onClick={cargarDatosLealtad}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#EDE8E1] text-xs font-semibold text-[#5A524A] hover:bg-[#FAF8F5] transition-colors"
            title="Refrescar datos en vivo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#7A3B3B]' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Métricas del Sistema */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2A2825]">{tiposTarjetas.length}</p>
              <p className="text-xs text-[#8A7F74]">Tipos de Tarjetas Activas</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              solicitudesPendientes.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-[#FAF8F5] text-[#3C3530]'
            }`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-2xl font-black ${
                solicitudesPendientes.length > 0 ? 'text-amber-900' : 'text-[#2A2825]'
              }`}>
                {solicitudesPendientes.length}
              </p>
              <p className={`text-xs font-bold ${
                solicitudesPendientes.length > 0 ? 'text-amber-800' : 'text-[#8A7F74]'
              }`}>
                QRs por Acreditar
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FAF8F5] rounded-xl text-[#3C3530]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2A2825]">{totalClientes}</p>
              <p className="text-xs text-[#8A7F74]">Clientes Fidelizados</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 rounded-xl text-[#7A3B3B]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#7A3B3B]">{totalEstampitas}</p>
              <p className="text-xs text-[#7A3B3B]">Estampillas Acreditadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#EDE8E1] rounded-3xl shadow-xs overflow-hidden">
        <div className="border-b border-[#EDE8E1] bg-[#FAF8F5]">
          <div className="flex flex-wrap gap-2 px-6 py-3">
            <button
              onClick={() => setActiveTab('tarjetas')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'tarjetas'
                  ? 'bg-[#7A3B3B] text-white shadow-xs'
                  : 'text-[#4A423A] hover:bg-[#EDE8E1] hover:text-[#2A2825]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Tipos de Membresías & Estampitas</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'tarjetas' ? 'bg-white text-[#7A3B3B]' : 'bg-[#7A3B3B]/15 text-[#7A3B3B]'
              }`}>
                {tiposTarjetas.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pendientes')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'pendientes'
                  ? 'bg-[#7A3B3B] text-white shadow-xs'
                  : 'text-[#4A423A] hover:bg-[#EDE8E1] hover:text-[#2A2825]'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>QRs por Acreditar</span>
              {solicitudesPendientes.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'pendientes' ? 'bg-white text-[#7A3B3B]' : 'bg-[#7A3B3B] text-white animate-pulse'
                }`}>
                  {solicitudesPendientes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'clientes'
                  ? 'bg-[#3C3530] text-white shadow-xs'
                  : 'text-[#8A7F74] hover:text-[#2A2825]'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Progreso por Cliente</span>
            </button>

            <button
              onClick={() => setActiveTab('validar')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'validar'
                  ? 'bg-[#3C3530] text-white shadow-xs'
                  : 'text-[#8A7F74] hover:text-[#2A2825]'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Escanear con Cámara / Token</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">

          {/* ── SECCIÓN 1: TIPOS DE MEMBRESÍAS & ESTAMPITAS (NUEVO REQUERIMIENTO CENTRAL) ── */}
          {activeTab === 'tarjetas' && (
            <div className="space-y-6">
              {/* Banner Informativo y Botón de Acción */}
              <div className="p-5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                    <span>Membresías Diferenciadas por Categoría & Costo del Servicio</span>
                  </h3>
                  <p className="text-xs text-[#8A7F74] max-w-3xl leading-relaxed">
                    Un servicio accesible y frecuente como <strong>Uñas / Manicuría</strong> debe premiar al cliente con <strong>5 estampitas</strong>, mientras que un tratamiento cosmecéutico avanzado como un <strong>Facial Dermoestético</strong> puede requerir <strong>8 o 10 estampitas</strong>. Configurá tantas tarjetas como necesites.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={abrirModalCrearTarjeta}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nueva Tarjeta de Membresía</span>
                </button>
              </div>

              {/* Grid de Tarjetas de Membresía en Blanco con Borde Fino de Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tiposTarjetas.map((tarjeta) => {
                  const estilo = getCardBorderStyle(tarjeta.colorTema);

                  return (
                    <div
                      key={tarjeta.id}
                      className={`bg-white text-[#2A2825] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md border ${estilo.borderStyle} relative overflow-hidden transition-all duration-300`}
                    >
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`p-2.5 rounded-2xl ${estilo.lightBg} border ${estilo.borderStyle} shadow-2xs flex items-center justify-center`}>
                            {tarjeta.categoria === 'Masajes' ? (
                              <Layers className="w-5 h-5 text-[#4A8068]" />
                            ) : tarjeta.categoria === 'Facial' ? (
                              <Award className="w-5 h-5 text-[#7A3B3B]" />
                            ) : tarjeta.categoria === 'Todas' ? (
                              <ShieldCheck className="w-5 h-5 text-[#4A423A]" />
                            ) : (
                              <Sparkles className="w-5 h-5 text-[#A04355]" />
                            )}
                          </span>
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${estilo.badgeColor}`}>
                              {tarjeta.categoria}
                            </span>
                            <h4 className="text-lg sm:text-xl font-extrabold text-[#2A2825] mt-1 leading-snug">
                              {tarjeta.nombre}
                            </h4>
                          </div>
                        </div>

                        {/* Switch Activa / Inactiva */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleActivar(tarjeta.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                              tarjeta.activa
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-[#FAF8F5] text-[#8A7F74] border-[#EDE8E1] hover:bg-[#EDE8E1]'
                            }`}
                            title="Cambiar estado"
                          >
                            {tarjeta.activa ? '● Activa' : '○ Pausada'}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#8A7F74] mb-5 leading-relaxed">
                        {tarjeta.descripcion}
                      </p>

                      {/* Meta de estampitas destacada con corazones */}
                      <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-4 mb-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#2A2825]">
                          <span className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                            <span>Meta para el Premio:</span>
                          </span>
                          <span className="text-xs font-black text-red-600 font-mono bg-rose-50 border border-red-200 px-2 py-0.5 rounded-md">
                            {tarjeta.estampitasRequeridas} corazones
                          </span>
                        </div>

                        {/* Muestra visual interactiva de los corazones que se ponen rojos */}
                        <div className="pt-1">
                          {renderEstampillasDinamicas(
                            Math.min(3, tarjeta.estampitasRequeridas),
                            tarjeta.estampitasRequeridas
                          )}
                        </div>
                        <span className="text-[10px] text-[#8A7F74] block text-right font-medium">
                          Visualización para el cliente ({tarjeta.estampitasRequeridas} corazones en tarjeta blanca)
                        </span>
                      </div>

                      {/* Premio oficial */}
                      <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-3.5 mb-5 space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#8A7F74] font-bold block flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5 text-amber-600" />
                          <span>Recompensa al Completar:</span>
                        </span>
                        <p className="text-xs sm:text-sm font-extrabold text-[#2A2825]">
                          {tarjeta.recompensaTitulo}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-[#5A524A]">
                          <span className="px-2 py-0.5 bg-white border border-[#EDE8E1] rounded font-semibold">
                            {tarjeta.tipoPremio === 'servicio_gratis'
                              ? '100% Bonificado'
                              : tarjeta.tipoPremio === 'porcentaje'
                              ? `${tarjeta.valorPremio}% OFF`
                              : `$${tarjeta.valorPremio.toLocaleString()} Crédito`}
                          </span>
                          <span>• Cupón válido por {tarjeta.validezDias} días</span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE8E1]">
                        <button
                          type="button"
                          onClick={() => abrirModalEditarTarjeta(tarjeta)}
                          className="px-3 py-1.5 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarTarjeta(tarjeta.id, tarjeta.nombre)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-200"
                          title="Eliminar tipo de tarjeta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SECCIÓN 2: QRs POR ACREDITAR (PROFESIONAL -> ADMIN) ── */}
          {activeTab === 'pendientes' && (
            <div className="space-y-6">
              <div className="border-b border-[#EDE8E1] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#7A3B3B]" />
                    <span>Estampitas QR Pendientes de Acreditación</span>
                  </h3>
                  <p className="text-xs text-[#8A7F74]">
                    Solicitudes habilitadas por los profesionales al completar un turno confirmado en cabina
                  </p>
                </div>
                {solicitudesPendientes.length > 0 && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    {solicitudesPendientes.length} solicitud(es) esperando validación
                  </span>
                )}
              </div>

              {solicitudesPendientes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {solicitudesPendientes.map((sol) => {
                    const tarjetaDeducida = lealtadService.determinarTipoTarjetaParaServicio(sol.servicioNombre);

                    return (
                      <div
                        key={sol.id}
                        className="p-5 rounded-2xl bg-white border-2 border-[#DDD5C8] hover:border-[#7A3B3B] shadow-xs space-y-4 transition-all relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 inline-block mb-1">
                              QR Habilitado en Espera
                            </span>
                            <h4 className="font-extrabold text-base text-[#2A2825]">{sol.clienteNombre}</h4>
                            <p className="text-xs text-[#7A3B3B] font-bold">
                              {sol.servicioNombre}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A524A] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EDE8E1]">
                              <span>Destino sugerido:</span>
                              <strong>{tarjetaDeducida.icono} {tarjetaDeducida.nombre} ({tarjetaDeducida.estampitasRequeridas} sellos)</strong>
                            </span>
                          </div>

                          <div className="p-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl flex flex-col items-center shrink-0">
                            <QrCode className="w-10 h-10 text-[#3C3530]" />
                            <span className="text-[9px] font-mono text-[#8A7F74] mt-1 font-bold">
                              #{sol.turnoId}
                            </span>
                          </div>
                        </div>

                        {/* Datos de auditoría del turno */}
                        <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1]">
                          <div>
                            <span className="text-[10px] text-[#8A7F74] font-bold block">Profesional que atendió:</span>
                            <span className="font-semibold text-[#3C3530] flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-3.5 h-3.5 text-[#7A3B3B]" />
                              {sol.profesionalNombre}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8A7F74] font-bold block">Fecha & Horario de cita:</span>
                            <span className="font-semibold text-[#3C3530] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                              {sol.fechaTurno} • {sol.horaTurno} hs
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-zinc-50 border border-dashed border-[#DDD5C8] rounded-xl text-center">
                          <span className="text-[10px] text-[#8A7F74] uppercase tracking-wider block font-bold">
                            Token de Verificación QR:
                          </span>
                          <code className="text-xs font-mono font-black text-[#7A3B3B]">
                            {sol.codigoQr}
                          </code>
                        </div>

                        {/* Botones de acción del administrador */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAcreditarDirecto(sol)}
                            className="flex-1 py-2.5 px-4 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>✓ Acreditar Estampita Ahora</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('validar');
                              startCamera();
                            }}
                            className="py-2.5 px-3 bg-white border border-[#DDD5C8] hover:bg-[#FAF8F5] text-xs font-bold text-[#3C3530] rounded-xl transition-colors flex items-center gap-1.5"
                            title="Escanear con cámara física"
                          >
                            <Camera className="w-4 h-4 text-[#7A3B3B]" />
                            <span>Escanear</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center bg-[#FAF8F5] rounded-3xl border border-[#EDE8E1] p-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-base text-[#2A2825]">
                    No hay QRs pendientes de acreditar
                  </h4>
                  <p className="text-xs text-[#8A7F74] max-w-md mx-auto leading-relaxed">
                    Cuando un profesional habilite el código QR desde su panel tras finalizar un turno confirmado, la solicitud aparecerá aquí al instante y te llegará una alerta con el botón directo de acreditación.
                  </p>
                </div>
              )}

              {/* Historial de QRs Acreditados Recientemente */}
              {solicitudesAcreditadas.length > 0 && (
                <div className="pt-6 border-t border-[#EDE8E1] space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#8A7F74]">
                    Historial de QRs Acreditados Recientemente ({solicitudesAcreditadas.length})
                  </h4>
                  <div className="divide-y divide-[#EDE8E1] border border-[#EDE8E1] rounded-2xl overflow-hidden bg-white">
                    {solicitudesAcreditadas.slice(0, 5).map((sol) => (
                      <div key={sol.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5] text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            ✓
                          </div>
                          <div>
                            <span className="font-bold text-[#2A2825]">{sol.clienteNombre}</span>
                            <span className="text-[#8A7F74] text-[11px] block">
                              {sol.servicioNombre} • Atendió: {sol.profesionalNombre}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-[#8A7F74]">
                          <span className="text-emerald-700 font-bold block">Acreditado</span>
                          <span>{sol.fechaAcreditacion || 'Hoy'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECCIÓN 3: PROGRESO DE CLIENTES POR TIPO DE MEMBRESÍA ── */}
          {activeTab === 'clientes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                <div className="text-xs text-[#8A7F74]">
                  Mostrando <strong className="text-[#2A2825]">{filteredClientes.length}</strong> clientes registrados
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-[#8A7F74]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
                  <p className="text-xs">Cargando estado de fidelización...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredClientes.map((c) => {
                    const localData = lealtadService.getTarjetaCliente(c.usuario.usuarioId, `${c.usuario.nombre} ${c.usuario.apellido}`);

                    return (
                      <div
                        key={c.usuario.usuarioId}
                        className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl p-6 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-[#EDE8E1] pb-3">
                          <div>
                            <h4 className="font-extrabold text-base text-[#2A2825]">
                              {c.usuario.nombre} {c.usuario.apellido}
                            </h4>
                            <p className="text-xs text-[#8A7F74]">{c.usuario.email}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => abrirModalAcreditarManual(c.usuario)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Sellar Estampita</span>
                          </button>
                        </div>

                        {/* Desglose por tipo de membresía activa */}
                        <div className="space-y-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7F74] block">
                            Progreso en Tarjetas de Membresía:
                          </span>

                          <div className="space-y-2.5">
                            {tiposTarjetas.filter(t => t.activa).map((tipo) => {
                              const progreso = localData.progresosPorTipo?.[tipo.id];
                              const estampitasActuales = progreso ? progreso.estampitasActuales : 0;
                              const meta = tipo.estampitasRequeridas;
                              const porcentaje = Math.min(100, Math.round((estampitasActuales / meta) * 100));
                              const falta = Math.max(0, meta - estampitasActuales);

                              return (
                                <div key={tipo.id} className="p-3 bg-white border border-[#EDE8E1] rounded-2xl space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-[#2A2825] flex items-center gap-1.5">
                                      <span>{tipo.icono}</span>
                                      <span>{tipo.nombre}</span>
                                    </span>
                                    <span className="font-extrabold text-[#7A3B3B] font-mono">
                                      {estampitasActuales} / {meta} sellos ({porcentaje}%)
                                    </span>
                                  </div>

                                  {/* Barra de progreso */}
                                  <div className="w-full bg-[#EDE8E1] h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#7A3B3B] h-full transition-all duration-300"
                                      style={{ width: `${porcentaje}%` }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-[#8A7F74]">
                                    <span>Premio: <strong className="text-[#3C3530]">{tipo.recompensaTitulo}</strong></span>
                                    <span>{falta === 0 ? '🎉 ¡Lista para canje!' : `Faltan ${falta} sellos`}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SECCIÓN 4: ESCANEAR CON CÁMARA / TOKEN MANUAL ── */}
          {activeTab === 'validar' && (
            <div className="max-w-md mx-auto">
              <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-white border border-[#EDE8E1] rounded-2xl flex items-center justify-center mx-auto text-[#7A3B3B] shadow-xs">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#2A2825]">Validar y Acreditar Estampita QR</h3>
                  <p className="text-xs text-[#8A7F74] mt-1">
                    Escaneá el código QR presentado por el cliente o ingresá el token manual de verificación
                  </p>
                </div>

                {resultadoEscaneo && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{resultadoEscaneo.mensaje}</span>
                    </div>
                    <div className="text-xs text-emerald-900">
                      <strong>Cliente:</strong> {resultadoEscaneo.clienteNombre}
                    </div>
                    {resultadoEscaneo.cicloCompletado && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold">
                        🎉 ¡Completó la tarjeta! Se ha generado su cupón de recompensa.
                      </div>
                    )}
                  </div>
                )}

                {/* Cámara */}
                <div className="space-y-3">
                  <div id="qr-reader-container" className="rounded-2xl overflow-hidden bg-black/5 max-w-sm mx-auto" />
                  {cameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Detener Cámara
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full py-2.5 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Activar Cámara</span>
                    </button>
                  )}
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EDE8E1]"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-[#8A7F74]">
                    <span className="bg-[#FAF8F5] px-2">o ingresar token</span>
                  </div>
                </div>

                {/* Formulario Manual */}
                <form onSubmit={handleValidarQR} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Pegá el token QR aquí..."
                    className="w-full px-4 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                  <button
                    type="submit"
                    disabled={validatingQr || !qrCode}
                    className="w-full py-2.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {validatingQr ? 'Validando...' : 'Validar y Acreditar'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── MODAL: CREAR / EDITAR TIPO DE TARJETA DE MEMBRESÍA ── */}
      {modalTarjetaAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#EDE8E1] shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#7A3B3B] text-white rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#2A2825]">
                    {tarjetaEnEdicion ? 'Editar Tarjeta de Membresía' : 'Nueva Tarjeta de Membresía'}
                  </h3>
                  <p className="text-xs text-[#8A7F74]">
                    Personalizá la cantidad de estampitas requeridas según el tipo de servicio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTarjetaAbierto(false)}
                className="p-2 rounded-xl text-[#8A7F74] hover:bg-[#FAF8F5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarTarjeta} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Nombre de la Tarjeta de Membresía *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Membresía Uñas & Manicuría"
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Categoría de Servicios
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => {
                      const cat = e.target.value as CategoriaTarjeta;
                      setFormCategoria(cat);
                      if (cat === 'Uñas') {
                        setFormIcono('sparkles');
                        setFormColorTema('rose');
                        if (!tarjetaEnEdicion) setFormEstampitas(5);
                      } else if (cat === 'Facial') {
                        setFormIcono('award');
                        setFormColorTema('wine');
                        if (!tarjetaEnEdicion) setFormEstampitas(8);
                      } else if (cat === 'Masajes') {
                        setFormIcono('flower');
                        setFormColorTema('emerald');
                        if (!tarjetaEnEdicion) setFormEstampitas(6);
                      } else if (cat === 'Todas') {
                        setFormIcono('shield');
                        setFormColorTema('dark');
                        if (!tarjetaEnEdicion) setFormEstampitas(10);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                  >
                    <option value="Uñas">Uñas / Manicuría & Pedicuría</option>
                    <option value="Facial">Facial & Dermoestética</option>
                    <option value="Masajes">Masajes & Spa Corporal</option>
                    <option value="Corporal">Tratamientos Corporales</option>
                    <option value="Pestañas/Cejas">Pestañas & Cejas</option>
                    <option value="Todas">Club VIP / Todas las especialidades</option>
                  </select>
                </div>

                {/* Estampitas Requeridas (CLAVE DEL REQUERIMIENTO) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                      Estampitas a Acumular *
                    </label>
                    <span className="text-xs font-black text-[#7A3B3B] bg-[#7A3B3B]/10 px-2 py-0.5 rounded font-mono">
                      {formEstampitas} sellos
                    </span>
                  </div>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    required
                    value={formEstampitas}
                    onChange={(e) => setFormEstampitas(parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                  />
                  {/* Chips de acceso rápido */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      { n: 4, label: '4 (Rápido)' },
                      { n: 5, label: '5 (Uñas)' },
                      { n: 6, label: '6 (Spa)' },
                      { n: 8, label: '8 (Facial)' },
                      { n: 10, label: '10 (VIP)' },
                    ].map(chip => (
                      <button
                        key={chip.n}
                        type="button"
                        onClick={() => setFormEstampitas(chip.n)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors ${
                          formEstampitas === chip.n
                            ? 'bg-[#7A3B3B] text-white'
                            : 'bg-[#EDE8E1] text-[#5A524A] hover:bg-[#DDD5C8]'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recompensa Oficial */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Título Oficial de la Recompensa / Premio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRecompensa}
                    onChange={(e) => setFormRecompensa(e.target.value)}
                    placeholder="Ej: Esmaltado Semipermanente 100% Bonificado"
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                  />
                </div>

                {/* Tipo de Premio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Modalidad del Beneficio
                  </label>
                  <select
                    value={formTipoPremio}
                    onChange={(e) => setFormTipoPremio(e.target.value as TipoPremioTarjeta)}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                  >
                    <option value="servicio_gratis">Servicio 100% Bonificado</option>
                    <option value="porcentaje">Descuento Porcentual (% OFF)</option>
                    <option value="monto_fijo">Monto Fijo en Crédito ($ ARS)</option>
                  </select>
                </div>

                {/* Valor del Premio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    {formTipoPremio === 'porcentaje' ? 'Porcentaje de Descuento (%)' : formTipoPremio === 'monto_fijo' ? 'Monto Bonificado ($ ARS)' : 'Cobertura del Servicio'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formValorPremio}
                    disabled={formTipoPremio === 'servicio_gratis'}
                    onChange={(e) => setFormValorPremio(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825] disabled:opacity-50"
                  />
                </div>

                {/* Vigencia en Días */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Vigencia del Cupón (Días)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={formValidezDias}
                    onChange={(e) => setFormValidezDias(parseInt(e.target.value) || 45)}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                  />
                </div>

                {/* Ícono Visual Vectorial */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Ícono de la Membresía
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'sparkles', label: 'Destello', icon: Sparkles },
                      { id: 'award', label: 'Premio', icon: Award },
                      { id: 'flower', label: 'Spa', icon: Layers },
                      { id: 'shield', label: 'VIP', icon: ShieldCheck },
                      { id: 'heart', label: 'Corazón', icon: Heart },
                    ].map(item => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormIcono(item.id)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                            formIcono === item.id
                              ? 'bg-[#7A3B3B] text-white scale-110 shadow-xs'
                              : 'bg-[#FAF8F5] border-[#EDE8E1] text-[#5A524A] hover:bg-[#EDE8E1]'
                          }`}
                          title={item.label}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Paleta de Color Visual (Borde Fino) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Color del Borde Fino de la Tarjeta
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { key: 'rose', label: 'Borde Rosa', bg: 'bg-[#A04355]' },
                      { key: 'wine', label: 'Borde Borgoña', bg: 'bg-[#7A3B3B]' },
                      { key: 'emerald', label: 'Borde Esmeralda', bg: 'bg-[#2D5A46]' },
                      { key: 'dark', label: 'Borde Grafito', bg: 'bg-[#3C3530]' },
                      { key: 'gold', label: 'Borde Dorado', bg: 'bg-[#B38E46]' },
                      { key: 'violet', label: 'Borde Velvet', bg: 'bg-[#694273]' },
                    ].map(col => (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => setFormColorTema(col.key as ColorTemaTarjeta)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          formColorTema === col.key
                            ? 'border-[#2A2825] ring-2 ring-[#7A3B3B] shadow-xs'
                            : 'border-[#EDE8E1] hover:border-[#8A7F74]'
                        }`}
                      >
                        <div className={`w-full h-5 rounded-md ${col.bg} mb-1`} />
                        <span className="text-[10px] font-bold text-[#3C3530] block truncate">
                          {col.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Previsualización en Vivo de la Tarjeta Blanca */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center justify-between">
                    <span>Previsualización (Tarjeta blanca con borde fino de color)</span>
                    <span className="text-[11px] font-semibold text-[#8A7F74]">
                      {formEstampitas} corazones meta
                    </span>
                  </label>
                  <div className={`bg-white rounded-2xl p-4 sm:p-5 border ${getCardBorderStyle(formColorTema).borderStyle} shadow-2xs`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-2 rounded-xl ${getCardBorderStyle(formColorTema).lightBg} border ${getCardBorderStyle(formColorTema).borderStyle} flex items-center justify-center`}>
                          {formCategoria === 'Masajes' ? (
                            <Layers className="w-5 h-5 text-[#4A8068]" />
                          ) : formCategoria === 'Facial' ? (
                            <Award className="w-5 h-5 text-[#7A3B3B]" />
                          ) : formCategoria === 'Todas' ? (
                            <ShieldCheck className="w-5 h-5 text-[#4A423A]" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-[#A04355]" />
                          )}
                        </span>
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCardBorderStyle(formColorTema).badgeColor}`}>
                            {formCategoria}
                          </span>
                          <h5 className="text-sm font-extrabold text-[#2A2825] mt-0.5">
                            {formNombre || 'Nombre de la Membresía'}
                          </h5>
                        </div>
                      </div>
                      <span className="text-xs font-black text-red-600 bg-rose-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                        <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                        {formEstampitas}
                      </span>
                    </div>

                    <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl p-3 mb-2">
                      <span className="text-[10px] font-bold text-[#8A7F74] uppercase tracking-wider block mb-2">
                        Muestra de sellos (los obtenidos se ponen rojos):
                      </span>
                      {renderEstampillasDinamicas(2, formEstampitas)}
                    </div>

                    <div className="text-[11px] text-[#5A524A] flex items-center justify-between pt-1">
                      <span className="font-semibold truncate flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-700" />
                        <span>{formRecompensa || 'Premio a configurar'}</span>
                      </span>
                      <span className="text-[10px] text-[#8A7F74] shrink-0 font-mono">{formValidezDias} días vigencia</span>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Descripción / Términos de la Membresía
                  </label>
                  <textarea
                    rows={2}
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder="Detalles sobre qué tratamientos aplican a esta tarjeta..."
                    className="w-full px-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setModalTarjetaAbierto(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#EDE8E1] text-xs font-bold text-[#5A524A] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {tarjetaEnEdicion ? 'Guardar Cambios' : 'Crear Membresía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ACREDITAR ESTAMPITA DIRECTA A CLIENTE ── */}
      {modalAcreditarManual && clienteSeleccionadoManual && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#EDE8E1] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
              <h3 className="text-base font-extrabold text-[#2A2825]">
                Sellar Estampita en Mostrador
              </h3>
              <button
                type="button"
                onClick={() => setModalAcreditarManual(false)}
                className="p-1.5 rounded-lg text-[#8A7F74] hover:bg-[#FAF8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1]">
              <span className="text-[11px] text-[#8A7F74] block">Cliente:</span>
              <p className="font-extrabold text-sm text-[#2A2825]">
                {clienteSeleccionadoManual.nombre} {clienteSeleccionadoManual.apellido}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider block">
                Seleccioná a qué tarjeta de membresía sumará el sello:
              </label>
              <div className="space-y-2">
                {tiposTarjetas.filter(t => t.activa).map(tipo => {
                  const local = lealtadService.getTarjetaCliente(clienteSeleccionadoManual.usuarioId);
                  const progreso = local.progresosPorTipo?.[tipo.id]?.estampitasActuales || 0;
                  const esSeleccionada = tipoTarjetaSeleccionadaManual === tipo.id;

                  return (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => setTipoTarjetaSeleccionadaManual(tipo.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        esSeleccionada
                          ? 'border-[#7A3B3B] bg-rose-50/50 ring-2 ring-[#7A3B3B]/30'
                          : 'border-[#EDE8E1] bg-white hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{tipo.icono}</span>
                        <div>
                          <p className="text-xs font-bold text-[#2A2825]">{tipo.nombre}</p>
                          <p className="text-[11px] text-[#8A7F74]">
                            Progreso: {progreso} / {tipo.estampitasRequeridas} sellos
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#7A3B3B]">
                        +1 sello
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE8E1]">
              <button
                type="button"
                onClick={() => setModalAcreditarManual(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#5A524A] hover:bg-[#FAF8F5]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAcreditacionManual}
                className="px-5 py-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirmar y Sellar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
