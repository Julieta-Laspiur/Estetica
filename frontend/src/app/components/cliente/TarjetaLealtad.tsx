import { useState, useEffect } from 'react';
import { QrCode, Gift, Award, Clock, CheckCircle2, Trophy, Sparkles, ShieldCheck, Layers } from 'lucide-react';
import type { AuthUser } from '../../../services/api';
import {
  lealtadService,
  type TarjetaClienteLocal,
  type TipoTarjetaMembresia,
  type ColorTemaTarjeta,
  EVENTO_ESTAMPITA_ACREDITADA,
  EVENTO_TIPOS_TARJETAS_ACTUALIZADOS
} from '../../../services/lealtadService';

interface TarjetaLealtadProps {
  currentUser?: AuthUser | null;
}

export function TarjetaLealtad({ currentUser }: TarjetaLealtadProps) {
  const clienteNombre = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Carla Gómez';
  const clienteCodigo = currentUser ? `#CLI-${String(currentUser.usuarioId).padStart(3, '0')}-VIP` : '#CLI-101-VIP';

  const [tarjetaCliente, setTarjetaCliente] = useState<TarjetaClienteLocal>(() =>
    lealtadService.getTarjetaCliente(currentUser?.usuarioId || 101, clienteNombre)
  );
  const [tiposTarjetas, setTiposTarjetas] = useState<TipoTarjetaMembresia[]>(() =>
    lealtadService.getTiposTarjetas().filter(t => t.activa)
  );
  const [nuevaEstampitaCelebracion, setNuevaEstampitaCelebracion] = useState(false);
  const [mensajeCelebracion, setMensajeCelebracion] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      const actual = lealtadService.getTarjetaCliente(currentUser?.usuarioId || 101, clienteNombre);
      setTarjetaCliente(actual);
      setNuevaEstampitaCelebracion(true);
      if (e?.detail?.tipoTarjeta?.nombre) {
        setMensajeCelebracion(`¡Sumaste 1 sello en ${e.detail.tipoTarjeta.nombre}!`);
      } else {
        setMensajeCelebracion('¡Recepción acaba de acreditarte una estampita digital!');
      }
      setTimeout(() => setNuevaEstampitaCelebracion(false), 8000);
    };

    const handleTipos = () => {
      setTiposTarjetas(lealtadService.getTiposTarjetas().filter(t => t.activa));
    };

    window.addEventListener(EVENTO_ESTAMPITA_ACREDITADA, handler);
    window.addEventListener(EVENTO_TIPOS_TARJETAS_ACTUALIZADOS, handleTipos);

    return () => {
      window.removeEventListener(EVENTO_ESTAMPITA_ACREDITADA, handler);
      window.removeEventListener(EVENTO_TIPOS_TARJETAS_ACTUALIZADOS, handleTipos);
    };
  }, [currentUser, clienteNombre]);

  // Helpers de estilos para cada tema de tarjeta
  const getCardStyle = (tema: ColorTemaTarjeta) => {
    switch (tema) {
      case 'rose':
        return {
          bgGradient: 'bg-gradient-to-br from-[#A04355] via-[#852C3E] to-[#5C1B28]',
          borderStyle: 'border-pink-300/30',
          badgeColor: 'bg-[#6E2232] text-[#FCDDEC] border border-pink-300/30',
          accentText: 'text-[#FCDDEC]',
        };
      case 'wine':
        return {
          bgGradient: 'bg-gradient-to-br from-[#7A3B3B] via-[#652E2E] to-[#451B1B]',
          borderStyle: 'border-[#9E5555]/30',
          badgeColor: 'bg-[#522020] text-[#F3E7C4] border border-[#F3E7C4]/30',
          accentText: 'text-[#F5EAD4]',
        };
      case 'emerald':
        return {
          bgGradient: 'bg-gradient-to-br from-[#2D5A46] via-[#204434] to-[#142B20]',
          borderStyle: 'border-emerald-300/30',
          badgeColor: 'bg-[#193629] text-[#D1F2D9] border border-emerald-300/30',
          accentText: 'text-[#D1F2D9]',
        };
      case 'dark':
        return {
          bgGradient: 'bg-gradient-to-br from-[#3C3530] via-[#2A2420] to-[#1A1614]',
          borderStyle: 'border-[#5A4F46]/50',
          badgeColor: 'bg-[#25201C] text-[#E5C378] border border-[#E5C378]/30',
          accentText: 'text-[#E5C378]',
        };
      case 'gold':
        return {
          bgGradient: 'bg-gradient-to-br from-[#B38E46] via-[#8C6D2E] to-[#5E471B]',
          borderStyle: 'border-amber-300/30',
          badgeColor: 'bg-[#523F18] text-[#FFF0C8] border border-amber-300/30',
          accentText: 'text-[#FFF0C8]',
        };
      case 'violet':
        return {
          bgGradient: 'bg-gradient-to-br from-[#694273] via-[#512D5C] to-[#361A3D]',
          borderStyle: 'border-purple-300/30',
          badgeColor: 'bg-[#401E49] text-[#F0D5F7] border border-purple-300/30',
          accentText: 'text-[#F0D5F7]',
        };
      default:
        return {
          bgGradient: 'bg-gradient-to-br from-[#7A3B3B] to-[#451B1B]',
          borderStyle: 'border-[#9E5555]/30',
          badgeColor: 'bg-[#522020] text-[#F3E7C4] border border-[#F3E7C4]/30',
          accentText: 'text-[#F5EAD4]',
        };
    }
  };

  // Historial ilustrativo de canjes
  const historialRecompensas = [
    { fecha: '2026-04-15', servicio: 'Esmaltado Semipermanente Gratis', tarjeta: 'Membresía Uñas', canjeado: true },
    { fecha: '2026-03-20', servicio: 'Limpieza Facial Profunda (30% OFF)', tarjeta: 'Membresía Facial', canjeado: true },
    { fecha: '2026-05-10', servicio: 'Sesión Masaje Descontracturante Bonificado', tarjeta: 'Membresía Spa', canjeado: false }
  ];

  // Cálculo de estampillas totales acumuladas en todas las tarjetas
  const totalEstampillas = tiposTarjetas.reduce((acc, tipo) => {
    const progreso = tarjetaCliente.progresosPorTipo?.[tipo.id]?.estampitasActuales;
    if (progreso !== undefined) return acc + progreso;
    if (tipo.id === 'card-unas') return acc + 4;
    if (tipo.id === 'card-facial') return acc + tarjetaCliente.estampitasActuales;
    return acc + 1;
  }, 0);

  const recompensasCanjeadas = historialRecompensas.filter(r => r.canjeado).length;

  const renderEstampillas = (actual: number, total: number, icono: string) => {
    return (
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {Array.from({ length: total }).map((_, idx) => {
          const isStamped = idx < actual;
          return (
            <div
              key={idx}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
                isStamped
                  ? 'bg-white shadow-md border-2 border-white scale-105'
                  : 'bg-white/10 border-2 border-white/20'
              }`}
            >
              {isStamped ? (
                <span className="text-lg sm:text-xl">{icono || '✓'}</span>
              ) : (
                <span className="text-xs font-mono font-bold text-white/40">{idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8">
      {/* Toast de Estampita Acreditada en vivo */}
      {nuevaEstampitaCelebracion && (
        <div className="fixed top-6 right-6 z-50 px-5 py-4 rounded-3xl shadow-2xl flex items-center gap-3.5 border bg-[#7A3B3B] text-white border-white/20 animate-in fade-in slide-in-from-top-6">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-[#F3E7C4] animate-spin" />
          </div>
          <div>
            <p className="font-extrabold text-sm text-white">¡Nueva Estampita Acreditada! 🎉</p>
            <p className="text-xs text-[#F5EAD4]">
              {mensajeCelebracion || 'Recepción acaba de sellar tu tarjeta digital de fidelidad.'}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header principal */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE8E1] text-[#7A3B3B] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Club de Fidelidad & Membresías Exclusivas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">
              Mis Tarjetas de Membresía
            </h1>
            <p className="text-sm text-[#8A7F74] mt-1">
              Acumulá estampillas adaptadas a cada servicio (5 sellos en Uñas, 8 en Faciales, etc.) y disfrutá de premios directos.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF8F5] px-4 py-3 rounded-2xl border border-[#EDE8E1] self-start md:self-auto">
            <div className="w-10 h-10 rounded-full bg-[#7A3B3B] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {clienteNombre.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-[#8A7F74]">Titular de Membresía</p>
              <p className="text-sm font-bold text-[#2A2825]">{clienteNombre}</p>
            </div>
          </div>
        </div>

        {/* Métricas / Stats de Fidelidad */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Métrica 1: Estampillas Totales */}
          <div className="bg-gradient-to-br from-[#7A3B3B] to-[#5C2B2B] text-white rounded-3xl p-6 shadow-md border border-[#8C4343] relative overflow-hidden group">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-[#F5EAD4] border border-white/20">
                <Gift className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white leading-none">
                  {totalEstampillas}
                </p>
                <p className="text-xs uppercase tracking-wider text-[#F5EAD4] font-semibold mt-1.5">
                  Estampillas Totales
                </p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          </div>

          {/* Métrica 2: Tarjetas Activas */}
          <div className="bg-gradient-to-br from-[#3C3530] to-[#25201C] text-white rounded-3xl p-6 shadow-md border border-[#4F4640] relative overflow-hidden group">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-[#E5C378] border border-white/20">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white leading-none">
                  {tiposTarjetas.length}
                </p>
                <p className="text-xs uppercase tracking-wider text-[#E5C378] font-semibold mt-1.5">
                  Membresías Disponibles
                </p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          </div>

          {/* Métrica 3: Recompensas Canjeadas */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1] flex items-center justify-center text-[#7A3B3B] shadow-2xs">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#3C3530] leading-none">
                {recompensasCanjeadas}
              </p>
              <p className="text-xs uppercase tracking-wider text-[#8A7F74] font-semibold mt-1.5">
                Premios Desbloqueados
              </p>
            </div>
          </div>
        </div>

        {/* Sección: Mis Tarjetas Dinámicas */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825]">
                Tus Tarjetas en Curso por Especialidad
              </h2>
              <p className="text-xs text-[#8A7F74]">
                Cada categoría suma sellos en su tarjeta correspondiente con su meta individual de visitas
              </p>
            </div>
            <span className="text-xs text-[#7A3B3B] font-bold bg-[#FAF8F5] px-3 py-1.5 rounded-full border border-[#EDE8E1] self-start sm:self-auto">
              Mostrá tu pase en recepción para sellar
            </span>
          </div>

          <div className="space-y-6">
            {tiposTarjetas.map((tarjeta) => {
              const estilo = getCardStyle(tarjeta.colorTema);

              // Obtener progreso específico de esta tarjeta para el cliente
              const progresoLocal = tarjetaCliente.progresosPorTipo?.[tarjeta.id];
              const estampitas = progresoLocal
                ? progresoLocal.estampitasActuales
                : tarjeta.id === 'card-unas'
                ? 4 // 4 de 5 para Carla
                : tarjeta.id === 'card-facial'
                ? Math.min(tarjeta.estampitasRequeridas, tarjetaCliente.estampitasActuales || 6)
                : tarjeta.id === 'card-masajes'
                ? 2
                : 3;

              const porcentaje = Math.min(100, Math.round((estampitas / tarjeta.estampitasRequeridas) * 100));
              const isComplete = estampitas >= tarjeta.estampitasRequeridas;
              const faltan = Math.max(0, tarjeta.estampitasRequeridas - estampitas);

              return (
                <div
                  key={tarjeta.id}
                  className={`${estilo.bgGradient} text-white rounded-3xl p-6 sm:p-8 shadow-xl border ${estilo.borderStyle} relative overflow-hidden transition-all duration-300 hover:shadow-2xl`}
                >
                  {/* Detalle visual superior de la tarjeta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-2xl border border-white/20 shadow-inner">
                        {tarjeta.icono}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${estilo.badgeColor}`}>
                            {tarjeta.categoria}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                          {tarjeta.nombre}
                        </h3>
                        <p className="text-xs text-white/80 mt-0.5">
                          {estampitas} de {tarjeta.estampitasRequeridas} estampillas completadas
                        </p>
                      </div>
                    </div>

                    {isComplete ? (
                      <div className="bg-white text-[#7A3B3B] px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto">
                        <Gift className="w-4 h-4 text-emerald-600" />
                        <span>¡Tarjeta Completa! Lista para Canjear</span>
                      </div>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-medium text-white/90 border border-white/20 self-start sm:self-auto">
                        Faltan {faltan} sello{faltan === 1 ? '' : 's'} para el premio
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6 bg-black/20 p-4 rounded-2xl border border-white/10">
                    <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-white/90 to-white h-full rounded-full transition-all duration-700 shadow-xs"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-white/85 mt-2.5">
                      <span>Progreso: {porcentaje}%</span>
                      <span className={estilo.accentText}>
                        {isComplete
                          ? '¡Meta alcanzada!'
                          : `${estampitas}/${tarjeta.estampitasRequeridas} visitas en ${tarjeta.categoria}`}
                      </span>
                    </div>
                  </div>

                  {/* Grilla de estampillas DINÁMICAS (5 para uñas, 8 para facial, etc.) */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                      Estampillas acumuladas ({tarjeta.estampitasRequeridas} requeridas):
                    </p>
                    {renderEstampillas(estampitas, tarjeta.estampitasRequeridas, tarjeta.icono)}
                  </div>

                  {/* Bloque Recompensa */}
                  <div className="pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                        Premio al completar {tarjeta.estampitasRequeridas} sellos:
                      </p>
                      <p className={`text-base sm:text-lg font-bold ${estilo.accentText}`}>
                        {tarjeta.recompensaTitulo}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-white/60 block font-mono">
                        {clienteCodigo}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección: Pase Digital / Código QR del Cliente */}
        <div className="bg-white rounded-3xl border border-[#EDE8E1] p-6 sm:p-8 shadow-xs">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE8E1] text-[#3C3530]">
              <QrCode className="w-3.5 h-3.5" />
              <span>Pase Digital en Recepción</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825]">
              Tu Pase Personal de Fidelidad
            </h2>
            <p className="text-xs sm:text-sm text-[#8A7F74]">
              Presentá este código en recepción al abonar tu turno para que registremos tu estampilla de manera instantánea.
            </p>

            <div className="bg-[#FAF8F5] border border-[#EDE8E1] p-6 rounded-3xl inline-block shadow-2xs">
              <div className="w-48 h-48 bg-white rounded-2xl border border-[#EDE8E1] flex items-center justify-center p-3 shadow-inner">
                <QrCode className="w-36 h-36 text-[#3C3530]" />
              </div>
            </div>

            <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-3.5 text-xs text-[#5A524A] flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7A3B3B]" />
              <span>Código de Cliente Verificado:</span>
              <strong className="font-mono text-[#7A3B3B]">{clienteCodigo}</strong>
            </div>
          </div>
        </div>

        {/* Historial de Recompensas */}
        <div className="bg-white rounded-3xl border border-[#EDE8E1] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
            <h2 className="text-xl font-bold text-[#2A2825]">
              Historial de Recompensas
            </h2>
            <span className="text-xs text-[#8A7F74]">
              {historialRecompensas.length} registros
            </span>
          </div>

          <div className="divide-y divide-[#EDE8E1]">
            {historialRecompensas.map((item, idx) => (
              <div
                key={idx}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2A2825]">
                      {item.servicio}
                    </h3>
                    <p className="text-xs text-[#8A7F74]">
                      {item.tarjeta} • {item.fecha}
                    </p>
                  </div>
                </div>

                <div>
                  {item.canjeado ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Canjeado en Cita
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      Disponible para Canjear
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
