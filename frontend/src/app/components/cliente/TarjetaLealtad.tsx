import { QrCode, Gift, Award, Clock, CheckCircle2, Trophy, Sparkles, ShieldCheck, Crown } from 'lucide-react';
import type { AuthUser } from '../../../services/api';

interface TarjetaLealtadProps {
  currentUser?: AuthUser | null;
}

export function TarjetaLealtad({ currentUser }: TarjetaLealtadProps) {
  const clienteNombre = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Valentina Rossi';
  const clienteCodigo = currentUser ? `#CLI-${String(currentUser.usuarioId).padStart(3, '0')}-VIP` : '#CLI-001-VIP';

  const tarjetas = [
    {
      id: '1',
      nombre: 'Tarjeta Facial & Skincare',
      categoria: 'Cuidado Cutáneo',
      icono: Sparkles,
      estampillasActuales: 7,
      estampillasRequeridas: 10,
      recompensa: '1 Limpieza Facial Profunda Gratis',
      variante: 'wine' as const,
      bgGradient: 'bg-gradient-to-br from-[#7A3B3B] via-[#652E2E] to-[#451B1B]',
      borderStyle: 'border-[#9E5555]/30',
      badgeColor: 'bg-[#522020] text-[#F3E7C4] border border-[#F3E7C4]/30',
      accentText: 'text-[#F5EAD4]',
    },
    {
      id: '2',
      nombre: 'Tarjeta VIP Tratamientos Corporales',
      categoria: 'Membresía Exclusiva',
      icono: Crown,
      estampillasActuales: 12,
      estampillasRequeridas: 15,
      recompensa: '1 Sesión Masaje Descontracturante & Spa',
      variante: 'dark' as const,
      bgGradient: 'bg-gradient-to-br from-[#3C3530] via-[#2A2420] to-[#1A1614]',
      borderStyle: 'border-[#5A4F46]/50',
      badgeColor: 'bg-[#25201C] text-[#E5C378] border border-[#E5C378]/30',
      accentText: 'text-[#E5C378]',
    }
  ];

  const historialRecompensas = [
    { fecha: '2026-04-15', recompensa: '1 Facial Hidratante Profundo', canjeado: true },
    { fecha: '2026-03-20', recompensa: '1 Masaje Relajante de Espalda', canjeado: true },
    { fecha: '2026-05-10', recompensa: 'Servicio Dermoestético Premium', canjeado: false }
  ];

  const totalEstampillas = tarjetas.reduce((acc, t) => acc + t.estampillasActuales, 0);
  const recompensasCanjeadas = historialRecompensas.filter(r => r.canjeado).length;

  const renderEstampillas = (actual: number, total: number, variante: 'wine' | 'dark') => {
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
                variante === 'wine' ? (
                  <Sparkles className="w-5 h-5 text-[#7A3B3B]" />
                ) : (
                  <Crown className="w-5 h-5 text-[#C5A059]" />
                )
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header principal */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE8E1] text-[#7A3B3B] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Club de Fidelidad & Recompensas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">
              Mi Tarjeta de Fidelidad
            </h1>
            <p className="text-sm text-[#8A7F74] mt-1">
              Acumulá estampillas en cada sesión y disfrutá de tratamientos gratuitos y beneficios exclusivos.
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
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white leading-none">
                  {tarjetas.length}
                </p>
                <p className="text-xs uppercase tracking-wider text-[#E5C378] font-semibold mt-1.5">
                  Tarjetas Activas
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
                Recompensas Canjeadas
              </p>
            </div>
          </div>
        </div>

        {/* Sección: Mis Tarjetas */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825]">
              Tus Tarjetas en Curso
            </h2>
            <span className="text-xs text-[#8A7F74] font-medium">
              Mostrá tu QR en cada cita para sellar
            </span>
          </div>

          <div className="space-y-6">
            {tarjetas.map((tarjeta) => {
              const porcentaje = (tarjeta.estampillasActuales / tarjeta.estampillasRequeridas) * 100;
              const isComplete = porcentaje >= 100;
              const IconComp = tarjeta.icono;

              return (
                <div
                  key={tarjeta.id}
                  className={`${tarjeta.bgGradient} text-white rounded-3xl p-6 sm:p-8 shadow-xl border ${tarjeta.borderStyle} relative overflow-hidden transition-all duration-300 hover:shadow-2xl`}
                >
                  {/* Detalle visual superior de la tarjeta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-inner">
                        <IconComp className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${tarjeta.badgeColor}`}>
                            {tarjeta.categoria}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                          {tarjeta.nombre}
                        </h3>
                        <p className="text-xs text-white/80 mt-0.5">
                          {tarjeta.estampillasActuales} de {tarjeta.estampillasRequeridas} estampillas completadas
                        </p>
                      </div>
                    </div>

                    {isComplete ? (
                      <div className="bg-white text-[#7A3B3B] px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto">
                        <Gift className="w-4 h-4" />
                        <span>¡Tarjeta Lista para Canjear!</span>
                      </div>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-medium text-white/90 border border-white/20 self-start sm:self-auto">
                        Faltan {tarjeta.estampillasRequeridas - tarjeta.estampillasActuales} para el premio
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-6 bg-black/20 p-4 rounded-2xl border border-white/10">
                    <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-white/90 to-white h-full rounded-full transition-all duration-700 shadow-xs"
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-white/85 mt-2.5">
                      <span>Progreso: {Math.round(porcentaje)}%</span>
                      <span className={tarjeta.accentText}>
                        {isComplete
                          ? '¡Meta alcanzada!'
                          : `${tarjeta.estampillasActuales}/${tarjeta.estampillasRequeridas} visitas`}
                      </span>
                    </div>
                  </div>

                  {/* Grilla de estampillas */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                      Estampillas acumuladas:
                    </p>
                    {renderEstampillas(tarjeta.estampillasActuales, tarjeta.estampillasRequeridas, tarjeta.variante)}
                  </div>

                  {/* Bloque Recompensa */}
                  <div className="pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                        Premio al completar
                      </p>
                      <p className={`text-base sm:text-lg font-bold ${tarjeta.accentText}`}>
                        {tarjeta.recompensa}
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

        {/* Sección: Código QR del Cliente */}
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
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.canjeado ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FAF8F5] text-[#7A3B3B]'
                  }`}>
                    {item.canjeado ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#2A2825]">{item.recompensa}</p>
                    <p className="text-xs text-[#8A7F74]">
                      {new Date(item.fecha).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      item.canjeado
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-[#7A3B3B]/10 text-[#7A3B3B] border border-[#7A3B3B]/20'
                    }`}
                  >
                    {item.canjeado ? 'Canjeado con Éxito' : 'Disponible para Canjear'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guía explicativa con colores coordinados */}
        <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 sm:p-7 shadow-xs">
          <h3 className="font-bold text-sm sm:text-base text-[#7A3B3B] mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#7A3B3B]" />
            ¿Cómo funciona el Programa de Fidelidad?
          </h3>
          <ul className="text-xs sm:text-sm text-[#5A524A] space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A3B3B] mt-2 flex-shrink-0" />
              <span><strong>Sumá estampillas:</strong> Recibís 1 estampilla automáticamente por cada tratamiento o servicio completado en cabina.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A3B3B] mt-2 flex-shrink-0" />
              <span><strong>Premios directos:</strong> Al llenar tu tarjeta, tu recompensa queda activa para canjear en tu próxima visita sin costo adicional.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A3B3B] mt-2 flex-shrink-0" />
              <span><strong>Presentá tu pase:</strong> Mostrá tu código QR en recepción al momento de abonar tu consulta o sesión.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A3B3B] mt-2 flex-shrink-0" />
              <span><strong>Sin vencimiento:</strong> Tus beneficios y estampillas acumuladas no caducan.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TarjetaLealtad;
