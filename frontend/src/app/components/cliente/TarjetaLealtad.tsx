import { QrCode, Gift, Award, Clock, CheckCircle, Trophy } from 'lucide-react';

export function TarjetaLealtad() {
  const tarjetas = [
    {
      id: '1',
      nombre: 'Tarjeta Facial',
      icono: '✨',
      estampillasActuales: 7,
      estampillasRequeridas: 10,
      recompensa: '1 Facial Gratis',
      colorFrom: 'from-purple-500',
      colorTo: 'to-pink-500'
    },
    {
      id: '3',
      nombre: 'Tarjeta Premium',
      icono: '👑',
      estampillasActuales: 12,
      estampillasRequeridas: 15,
      recompensa: 'Servicio Premium Gratis',
      colorFrom: 'from-blue-500',
      colorTo: 'to-purple-500'
    }
  ];

  const historialRecompensas = [
    { fecha: '2026-04-15', recompensa: '1 Facial Gratis', canjeado: true },
    { fecha: '2026-03-20', recompensa: '1 Facial Gratis', canjeado: true },
    { fecha: '2026-05-10', recompensa: 'Servicio Premium Gratis', canjeado: false }
  ];

  const renderEstampillas = (actual: number, total: number) => {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, idx) => (
          <div
            key={idx}
            className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
              idx < actual
                ? 'bg-white border-white shadow-md scale-105'
                : 'bg-white/20 border-white/30'
            }`}
          >
            {idx < actual ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/40" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mi Programa de Lealtad</h1>
        <p className="text-muted-foreground">Acumula estampillas y obtén recompensas exclusivas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8" />
            <div>
              <p className="text-3xl font-bold">
                {tarjetas.reduce((acc, t) => acc + t.estampillasActuales, 0)}
              </p>
              <p className="text-sm opacity-90">Estampillas Totales</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="text-3xl font-bold">2</p>
              <p className="text-sm opacity-90">Tarjetas Activas</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8" />
            <div>
              <p className="text-3xl font-bold">
                {historialRecompensas.filter(r => r.canjeado).length}
              </p>
              <p className="text-sm opacity-90">Recompensas Canjeadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mis Tarjetas */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Mis Tarjetas</h2>
        <div className="space-y-6">
          {tarjetas.map((tarjeta) => {
            const porcentaje = (tarjeta.estampillasActuales / tarjeta.estampillasRequeridas) * 100;
            const isComplete = porcentaje >= 100;

            return (
              <div
                key={tarjeta.id}
                className={`bg-gradient-to-br ${tarjeta.colorFrom} ${tarjeta.colorTo} text-white rounded-2xl p-8 shadow-xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{tarjeta.icono}</div>
                    <div>
                      <h3 className="text-2xl font-bold">{tarjeta.nombre}</h3>
                      <p className="text-sm opacity-90">
                        {tarjeta.estampillasActuales} / {tarjeta.estampillasRequeridas} estampillas
                      </p>
                    </div>
                  </div>
                  {isComplete && (
                    <div className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      ¡Completa!
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm opacity-90 mt-2">
                    {isComplete
                      ? '¡Felicitaciones! Tu tarjeta está completa'
                      : `Te faltan ${tarjeta.estampillasRequeridas - tarjeta.estampillasActuales} estampillas`}
                  </p>
                </div>

                {/* Estampillas */}
                {renderEstampillas(tarjeta.estampillasActuales, tarjeta.estampillasRequeridas)}

                {/* Recompensa */}
                <div className="mt-6 pt-6 border-t border-white/30">
                  <p className="text-sm opacity-75 mb-1">Recompensa</p>
                  <p className="text-xl font-bold">{tarjeta.recompensa}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Código QR */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Mi Código QR</h2>
        <div className="bg-white rounded-xl shadow-md border border-border p-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-gray-100 w-64 h-64 mx-auto rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
            <p className="text-muted-foreground mb-4">
              Muestra este código al terminar tu servicio para acumular estampillas
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <strong>ID de Cliente:</strong> #CLI-001-MGZ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Historial de Recompensas</h2>
        <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {historialRecompensas.map((item, idx) => (
              <div key={idx} className="p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  {item.canjeado ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-semibold">{item.recompensa}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.fecha).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    item.canjeado
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {item.canjeado ? 'Canjeado' : 'Disponible'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Award className="w-5 h-5" />
          ¿Cómo funciona?
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Acumula una estampilla por cada servicio realizado</li>
          <li>• Al completar una tarjeta, obtén tu recompensa automáticamente</li>
          <li>• Muestra tu código QR en recepción después de cada servicio</li>
          <li>• Las recompensas no tienen fecha de vencimiento</li>
        </ul>
      </div>
    </div>
  );
}

export default TarjetaLealtad;
