import { useState } from 'react';
import { Gift, QrCode, Award, Search, Plus, CheckCircle, Clock, Trophy } from 'lucide-react';

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

interface ClienteLealtad {
  id: string;
  nombre: string;
  email: string;
  tarjetas: {
    cardId: string;
    estampillasActuales: number;
    completadas: number;
  }[];
  historialRecompensas: {
    fecha: string;
    recompensa: string;
    canjeado: boolean;
  }[];
}

export function ProgramaLealtad() {
  const [activeTab, setActiveTab] = useState<'tarjetas' | 'clientes' | 'validar'>('tarjetas');
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCode, setQrCode] = useState('');

  const tarjetas: EstampitaCard[] = [
    {
      id: '1',
      nombre: 'Tarjeta Facial',
      descripcion: 'Acumula 10 estampillas en tratamientos faciales',
      estampillasRequeridas: 10,
      recompensa: '1 Facial Gratis',
      descuento: 100,
      activa: true,
      icono: '✨'
    },
    {
      id: '2',
      nombre: 'Tarjeta Masajes',
      descripcion: 'Acumula 8 estampillas en masajes',
      estampillasRequeridas: 8,
      recompensa: '25% de descuento',
      descuento: 25,
      activa: true,
      icono: '💆'
    },
    {
      id: '3',
      nombre: 'Tarjeta Premium',
      descripcion: 'Acumula 15 estampillas en cualquier servicio',
      estampillasRequeridas: 15,
      recompensa: 'Servicio Premium Gratis',
      descuento: 100,
      activa: true,
      icono: '👑'
    },
    {
      id: '4',
      nombre: 'Tarjeta Uñas',
      descripcion: 'Acumula 6 estampillas en servicios de uñas',
      estampillasRequeridas: 6,
      recompensa: '1 Manicura Gratis',
      descuento: 100,
      activa: true,
      icono: '💅'
    },
  ];

  const clientesLealtad: ClienteLealtad[] = [
    {
      id: '1',
      nombre: 'María González',
      email: 'maria.gonzalez@email.com',
      tarjetas: [
        { cardId: '1', estampillasActuales: 7, completadas: 2 },
        { cardId: '3', estampillasActuales: 12, completadas: 0 }
      ],
      historialRecompensas: [
        { fecha: '2026-04-15', recompensa: '1 Facial Gratis', canjeado: true },
        { fecha: '2026-03-20', recompensa: '1 Facial Gratis', canjeado: true }
      ]
    },
    {
      id: '2',
      nombre: 'Ana Rodríguez',
      email: 'ana.rodriguez@email.com',
      tarjetas: [
        { cardId: '2', estampillasActuales: 5, completadas: 1 },
        { cardId: '4', estampillasActuales: 4, completadas: 1 }
      ],
      historialRecompensas: [
        { fecha: '2026-05-01', recompensa: '25% de descuento', canjeado: false }
      ]
    },
    {
      id: '3',
      nombre: 'Laura Fernández',
      email: 'laura.fernandez@email.com',
      tarjetas: [
        { cardId: '3', estampillasActuales: 14, completadas: 1 }
      ],
      historialRecompensas: [
        { fecha: '2026-05-10', recompensa: 'Servicio Premium Gratis', canjeado: false }
      ]
    },
  ];

  const handleValidarQR = () => {
    if (qrCode) {
      alert(`QR validado: ${qrCode}\n¡Estampilla agregada correctamente!`);
      setQrCode('');
    }
  };

  const renderEstampillas = (actual: number, total: number) => {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, idx) => (
          <div
            key={idx}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${idx < actual
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-600 text-white'
              : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}
          >
            {idx < actual ? <CheckCircle className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-gray-300" />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Programa de Lealtad</h2>
          <p className="text-muted-foreground mt-1">Sistema de estampillas digitales con validación QR</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          Nueva Tarjeta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{tarjetas.length}</p>
              <p className="text-sm opacity-90">Tarjetas Activas</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">342</p>
              <p className="text-sm opacity-90">Clientes Inscritos</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-sm opacity-90">Estampillas Otorgadas</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">87</p>
              <p className="text-sm opacity-90">Recompensas Canjeadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-lg">
        <div className="border-b border-border">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('tarjetas')}
              className={`py-4 px-4 border-b-2 transition-colors ${activeTab === 'tarjetas'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Tarjetas de Lealtad
              </div>
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`py-4 px-4 border-b-2 transition-colors ${activeTab === 'clientes'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Clientes
              </div>
            </button>
            <button
              onClick={() => setActiveTab('validar')}
              className={`py-4 px-4 border-b-2 transition-colors ${activeTab === 'validar'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Validar QR
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'tarjetas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tarjetas.map((tarjeta) => (
                  <div
                    key={tarjeta.id}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{tarjeta.icono}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{tarjeta.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{tarjeta.descripcion}</p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${tarjeta.activa ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Estampillas necesarias:</span>
                        <span className="font-bold text-purple-600">{tarjeta.estampillasRequeridas}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Recompensa:</span>
                        <span className="font-semibold text-green-600">{tarjeta.recompensa}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-2">Ejemplo de progreso:</p>
                      {renderEstampillas(Math.floor(tarjeta.estampillasRequeridas * 0.6), tarjeta.estampillasRequeridas)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'clientes' && (
            <div className="space-y-4">
              <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {clientesLealtad.map((cliente) => (
                <div key={cliente.id} className="bg-secondary rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                        {cliente.nombre.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold">{cliente.nombre}</h3>
                        <p className="text-sm text-muted-foreground">{cliente.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Trophy className="w-5 h-5" />
                      <span className="font-semibold">
                        {cliente.tarjetas.reduce((acc, t) => acc + t.completadas, 0)} completadas
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cliente.tarjetas.map((tarjeta) => {
                      const tarjetaInfo = tarjetas.find(t => t.id === tarjeta.cardId);
                      if (!tarjetaInfo) return null;

                      const porcentaje = (tarjeta.estampillasActuales / tarjetaInfo.estampillasRequeridas) * 100;

                      return (
                        <div key={tarjeta.cardId} className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{tarjetaInfo.icono}</span>
                              <div>
                                <p className="font-medium">{tarjetaInfo.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  {tarjeta.estampillasActuales} / {tarjetaInfo.estampillasRequeridas} estampillas
                                </p>
                              </div>
                            </div>
                            {porcentaje >= 100 && (
                              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                <Gift className="w-4 h-4" />
                                ¡Recompensa disponible!
                              </div>
                            )}
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(porcentaje, 100)}%` }}
                            />
                          </div>

                          {renderEstampillas(tarjeta.estampillasActuales, tarjetaInfo.estampillasRequeridas)}
                        </div>
                      );
                    })}
                  </div>

                  {cliente.historialRecompensas.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h4 className="font-medium mb-2 text-sm">Historial de Recompensas</h4>
                      <div className="space-y-2">
                        {cliente.historialRecompensas.map((recompensa, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-white rounded p-2">
                            <div className="flex items-center gap-2">
                              {recompensa.canjeado ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-600" />
                              )}
                              <span>{recompensa.recompensa}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{new Date(recompensa.fecha).toLocaleDateString('es-AR')}</span>
                              <span className={`px-2 py-1 rounded text-xs ${recompensa.canjeado ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {recompensa.canjeado ? 'Canjeado' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'validar' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-8">
                <div className="text-center mb-8">
                  <div className="inline-block p-4 bg-purple-100 rounded-full mb-4">
                    <QrCode className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Validar Código QR</h3>
                  <p className="text-muted-foreground">
                    Escanea el código QR del cliente para agregar una estampilla
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Código QR del Cliente</label>
                    <input
                      type="text"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      placeholder="Ingresa o escanea el código QR..."
                      className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleValidarQR}
                    disabled={!qrCode}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Validar y Agregar Estampilla
                  </button>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    ¿Cómo funciona?
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Cada cliente tiene un código QR único</li>
                    <li>• Al completar un servicio, escanea su código</li>
                    <li>• El sistema agrega automáticamente una estampilla</li>
                    <li>• Cuando completa la tarjeta, recibe su recompensa</li>
                  </ul>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-border">
                    <div className="text-center mb-2">
                      <div className="w-32 h-32 mx-auto bg-gray-200 rounded flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      QR de ejemplo
                    </p>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    <p className="text-sm font-medium">Última validación:</p>
                    <p className="text-xs text-muted-foreground">María González</p>
                    <p className="text-xs text-muted-foreground">Tarjeta Facial - 7/10</p>
                    <p className="text-xs text-muted-foreground">Hace 15 minutos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
