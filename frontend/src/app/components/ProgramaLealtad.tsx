import { useState, useEffect } from 'react';
import { QrCode, Award, Search, CheckCircle, Trophy, RefreshCw, Loader2, X, Sparkles } from 'lucide-react';
import { usuariosApi, fidelizacionApi, type UsuarioDetalleDto, type TarjetaFidelizacionDto } from '../../services/api';

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
  const [activeTab, setActiveTab] = useState<'tarjetas' | 'clientes' | 'validar'>('tarjetas');
  const [searchTerm, setSearchTerm] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [validatingQr, setValidatingQr] = useState(false);
  const [qrResultado, setQrResultado] = useState<string | null>(null);

  const [clientesTarjetas, setClientesTarjetas] = useState<ClienteConTarjeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para sumar estampitas manuales
  const [clienteSeleccionado, setClienteSeleccionado] = useState<UsuarioDetalleDto | null>(null);
  const [estampitasToAdd, setEstampitasToAdd] = useState(1);
  const [motivoToAdd, setMotivoToAdd] = useState('Atención en el centro');
  const [savingEstampitas, setSavingEstampitas] = useState(false);

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
      const clientes = await usuariosApi.getClientes();
      const conTarjetas: ClienteConTarjeta[] = await Promise.all(
        clientes.map(async (u) => {
          try {
            const tarjeta = await fidelizacionApi.getTarjetaPorUsuario(u.usuarioId);
            return { usuario: u, tarjeta };
          } catch {
            return { usuario: u };
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

  const handleValidarQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode) return;
    setValidatingQr(true);
    setQrResultado(null);
    try {
      const res = await fidelizacionApi.escanearQr(qrCode);
      setQrResultado(res.mensaje || `¡Estampita acreditada con éxito!`);
      setQrCode('');
      await cargarDatosLealtad();
    } catch (err: any) {
      setQrResultado(`Error al validar: ${err.message}`);
    } finally {
      setValidatingQr(false);
    }
  };

  const handleSumarEstampitas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSeleccionado) return;
    setSavingEstampitas(true);
    try {
      await fidelizacionApi.acumularEstampitas(clienteSeleccionado.usuarioId, estampitasToAdd, motivoToAdd);
      await cargarDatosLealtad();
      alert(`¡Se sumaron ${estampitasToAdd} estampitas a ${clienteSeleccionado.nombre}!`);
      setClienteSeleccionado(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingEstampitas(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2A2825]">Programa de Lealtad & Fidelización</h2>
          <p className="text-sm text-[#8A7F74] mt-0.5">Control de estampillas digitales, cupones y validación QR</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="flex gap-2 px-4 py-2">
            <button
              onClick={() => setActiveTab('tarjetas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'tarjetas'
                  ? 'bg-[#3C3530] text-white shadow-sm'
                  : 'text-[#8A7F74] hover:text-[#2A2825]'
              }`}
            >
              Tarjetas & Beneficios
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'clientes'
                  ? 'bg-[#3C3530] text-white shadow-sm'
                  : 'text-[#8A7F74] hover:text-[#2A2825]'
              }`}
            >
              Progreso de Clientes
            </button>
            <button
              onClick={() => setActiveTab('validar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'validar'
                  ? 'bg-[#3C3530] text-white shadow-sm'
                  : 'text-[#8A7F74] hover:text-[#2A2825]'
              }`}
            >
              Escanear / Validar QR
            </button>
          </div>
        </div>

        <div className="p-6">
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
                          <button
                            onClick={() => setClienteSeleccionado(c.usuario)}
                            className="px-3 py-1.5 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                          >
                            + Estampitas
                          </button>
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
                          <span>Falta para premio: <strong className="text-[#7A3B3B]">{10 - estampitas} sellos</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'validar' && (
            <div className="max-w-lg mx-auto py-6">
              <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-white rounded-2xl border border-[#EDE8E1] flex items-center justify-center mx-auto mb-4 text-[#7A3B3B]">
                  <QrCode className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-[#2A2825] mb-1">Validación de Código QR</h3>
                <p className="text-xs text-[#8A7F74] mb-6">
                  Ingresá el código o token de QR presentado por el cliente tras completar su pago o sesión.
                </p>

                {qrResultado && (
                  <div className="mb-4 p-3 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]">
                    {qrResultado}
                  </div>
                )}

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
                    className="w-full py-2.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {validatingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Validar y Otorgar Estampilla
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL AGREGAR ESTAMPITAS */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE8E1] w-full max-w-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-[#EDE8E1] pb-3 text-[#7A3B3B]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#2A2825]">Sumar Estampitas</h3>
              </div>
              <button
                onClick={() => setClienteSeleccionado(null)}
                className="p-1 rounded-lg text-[#8A7F74] hover:bg-[#FAF8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8A7F74] mb-3">
              Cliente: <strong className="text-[#2A2825]">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</strong>
            </p>

            <form onSubmit={handleSumarEstampitas} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Cantidad de Estampitas</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={estampitasToAdd}
                  onChange={(e) => setEstampitasToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Motivo / Concepto</label>
                <input
                  type="text"
                  value={motivoToAdd}
                  onChange={(e) => setMotivoToAdd(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  placeholder="Ej. Servicio completado"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setClienteSeleccionado(null)}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEstampitas}
                  className="px-4 py-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {savingEstampitas ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
