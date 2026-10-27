import { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, Award, Unlock, CheckCircle2, XCircle, Loader2, RefreshCw, UserCheck, ShieldAlert, X, KeyRound, Copy, Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { usuariosApi, fidelizacionApi, authApi, type UsuarioDetalleDto } from '../../services/api';

export function Clientes() {
  const [clientes, setClientes] = useState<UsuarioDetalleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal Nuevo Cliente
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [savingNuevo, setSavingNuevo] = useState(false);
  const [nuevoError, setNuevoError] = useState<string | null>(null);

  // Modal Fidelización / Estampitas
  const [selectedCliente, setSelectedCliente] = useState<UsuarioDetalleDto | null>(null);
  const [estampitasCliente, setEstampitasCliente] = useState<number | null>(null);
  const [loadingEstampitas, setLoadingEstampitas] = useState(false);
  const [estampitasToAdd, setEstampitasToAdd] = useState(1);
  const [motivoEstampitas, setMotivoEstampitas] = useState('Atención en centro estético');
  const [savingEstampitas, setSavingEstampitas] = useState(false);

  // Modal Resetear Contraseña
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [clienteParaReset, setClienteParaReset] = useState<UsuarioDetalleDto | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetExitoso, setResetExitoso] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const cargarClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usuariosApi.getClientes();
      setClientes(data);
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
      setError(err.message || 'No se pudo cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleToggleEstado = async (cliente: UsuarioDetalleDto) => {
    setActionLoadingId(cliente.usuarioId);
    try {
      const nuevoEstado = !cliente.activo;
      await usuariosApi.cambiarEstado(cliente.usuarioId, nuevoEstado, nuevoEstado ? 'Activado por administración' : 'Desactivado por administración');
      setClientes(prev => prev.map(c => c.usuarioId === cliente.usuarioId ? { ...c, activo: nuevoEstado } : c));
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDesbloquear = async (cliente: UsuarioDetalleDto) => {
    setActionLoadingId(cliente.usuarioId);
    try {
      await usuariosApi.desbloquear(cliente.usuarioId);
      setClientes(prev => prev.map(c => c.usuarioId === cliente.usuarioId ? { ...c, bloqueado: false, intentosFallidos: 0 } : c));
      alert(`La cuenta de ${cliente.nombre} ${cliente.apellido} ha sido desbloqueada.`);
    } catch (err: any) {
      alert(`Error al desbloquear: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const generarPasswordSegura = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const pass = `Estetica${num}!`;
    setNuevaPassword(pass);
    setShowPassword(true);
  };

  const handleOpenResetPassword = (cliente: UsuarioDetalleDto) => {
    setClienteParaReset(cliente);
    const num = Math.floor(1000 + Math.random() * 9000);
    setNuevaPassword(`Estetica${num}!`);
    setShowPassword(true);
    setResetError(null);
    setResetExitoso(false);
    setCopiado(false);
    setResetModalOpen(true);
  };

  const handleConfirmarReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteParaReset) return;
    if (!nuevaPassword || nuevaPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSubmittingReset(true);
    setResetError(null);
    try {
      await usuariosApi.resetPassword(clienteParaReset.usuarioId, nuevaPassword);
      setClientes(prev => prev.map(c => c.usuarioId === clienteParaReset.usuarioId ? {
        ...c,
        bloqueado: false,
        intentosFallidos: 0,
        activo: true
      } : c));
      setResetExitoso(true);
    } catch (err: any) {
      setResetError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleCopiarPassword = async () => {
    if (!nuevaPassword) return;
    try {
      await navigator.clipboard.writeText(nuevaPassword);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleAbrirLealtad = async (cliente: UsuarioDetalleDto) => {
    setSelectedCliente(cliente);
    setLoadingEstampitas(true);
    setEstampitasCliente(null);
    try {
      const tarjeta = await fidelizacionApi.getTarjetaPorUsuario(cliente.usuarioId);
      setEstampitasCliente(tarjeta?.estampitasActuales ?? 0);
    } catch (err) {
      setEstampitasCliente(0);
    } finally {
      setLoadingEstampitas(false);
    }
  };

  const handleSumarEstampitas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;
    setSavingEstampitas(true);
    try {
      await fidelizacionApi.acumularEstampitas(selectedCliente.usuarioId, estampitasToAdd, motivoEstampitas);
      const tarjeta = await fidelizacionApi.getTarjetaPorUsuario(selectedCliente.usuarioId);
      setEstampitasCliente(tarjeta?.estampitasActuales ?? 0);
      alert(`¡Se acreditaron ${estampitasToAdd} estampitas exitosamente a ${selectedCliente.nombre}!`);
      setSelectedCliente(null);
    } catch (err: any) {
      alert(`Error al sumar estampitas: ${err.message}`);
    } finally {
      setSavingEstampitas(false);
    }
  };

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNuevo(true);
    setNuevoError(null);
    try {
      if (!nombre || !apellido || !email || !password) {
        throw new Error('Todos los campos obligatorios deben completarse.');
      }
      await authApi.register(nombre, apellido, email, telefono, password, 0);
      await cargarClientes();
      setShowModalNuevo(false);
      setNombre('');
      setApellido('');
      setEmail('');
      setTelefono('');
      setPassword('');
      alert('¡Cliente creado y registrado en la base de datos con éxito!');
    } catch (err: any) {
      setNuevoError(err.message || 'Error al crear el cliente.');
    } finally {
      setSavingNuevo(false);
    }
  };

  const filteredClientes = clientes.filter(cliente => {
    const fullName = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return (
      fullName.includes(query) ||
      cliente.email.toLowerCase().includes(query) ||
      (cliente.telefono && cliente.telefono.includes(query))
    );
  });

  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter(c => c.activo).length;
  const clientesBloqueados = clientes.filter(c => c.bloqueado).length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2A2825]">Gestión de Clientes</h2>
          <p className="text-sm text-[#8A7F74] mt-0.5">Control de cuentas, accesos y fidelización de clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarClientes}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] transition-colors"
            title="Refrescar clientes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModalNuevo(true)}
            className="flex items-center gap-2 bg-[#3C3530] hover:bg-[#2A2825] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas en Vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A7F74]">Total de Clientes</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#3C3530]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2A2825] mt-2">{totalClientes}</p>
          <p className="text-xs text-[#8A7F74] mt-1">Registrados en el sistema</p>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A7F74]">Clientes Habilitados</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700 mt-2">{clientesActivos}</p>
          <p className="text-xs text-green-600 mt-1">Cuentas con acceso activo</p>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8A7F74]">Cuentas Bloqueadas</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${clientesBloqueados > 0 ? 'bg-red-50 text-red-700' : 'bg-[#FAF8F5] text-[#8A7F74]'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${clientesBloqueados > 0 ? 'text-red-700' : 'text-[#2A2825]'}`}>
            {clientesBloqueados}
          </p>
          <p className="text-xs text-[#8A7F74] mt-1">Por intentos de acceso fallidos</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3B3B] text-[#2A2825]"
          />
        </div>
      </div>

      {/* Estado de Carga o Error */}
      {loading && (
        <div className="py-16 text-center text-[#8A7F74]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
          <p className="text-sm font-medium">Cargando clientes desde la base de datos...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <p>{error}</p>
          <button onClick={cargarClientes} className="underline font-semibold ml-2">Reintentar</button>
        </div>
      )}

      {/* Listado de Clientes */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClientes.map((cliente) => {
            const isLoadingAction = actionLoadingId === cliente.usuarioId;

            return (
              <div
                key={cliente.usuarioId}
                className="bg-white border border-[#EDE8E1] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Header card cliente */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#7A3B3B] text-white flex items-center justify-center text-base font-bold shadow-sm">
                      {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2A2825] text-base leading-tight">
                        {cliente.nombre} {cliente.apellido}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          cliente.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        {cliente.bloqueado && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">
                            Bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de gestión de cuenta */}
                  <div className="flex items-center gap-1.5">
                    {/* Botón Resetear Contraseña */}
                    <button
                      onClick={() => handleOpenResetPassword(cliente)}
                      className="p-2 text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-200"
                      title="Resetear contraseña y desbloquear cuenta"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    {/* Botón Fidelización */}
                    <button
                      onClick={() => handleAbrirLealtad(cliente)}
                      className="p-2 text-[#7A3B3B] hover:bg-[#FAF8F5] rounded-xl transition-colors border border-[#EDE8E1]"
                      title="Gestionar estampitas y fidelización"
                    >
                      <Award className="w-4 h-4" />
                    </button>

                    {/* Botón Desbloquear (si está bloqueado) */}
                    {cliente.bloqueado && (
                      <button
                        onClick={() => handleDesbloquear(cliente)}
                        disabled={isLoadingAction}
                        className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200"
                        title="Desbloquear cuenta bloqueada por seguridad"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    )}

                    {/* Botón Activar / Desactivar */}
                    <button
                      onClick={() => handleToggleEstado(cliente)}
                      disabled={isLoadingAction}
                      className={`p-2 rounded-xl border transition-colors ${
                        cliente.activo
                          ? 'text-red-700 hover:bg-red-50 border-red-200'
                          : 'text-green-700 hover:bg-green-50 border-green-200'
                      }`}
                      title={cliente.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                    >
                      {isLoadingAction ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : cliente.activo ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info de contacto */}
                <div className="space-y-2 mb-4 text-xs text-[#8A7F74]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#7A3B3B]" />
                    <span className="text-[#2A2825] font-medium">{cliente.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#7A3B3B]" />
                    <span>{cliente.telefono || 'Sin teléfono registrado'}</span>
                  </div>
                </div>

                {/* Footer card */}
                <div className="border-t border-[#EDE8E1] pt-3 flex items-center justify-between text-xs text-[#8A7F74]">
                  <span>Registrado: {new Date(cliente.fechaRegistro).toLocaleDateString('es-AR')}</span>
                  <button
                    onClick={() => handleAbrirLealtad(cliente)}
                    className="text-[#7A3B3B] hover:underline font-semibold text-xs"
                  >
                    Ver Fidelización &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && filteredClientes.length === 0 && (
        <div className="text-center py-12 bg-white border border-[#EDE8E1] rounded-2xl">
          <p className="text-sm text-[#8A7F74]">No se encontraron clientes que coincidan con la búsqueda.</p>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {showModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE8E1] w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-[#EDE8E1] pb-3">
              <h3 className="text-base font-bold text-[#2A2825]">Crear Nuevo Cliente</h3>
              <button
                onClick={() => setShowModalNuevo(false)}
                className="p-1.5 rounded-lg text-[#8A7F74] hover:bg-[#FAF8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {nuevoError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {nuevoError}
              </div>
            )}

            <form onSubmit={handleCrearCliente} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                    placeholder="Ej. Martina"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                    placeholder="Ej. Suárez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  placeholder="cliente@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  placeholder="+54911..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">Contraseña Inicial *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setShowModalNuevo(false)}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNuevo}
                  className="px-4 py-2 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {savingNuevo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN DE LEALTAD Y ESTAMPITAS */}
      {selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE8E1] w-full max-w-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-[#EDE8E1] pb-3">
              <div className="flex items-center gap-2 text-[#7A3B3B]">
                <Award className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#2A2825]">Programa de Fidelización</h3>
              </div>
              <button
                onClick={() => setSelectedCliente(null)}
                className="p-1.5 rounded-lg text-[#8A7F74] hover:bg-[#FAF8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8A7F74] mb-3">
              Cliente: <strong className="text-[#2A2825]">{selectedCliente.nombre} {selectedCliente.apellido}</strong>
            </p>

            {loadingEstampitas ? (
              <div className="py-8 text-center text-[#8A7F74]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
                <p className="text-xs">Consultando tarjeta digital...</p>
              </div>
            ) : (
              <form onSubmit={handleSumarEstampitas} className="space-y-4">
                <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl p-4 text-center">
                  <p className="text-xs text-[#8A7F74]">Estampitas Actuales</p>
                  <p className="text-3xl font-bold text-[#7A3B3B] mt-1">{estampitasCliente ?? 0} / 10</p>
                  <div className="w-full bg-[#EDE8E1] h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-[#7A3B3B] h-full transition-all duration-300"
                      style={{ width: `${Math.min(((estampitasCliente ?? 0) / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">Acreditar Estampitas</label>
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
                    value={motivoEstampitas}
                    onChange={(e) => setMotivoEstampitas(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                    placeholder="Ej. Servicio realizado o compra"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE8E1]">
                  <button
                    type="button"
                    onClick={() => setSelectedCliente(null)}
                    className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEstampitas}
                    className="px-4 py-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {savingEstampitas ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                    Sumar Estampitas
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL RESETEAR CONTRASEÑA */}
      {resetModalOpen && clienteParaReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#EDE8E1] w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-[#EDE8E1] pb-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#2A2825]">Restablecer Contraseña</h3>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8A7F74] hover:bg-[#FAF8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Datos del cliente */}
            <div className="p-3 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8A7F74]">Cliente seleccionado</p>
                <p className="font-bold text-sm text-[#2A2825]">
                  {clienteParaReset.nombre} {clienteParaReset.apellido}
                </p>
                <p className="text-xs text-[#8A7F74]">{clienteParaReset.email}</p>
              </div>
              {clienteParaReset.bloqueado ? (
                <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-100 text-red-800 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Bloqueado
                </span>
              ) : (
                <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Activo
                </span>
              )}
            </div>

            {resetError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {resetError}
              </div>
            )}

            {!resetExitoso ? (
              <form onSubmit={handleConfirmarReset} className="space-y-4">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  💡 <strong>Información importante:</strong> Al restablecer la contraseña, si la cuenta estaba <strong>bloqueada</strong> por intentos fallidos, se <strong>desbloqueará automáticamente</strong> y los intentos fallidos volverán a 0.
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#3C3530]">Nueva Contraseña *</label>
                    <button
                      type="button"
                      onClick={generarPasswordSegura}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3 h-3" /> Generar otra
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-3 pr-10 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7F74] hover:text-[#2A2825]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8A7F74] mt-1">Podés usar la contraseña autogenerada o escribir una manual.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE8E1]">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReset}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {submittingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                    Restablecer y Desbloquear
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 py-2 animate-in fade-in">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-sm text-green-900">¡Contraseña Restablecida con Éxito!</p>
                  <p className="text-xs text-green-700 mt-1">
                    La cuenta de {clienteParaReset.nombre} {clienteParaReset.apellido} fue actualizada y desbloqueada.
                  </p>
                </div>

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-[11px] text-gray-500 font-medium mb-1">Nueva contraseña asignada:</p>
                  <div className="flex items-center justify-between bg-white px-3 py-2 border border-gray-300 rounded-lg">
                    <code className="text-sm font-bold font-mono text-[#2A2825] tracking-wide">
                      {nuevaPassword}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopiarPassword}
                      className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-md border border-indigo-200 flex items-center gap-1 transition-colors"
                    >
                      {copiado ? (
                        <>
                          <Check className="w-3 h-3 text-green-600" />
                          <span className="text-green-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={() => setResetModalOpen(false)}
                    className="w-full py-2.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
