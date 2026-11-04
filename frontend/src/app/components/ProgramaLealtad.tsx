import { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Award,
  Search,
  CheckCircle,
  Trophy,
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
  ShieldCheck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { usuariosApi, fidelizacionApi, type UsuarioDetalleDto, type TarjetaFidelizacionDto, type ResultadoEscaneoQrDto } from '../../services/api';
import {
  lealtadService,
  type SolicitudEstampitaQr,
  EVENTO_QR_SOLICITUD_CREADA,
  EVENTO_ESTAMPITA_ACREDITADA
} from '../../services/lealtadService';

interface EstampitaCard {
  id: string;
  nombre: string;
  descripcion: string;
  estampillasRequeridas: number;
  recompensa: string;
  descuento: number;
  activa: boolean;
  icono: string;
}

interface ClienteConTarjeta {
  usuario: UsuarioDetalleDto;
  tarjeta?: TarjetaFidelizacionDto;
}

export function ProgramaLealtad() {
  const [solicitudes, setSolicitudes] = useState<SolicitudEstampitaQr[]>(() => lealtadService.getSolicitudes());
  const [activeTab, setActiveTab] = useState<'pendientes' | 'validar' | 'clientes' | 'tarjetas'>('pendientes');
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

  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const solicitudesAcreditadas = solicitudes.filter(s => s.estado === 'acreditado');

  const tarjetas: EstampitaCard[] = [
    {
      id: '1',
      nombre: 'Tarjeta Digital Integral',
      descripcion: 'Acumulá 10 estampillas en cualquier tratamiento y obtené tu cupón de regalo',
      estampillasRequeridas: 10,
      recompensa: '1 Tratamiento o Descuento Especial',
      descuento: 100,
      activa: true,
      icono: '✨'
    },
    {
      id: '2',
      nombre: 'Club de Belleza Facial',
      descripcion: 'Beneficio exclusivo tras sesiones de higiene y renovación cutánea',
      estampillasRequeridas: 10,
      recompensa: '25% de Descuento en Próxima Sesión',
      descuento: 25,
      activa: true,
      icono: '💆'
    },
  ];

  const cargarDatosLealtad = async () => {
    setLoading(true);
    try {
      setSolicitudes(lealtadService.getSolicitudes());
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

  // Escuchar solicitudes de QR del profesional en tiempo real
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

    window.addEventListener(EVENTO_QR_SOLICITUD_CREADA, handleNuevaSolicitud);
    window.addEventListener(EVENTO_ESTAMPITA_ACREDITADA, handleAcreditacion);
    window.addEventListener('estetica_qr_solicitud_actualizada', handleAcreditacion);

    return () => {
      window.removeEventListener(EVENTO_QR_SOLICITUD_CREADA, handleNuevaSolicitud);
      window.removeEventListener(EVENTO_ESTAMPITA_ACREDITADA, handleAcreditacion);
      window.removeEventListener('estetica_qr_solicitud_actualizada', handleAcreditacion);
    };
  }, []);

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

  const procesarToken = async (token: string) => {
    if (!token) return;
    setValidatingQr(true);
    setQrError(null);
    setResultadoEscaneo(null);

    // Intentar primero con el servicio de lealtad local conectado
    const resLocal = lealtadService.acreditarQr(token, 'Administradora');
    if (resLocal.exito && resLocal.solicitud) {
      setResultadoEscaneo({
        exitoso: true,
        mensaje: resLocal.mensaje,
        clienteNombre: resLocal.solicitud.clienteNombre,
        estampitasActuales: resLocal.tarjetaActualizada?.estampitasActuales || 1,
        progreso: `${resLocal.tarjetaActualizada?.estampitasActuales || 1}/10`,
        cicloCompletado: resLocal.premioAlcanzado || false,
        cuponGenerado: resLocal.premioAlcanzado
          ? {
              cuponId: 999,
              codigo: `PREMIO-VIP-${Date.now().toString().slice(-4)}`,
              descuento: 100,
              fechaExpiracion: '2026-12-31',
              mensaje: '¡Premio desbloqueado! 100% OFF en tu próxima sesión de cabina.'
            }
          : undefined,
      });
      setQrCode('');
      setSolicitudes(lealtadService.getSolicitudes());
      await cargarDatosLealtad();
      setValidatingQr(false);
      return;
    }

    // Fallback con API Backend
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

  // Flujo Paso 4 y 5: El admin acredita directamente el QR pendiente
  const handleAcreditarDirecto = (sol: SolicitudEstampitaQr) => {
    const res = lealtadService.acreditarQr(sol.codigoQr, 'Administradora');
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

  const totalClientes = clientesTarjetas.length;
  const totalEstampitas = clientesTarjetas.reduce((acc, c) => acc + (c.tarjeta?.estampitasActuales || 0), 0);
  const totalCupones = clientesTarjetas.reduce((acc, c) => acc + (c.tarjeta?.cuponesDisponibles || 0), 0);

  const filteredClientes = clientesTarjetas.filter(c => {
    const fullName = `${c.usuario.nombre} ${c.usuario.apellido}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || c.usuario.email.toLowerCase().includes(query);
  });

  const renderEstampillas = (actual: number, total: number = 10) => {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: total }).map((_, idx) => (
          <div
            key={idx}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
              idx < actual
                ? 'bg-[#7A3B3B] border-[#7A3B3B] text-white shadow-sm'
                : 'bg-[#FAF8F5] border-[#EDE8E1] text-[#8A7F74]'
            }`}
          >
            {idx < actual ? '✓' : idx + 1}
          </div>
        ))}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2A2825]">Programa de Lealtad & Fidelización</h2>
          <p className="text-sm text-[#8A7F74] mt-0.5">Control de estampillas digitales, validación de turnos y cupones</p>
        </div>
        <button
          onClick={cargarDatosLealtad}
          disabled={loading}
          className="p-2.5 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] transition-colors self-start sm:self-auto"
          title="Refrescar estado"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Card: QRs Pendientes por Acreditar */}
        <div className={`border rounded-2xl p-5 shadow-sm transition-all ${
          solicitudesPendientes.length > 0
            ? 'bg-amber-50/70 border-amber-200 ring-1 ring-amber-300'
            : 'bg-white border-[#EDE8E1]'
        }`}>
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

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FAF8F5] rounded-xl text-[#3C3530]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2A2825]">{totalClientes}</p>
              <p className="text-xs text-[#8A7F74]">Clientes en Programa</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-sm">
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

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-700">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{totalCupones}</p>
              <p className="text-xs text-amber-700">Cupones Disponibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-[#EDE8E1] bg-[#FAF8F5]">
          <div className="flex flex-wrap gap-2 px-4 py-2">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'pendientes'
                  ? 'bg-[#7A3B3B] text-white shadow-sm'
                  : 'text-[#4A423A] hover:bg-[#EAE1D3] hover:text-[#2A2825]'
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
              onClick={() => setActiveTab('validar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'validar'
                  ? 'bg-[#3C3530] text-white shadow-sm'
                  : 'text-[#8A7F74] hover:text-[#2A2825]'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Escanear con Cámara / Token</span>
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'clientes'
                  ? 'bg-[#3C3530] text-white shadow-sm'
                  : 'text-[#8A7F74] hover:text-[#2A2825]'
              }`}
            >
              Progreso de Clientes
            </button>

            <button
              onClick={() => setActiveTab('tarjetas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tarjetas'
                  ? 'bg-[#3C3530] text-white shadow-sm'
                  : 'text-[#8A7F74] hover:text-[#2A2825]'
              }`}
            >
              Tarjetas & Beneficios
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* ── 1. SECCIÓN PRINCIPAL: QRs POR ACREDITAR (FLUJO PROFESIONAL -> ADMIN) ── */}
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
                  {solicitudesPendientes.map((sol) => (
                    <div
                      key={sol.id}
                      className="p-5 rounded-2xl bg-white border-2 border-[#DDD5C8] hover:border-[#7A3B3B] shadow-sm space-y-4 transition-all relative overflow-hidden"
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
                        </div>

                        {/* Mini QR ilustrativo con código token */}
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
                  ))}
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
                        <div className="text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Acreditado por {sol.acreditadoPor || 'Administración'}
                          </span>
                          <span className="text-[10px] text-[#8A7F74] block mt-0.5">
                            {sol.fechaAcreditacion}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 2. SECCIÓN: ESCANEO CON CÁMARA O TOKEN MANUAL ── */}
          {activeTab === 'validar' && (
            <div className="max-w-lg mx-auto py-6">
              <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl p-6 sm:p-7 text-center">
                <div className="w-14 h-14 bg-white rounded-2xl border border-[#EDE8E1] flex items-center justify-center mx-auto mb-4 text-[#7A3B3B] shadow-sm">
                  <QrCode className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-[#2A2825] mb-1">Escanear y Validar Código QR</h3>
                <p className="text-xs text-[#8A7F74] mb-5 leading-relaxed">
                  Escaneá el código QR generado por el profesional desde la cabina o ingresá el código de verificación manualmente.
                </p>

                {/* Mensaje de Error */}
                {qrError && (
                  <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 text-left flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Error en la validación</p>
                      <p className="mt-0.5">{qrError}</p>
                    </div>
                  </div>
                )}

                {/* Resultado Exitoso */}
                {resultadoEscaneo && (
                  <div className="mb-5 p-5 bg-white border border-[#EDE8E1] rounded-2xl text-center space-y-3 shadow-xs animate-in zoom-in-95">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#2A2825]">¡Estampita Acreditada con Éxito!</p>
                      <p className="text-xs text-[#8A7F74] mt-0.5">{resultadoEscaneo.mensaje}</p>
                    </div>

                    <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl p-3">
                      <p className="text-xs text-[#8A7F74]">Cliente beneficiario:</p>
                      <p className="font-bold text-sm text-[#2A2825]">{resultadoEscaneo.clienteNombre}</p>
                      <p className="text-xs font-semibold text-[#7A3B3B] mt-1">
                        Progreso actual: {resultadoEscaneo.estampitasActuales} / 10 estampitas
                      </p>
                    </div>

                    {resultadoEscaneo.cicloCompletado && resultadoEscaneo.cuponGenerado && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900">
                        <p className="font-bold flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          ¡Completó 10 estampitas!
                        </p>
                        <p className="text-[11px] text-amber-800">
                          Se generó el cupón: <strong className="font-mono bg-white px-1.5 py-0.5 rounded">{resultadoEscaneo.cuponGenerado.codigo}</strong> ({resultadoEscaneo.cuponGenerado.descuento}% OFF).
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setResultadoEscaneo(null)}
                      className="px-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] text-[#3C3530] hover:bg-[#EDE8E1] rounded-xl text-xs font-semibold"
                    >
                      Escanear Otro Código
                    </button>
                  </div>
                )}

                {/* Opción 1: Lector con Cámara */}
                <div className="space-y-3 mb-5">
                  <div id="qr-reader-container" className="rounded-2xl overflow-hidden bg-black/5 max-w-sm mx-auto" />

                  {cameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Detener Cámara
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full py-2.5 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Activar Cámara para Escanear</span>
                    </button>
                  )}
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#EDE8E1]"></div>
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-[#8A7F74]">
                    <span className="bg-[#FAF8F5] px-3 font-semibold">o ingresar token manual</span>
                  </div>
                </div>

                {/* Opción 2: Formulario Manual */}
                <form onSubmit={handleValidarQR} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Pegá o escribí el token del QR aquí..."
                    className="w-full px-4 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                  <button
                    type="submit"
                    disabled={validatingQr || !qrCode}
                    className="w-full py-2.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {validatingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Validar Token y Otorgar Estampita
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── 3. SECCIÓN: PROGRESO DE CLIENTES ── */}
          {activeTab === 'clientes' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              {loading ? (
                <div className="py-12 text-center text-[#8A7F74]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
                  <p className="text-xs">Cargando estado de fidelización...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClientes.map((c) => {
                    const estampitas = c.tarjeta?.estampitasActuales ?? 0;
                    const cupones = c.tarjeta?.cuponesDisponibles ?? 0;

                    return (
                      <div
                        key={c.usuario.usuarioId}
                        className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-sm text-[#2A2825]">
                              {c.usuario.nombre} {c.usuario.apellido}
                            </h4>
                            <p className="text-xs text-[#8A7F74]">{c.usuario.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF8F5] text-[#7A3B3B] rounded-xl text-xs font-semibold border border-[#EDE8E1]">
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Vía QR de Turno</span>
                          </div>
                        </div>

                        <div className="bg-white border border-[#EDE8E1] rounded-xl p-3 mb-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[#8A7F74]">Sellos acumulados:</span>
                            <span className="font-bold text-[#7A3B3B]">{estampitas} / 10</span>
                          </div>
                          {renderEstampillas(estampitas, 10)}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#8A7F74]">
                          <span>Cupones ganados: <strong className="text-[#2A2825]">{cupones}</strong></span>
                          <span>Falta para premio: <strong className="text-[#7A3B3B]">{Math.max(0, 10 - estampitas)} sellos</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 4. SECCIÓN: TARJETAS & BENEFICIOS ── */}
          {activeTab === 'tarjetas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tarjetas.map((tarjeta) => (
                <div
                  key={tarjeta.id}
                  className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-6 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{tarjeta.icono}</span>
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-[11px] font-semibold rounded-full">
                      Activa
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#2A2825] mb-1">{tarjeta.nombre}</h3>
                  <p className="text-xs text-[#8A7F74] mb-4">{tarjeta.descripcion}</p>

                  <div className="bg-white border border-[#EDE8E1] rounded-xl p-3 mb-4">
                    <p className="text-[11px] text-[#8A7F74]">Recompensa al completar:</p>
                    <p className="text-xs font-bold text-[#7A3B3B] mt-0.5">{tarjeta.recompensa}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#8A7F74] mb-2 font-medium">Visualización de tarjeta (10 sellos):</p>
                    {renderEstampillas(4, tarjeta.estampillasRequeridas)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
