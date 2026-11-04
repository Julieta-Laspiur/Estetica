import { useState, useEffect } from 'react';
import { Gift, Award, Clock, CheckCircle2, Trophy, ShieldCheck, Layers, Heart, Sparkles } from 'lucide-react';
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
  const clienteNombre = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Cliente Estética';
  const clienteId = currentUser?.usuarioId || (currentUser?.email ? currentUser.email.toLowerCase().trim() : 'guest');
  const clienteCodigo = currentUser?.usuarioId ? `#CLI-${String(currentUser.usuarioId).padStart(3, '0')}-VIP` : '#CLI-VIP';

  const [tarjetaCliente, setTarjetaCliente] = useState<TarjetaClienteLocal>(() =>
    lealtadService.getTarjetaCliente(clienteId, clienteNombre)
  );
  const [tiposTarjetas, setTiposTarjetas] = useState<TipoTarjetaMembresia[]>(() =>
    lealtadService.getTiposTarjetas().filter(t => t.activa)
  );
  const [nuevaEstampitaCelebracion, setNuevaEstampitaCelebracion] = useState(false);
  const [mensajeCelebracion, setMensajeCelebracion] = useState<string | null>(null);

  useEffect(() => {
    const actual = lealtadService.getTarjetaCliente(clienteId, clienteNombre);
    setTarjetaCliente(actual);
  }, [clienteId, clienteNombre]);

  useEffect(() => {
    const handler = (e: any) => {
      const actual = lealtadService.getTarjetaCliente(clienteId, clienteNombre);
      setTarjetaCliente(actual);
      setNuevaEstampitaCelebracion(true);
      if (e?.detail?.tipoTarjeta?.nombre) {
        setMensajeCelebracion(`¡Sumaste 1 corazón en ${e.detail.tipoTarjeta.nombre}!`);
      } else {
        setMensajeCelebracion('¡Recepción acaba de acreditarte un corazón en tu tarjeta!');
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

  // Estilos de borde fino de color y detalles según la especialidad
  const getCardStyle = (tema: ColorTemaTarjeta) => {
    switch (tema) {
      case 'rose':
        return {
          borderStyle: 'border-[#E08A97]',
          badgeColor: 'bg-pink-50 text-[#A04355] border-pink-200',
          accentColor: '#A04355',
          progressBg: 'bg-[#A04355]',
          accentText: 'text-[#A04355]',
          lightBg: 'bg-pink-50/60',
        };
      case 'wine':
        return {
          borderStyle: 'border-[#7A3B3B]',
          badgeColor: 'bg-[#FAF0F0] text-[#7A3B3B] border-[#7A3B3B]/30',
          accentColor: '#7A3B3B',
          progressBg: 'bg-[#7A3B3B]',
          accentText: 'text-[#7A3B3B]',
          lightBg: 'bg-[#FAF0F0]/60',
        };
      case 'emerald':
        return {
          borderStyle: 'border-[#4A8068]',
          badgeColor: 'bg-emerald-50 text-[#2D5A46] border-emerald-200',
          accentColor: '#2D5A46',
          progressBg: 'bg-[#2D5A46]',
          accentText: 'text-[#2D5A46]',
          lightBg: 'bg-emerald-50/60',
        };
      case 'dark':
        return {
          borderStyle: 'border-[#4A423A]',
          badgeColor: 'bg-stone-100 text-[#3C3530] border-stone-300',
          accentColor: '#3C3530',
          progressBg: 'bg-[#3C3530]',
          accentText: 'text-[#3C3530]',
          lightBg: 'bg-stone-100/60',
        };
      case 'gold':
        return {
          borderStyle: 'border-[#C5A358]',
          badgeColor: 'bg-amber-50 text-[#8C6D2E] border-amber-200',
          accentColor: '#B38E46',
          progressBg: 'bg-[#B38E46]',
          accentText: 'text-[#8C6D2E]',
          lightBg: 'bg-amber-50/60',
        };
      case 'violet':
        return {
          borderStyle: 'border-[#8F5B9B]',
          badgeColor: 'bg-purple-50 text-[#694273] border-purple-200',
          accentColor: '#694273',
          progressBg: 'bg-[#694273]',
          accentText: 'text-[#694273]',
          lightBg: 'bg-purple-50/60',
        };
      default:
        return {
          borderStyle: 'border-[#7A3B3B]',
          badgeColor: 'bg-[#FAF0F0] text-[#7A3B3B] border-[#7A3B3B]/30',
          accentColor: '#7A3B3B',
          progressBg: 'bg-[#7A3B3B]',
          accentText: 'text-[#7A3B3B]',
          lightBg: 'bg-[#FAF0F0]/60',
        };
    }
  };

  // Historial de canjes
  const historialRecompensas = [
    { fecha: '2026-04-15', servicio: 'Esmaltado Semipermanente Gratis', tarjeta: 'Membresía Uñas', canjeado: true },
    { fecha: '2026-03-20', servicio: 'Limpieza Facial Profunda (30% OFF)', tarjeta: 'Membresía Facial', canjeado: true },
    { fecha: '2026-05-10', servicio: 'Sesión Masaje Descontracturante Bonificado', tarjeta: 'Membresía Spa', canjeado: false }
  ];

  const totalEstampillas = tiposTarjetas.reduce((acc, tipo) => {
    const progreso = tarjetaCliente.progresosPorTipo?.[tipo.id]?.estampitasActuales;
    if (progreso !== undefined) return acc + progreso;
    if (tipo.id === 'card-unas') return acc + 4;
    if (tipo.id === 'card-facial') return acc + (tarjetaCliente.estampitasActuales || 6);
    return acc + 1;
  }, 0);

  const recompensasCanjeadas = historialRecompensas.filter(r => r.canjeado).length;

  // Renderizador de Estampitas de CORAZÓN que se vuelven ROJAS al obtenerlas
  const renderEstampillas = (actual: number, total: number) => {
    return (
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        {Array.from({ length: total }).map((_, idx) => {
          const isStamped = idx < actual;
          return (
            <div
              key={idx}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isStamped
                  ? 'bg-rose-50 border border-red-200 shadow-xs scale-105'
                  : 'bg-[#FAF8F5] border border-[#EDE8E1] hover:border-[#DDD5C8]'
              }`}
            >
              {isStamped ? (
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-red-500 fill-red-500 drop-shadow-xs transition-all duration-300 animate-in zoom-in-75" />
              ) : (
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#DDD5C8] stroke-[1.5]" />
              )}
              <span className={`text-[9px] font-mono font-bold mt-0.5 ${isStamped ? 'text-red-500 font-extrabold' : 'text-[#8A7F74]'}`}>
                {isStamped ? '✓' : idx + 1}
              </span>
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
        <div className="fixed top-6 right-6 z-50 px-5 py-4 rounded-3xl shadow-2xl flex items-center gap-3.5 border bg-white text-[#2A2825] border-red-200 animate-in fade-in slide-in-from-top-6">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-red-200 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
          </div>
          <div>
            <p className="font-extrabold text-sm text-[#2A2825]">¡Nuevo Corazón Acreditado!</p>
            <p className="text-xs text-[#8A7F74]">
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
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>Club de Fidelidad & Membresías</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">
              Mis Tarjetas de Fidelidad
            </h1>
            <p className="text-sm text-[#8A7F74] mt-1">
              Juntá corazones en cada cita y obtené tratamientos bonificados y descuentos exclusivos.
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
          {/* Métrica 1: Corazones Totales */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-red-500 shadow-2xs">
              <Heart className="w-7 h-7 fill-red-500 text-red-500" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#2A2825] leading-none">
                {totalEstampillas}
              </p>
              <p className="text-xs uppercase tracking-wider text-[#8A7F74] font-semibold mt-1.5">
                Corazones Acumulados
              </p>
            </div>
          </div>

          {/* Métrica 2: Tarjetas Disponibles */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1] flex items-center justify-center text-[#3C3530] shadow-2xs">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#2A2825] leading-none">
                {tiposTarjetas.length}
              </p>
              <p className="text-xs uppercase tracking-wider text-[#8A7F74] font-semibold mt-1.5">
                Membresías Activas
              </p>
            </div>
          </div>

          {/* Métrica 3: Recompensas Desbloqueadas */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1] flex items-center justify-center text-[#7A3B3B] shadow-2xs">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#2A2825] leading-none">
                {recompensasCanjeadas}
              </p>
              <p className="text-xs uppercase tracking-wider text-[#8A7F74] font-semibold mt-1.5">
                Premios Desbloqueados
              </p>
            </div>
          </div>
        </div>

        {/* Sección: Mis Tarjetas en Blanco con Borde Fino de Color */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825]">
                Tus Tarjetas en Curso por Especialidad
              </h2>
              <p className="text-xs text-[#8A7F74]">
                Cada tarjeta suma corazones según el tratamiento realizado hasta alcanzar la recompensa
              </p>
            </div>
            <span className="text-xs text-[#7A3B3B] font-bold bg-[#FAF8F5] px-3 py-1.5 rounded-full border border-[#EDE8E1] self-start sm:self-auto">
              Sellado automático en cada cita
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
                  className={`bg-white text-[#2A2825] rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-300 border ${estilo.borderStyle} relative overflow-hidden`}
                >
                  {/* Detalle visual superior de la tarjeta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${estilo.lightBg} border ${estilo.borderStyle} flex items-center justify-center shadow-2xs`}>
                        {tarjeta.categoria === 'Masajes' ? (
                          <Layers className="w-6 h-6 text-[#4A8068]" />
                        ) : tarjeta.categoria === 'Facial' ? (
                          <Award className="w-6 h-6 text-[#7A3B3B]" />
                        ) : tarjeta.categoria === 'Todas' ? (
                          <ShieldCheck className="w-6 h-6 text-[#4A423A]" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-[#A04355]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${estilo.badgeColor}`}>
                            {tarjeta.categoria}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-[#2A2825] tracking-wide">
                          {tarjeta.nombre}
                        </h3>
                        <p className="text-xs text-[#8A7F74] mt-0.5">
                          {estampitas} de {tarjeta.estampitasRequeridas} corazones acumulados
                        </p>
                      </div>
                    </div>

                    {isComplete ? (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-2xs self-start sm:self-auto">
                        <Gift className="w-4 h-4 text-emerald-600" />
                        <span>¡Tarjeta Completa! Lista para Canjear</span>
                      </div>
                    ) : (
                      <div className="bg-[#FAF8F5] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#5A524A] border border-[#EDE8E1] self-start sm:self-auto">
                        Faltan {faltan} corazón{faltan === 1 ? '' : 'es'} para el premio
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE8E1]">
                    <div className="w-full bg-[#EDE8E1] rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`${estilo.progressBg} h-full rounded-full transition-all duration-700 shadow-xs`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-[#5A524A] mt-2.5">
                      <span>Progreso: <strong>{porcentaje}%</strong></span>
                      <span className={estilo.accentText}>
                        {isComplete
                          ? '¡Meta alcanzada!'
                          : `${estampitas}/${tarjeta.estampitasRequeridas} visitas en ${tarjeta.categoria}`}
                      </span>
                    </div>
                  </div>

                  {/* Grilla de estampillas: CORAZONES QUE SE PONEN ROJOS */}
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#8A7F74] mb-3">
                      Estampillas acumuladas ({tarjeta.estampitasRequeridas} corazones requeridos):
                    </p>
                    {renderEstampillas(estampitas, tarjeta.estampitasRequeridas)}
                  </div>

                  {/* Bloque Recompensa */}
                  <div className="pt-5 border-t border-[#EDE8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A7F74]">
                        Premio al completar {tarjeta.estampitasRequeridas} corazones:
                      </p>
                      <p className={`text-base sm:text-lg font-bold ${estilo.accentText}`}>
                        {tarjeta.recompensaTitulo}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#8A7F74] block font-mono">
                        {clienteCodigo}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
