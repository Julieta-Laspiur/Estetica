import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Phone,
  Mail,
  Award,
  Unlock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  X,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  Calendar,
  ShoppingBag,
  Store,
  Truck,
  Heart,
  Save,
  Clock,
  Tag
} from 'lucide-react';
import {
  usuariosApi,
  fidelizacionApi,
  authApi,
  turnosApi,
  ordenesApi,
  chatIAApi,
  type UsuarioDetalleDto
} from '../../services/api';

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

  // Modal Resetear Contraseña
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [clienteParaReset, setClienteParaReset] = useState<UsuarioDetalleDto | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetExitoso, setResetExitoso] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Modal Ficha Integral del Cliente (perfiladmin.md #2)
  const [clienteFicha, setClienteFicha] = useState<UsuarioDetalleDto | null>(null);
  const [fichaTab, setFichaTab] = useState<'turnos' | 'compras' | 'estetica' | 'fidelizacion'>('turnos');
  const [turnosCliente, setTurnosCliente] = useState<any[]>([]);
  const [comprasCliente, setComprasCliente] = useState<any[]>([]);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [guardandoFicha, setGuardandoFicha] = useState(false);
  const [fichaMensaje, setFichaMensaje] = useState<string | null>(null);

  // Campos de diagnóstico y notas de la ficha
  const [fichaTipoPiel, setFichaTipoPiel] = useState<string>('Mixta');
  const [fichaAlergias, setFichaAlergias] = useState<string>('');
  const [fichaObservaciones, setFichaObservaciones] = useState<string>('');
  const [fichaNotasAdmin, setFichaNotasAdmin] = useState<string>('');

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

  const handleAbrirFicha = async (cliente: UsuarioDetalleDto) => {
    setClienteFicha(cliente);
    setFichaTab('turnos');
    setFichaMensaje(null);
    setCargandoFicha(true);

    // Cargar diagnóstico y notas locales
    try {
      const diagLocal = localStorage.getItem(`estetica_diagnostico_cliente_${cliente.usuarioId}`);
      if (diagLocal) {
        const d = JSON.parse(diagLocal);
        setFichaTipoPiel(d.tipoPiel || 'Mixta');
        setFichaAlergias(d.alergias || '');
        setFichaObservaciones(d.observaciones || '');
      } else {
        setFichaTipoPiel('Mixta');
        setFichaAlergias('');
        setFichaObservaciones('');
      }
    } catch {
      setFichaTipoPiel('Mixta');
      setFichaAlergias('');
      setFichaObservaciones('');
    }

    try {
      const notas = localStorage.getItem(`estetica_notas_cliente_${cliente.usuarioId}`) || '';
      setFichaNotasAdmin(notas);
    } catch {
      setFichaNotasAdmin('');
    }

    // Cargar turnos y órdenes asociados al cliente
    try {
      const [turnosApiData, ordenesApiData, tarjeta] = await Promise.all([
        turnosApi.getTurnos().catch(() => []),
        ordenesApi.getOrdenesAdmin().catch(() => []),
        fidelizacionApi.getTarjetaPorUsuario(cliente.usuarioId).catch(() => null)
      ]);

      // Turnos locales de reservas
      let turnosLocales: any[] = [];
      try {
        turnosLocales = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
      } catch {}

      const todosTurnos = [...turnosApiData, ...turnosLocales];
      const delClienteTurnos = todosTurnos.filter((t: any) => {
        const idMatch = t.usuarioId && Number(t.usuarioId) === cliente.usuarioId;
        const emailMatch = t.clienteEmail && cliente.email && t.clienteEmail.toLowerCase() === cliente.email.toLowerCase();
        const nombreMatch = t.clienteNombre && cliente.nombre && t.clienteNombre.toLowerCase().includes(cliente.nombre.toLowerCase());
        return idMatch || emailMatch || nombreMatch;
      }).sort((a: any, b: any) => new Date(b.fechaHoraInicio || b.fecha).getTime() - new Date(a.fechaHoraInicio || a.fecha).getTime());

      setTurnosCliente(delClienteTurnos);

      // Órdenes locales de productos
      let ordenesLocales: any[] = [];
      try {
        ordenesLocales = JSON.parse(localStorage.getItem('estetica_ordenes_productos') || '[]');
      } catch {}

      const todasOrdenes = [...ordenesApiData, ...ordenesLocales];
      const delClienteOrdenes = todasOrdenes.filter((o: any) => {
        const idMatch = o.clienteId && Number(o.clienteId) === cliente.usuarioId;
        const emailMatch = o.clienteEmail && cliente.email && o.clienteEmail.toLowerCase() === cliente.email.toLowerCase();
        return idMatch || emailMatch;
      }).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setComprasCliente(delClienteOrdenes);
      setEstampitasCliente(tarjeta?.estampitasActuales ?? 0);
    } finally {
      setCargandoFicha(false);
    }
  };

  const handleGuardarFichaEstetica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteFicha) return;
    setGuardandoFicha(true);
    setFichaMensaje(null);

    try {
      // Guardar diagnóstico en localStorage
      const diagnosticoData = {
        tipoPiel: fichaTipoPiel,
        alergias: fichaAlergias,
        observaciones: fichaObservaciones,
        fechaActualizacion: new Date().toISOString()
      };
      localStorage.setItem(`estetica_diagnostico_cliente_${clienteFicha.usuarioId}`, JSON.stringify(diagnosticoData));
      localStorage.setItem(`estetica_notas_cliente_${clienteFicha.usuarioId}`, fichaNotasAdmin);

      // Sincronizar con el backend de IA si está disponible
      try {
        await chatIAApi.registrarDiagnostico(fichaTipoPiel, fichaObservaciones || 'Sin observaciones', fichaAlergias, clienteFicha.usuarioId);
      } catch {}

      setFichaMensaje('✅ Ficha estética y preferencias guardadas exitosamente.');
      setTimeout(() => setFichaMensaje(null), 3500);
    } catch (err: any) {
      setFichaMensaje(`❌ Error al guardar: ${err.message || 'Error desconocido'}`);
    } finally {
      setGuardandoFicha(false);
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAbrirLealtad(cliente)}
                      className="text-[#8A7F74] hover:text-[#7A3B3B] font-semibold text-xs flex items-center gap-1 transition-colors"
                      title="Ver estampitas"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sellos</span>
                    </button>
                    <button
                      onClick={() => handleAbrirFicha(cliente)}
                      className="px-2.5 py-1.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                      title="Ver expediente integral del cliente"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ficha Completa</span>
                    </button>
                  </div>
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
              <div className="space-y-4">
                <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-4 text-center">
                  <p className="text-xs text-[#8A7F74]">Tarjeta Virtual de Fidelización</p>
                  <p className="text-3xl font-extrabold text-[#7A3B3B] mt-1">{estampitasCliente ?? 0} / 10</p>
                  <p className="text-[11px] text-[#8A7F74] mt-0.5">
                    {10 - (estampitasCliente ?? 0) === 0
                      ? '¡Cuponera completa! Premio disponible.'
                      : `Faltan ${10 - (estampitasCliente ?? 0)} estampitas para el premio`}
                  </p>
                  <div className="w-full bg-[#EDE8E1] h-2.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-[#7A3B3B] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(((estampitasCliente ?? 0) / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-[#3C3530] leading-relaxed">
                  <p className="font-semibold text-[#2A2825] mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#7A3B3B]" />
                    Seguridad en Acreditaciones
                  </p>
                  <p className="text-[11px] text-[#8A7F74]">
                    Por protocolo de transparencia, no se permite la acreditación manual directa. Las estampitas se generan únicamente a través del <strong>código QR habilitado por el profesional en el turno completado</strong> y son validadas por el Administrador.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EDE8E1]">
                  <button
                    type="button"
                    onClick={() => setSelectedCliente(null)}
                    className="w-full py-2.5 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    Entendido / Cerrar
                  </button>
                </div>
              </div>
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

      {/* MODAL FICHA INTEGRAL DEL CLIENTE (perfiladmin.md #2) */}
      {clienteFicha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EDE8E1] w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header del Expediente */}
            <div className="p-5 border-b border-[#EDE8E1] bg-[#FAF8F5] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#7A3B3B] text-white flex items-center justify-center text-lg font-bold shadow-xs">
                  {clienteFicha.nombre.charAt(0)}{clienteFicha.apellido.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#2A2825]">
                      {clienteFicha.nombre} {clienteFicha.apellido}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      clienteFicha.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {clienteFicha.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {clienteFicha.bloqueado && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">
                        Bloqueado
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8A7F74] mt-0.5">
                    <span className="flex items-center gap-1 text-[#2A2825] font-medium">
                      <Mail className="w-3.5 h-3.5 text-[#7A3B3B]" /> {clienteFicha.email}
                    </span>
                    {clienteFicha.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#7A3B3B]" /> {clienteFicha.telefono}
                      </span>
                    )}
                    <span>• Registrado el {new Date(clienteFicha.fechaRegistro).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setClienteFicha(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8A7F74] hover:text-[#2A2825] hover:bg-[#EDE8E1] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Pestañas del Expediente */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#EDE8E1] bg-white overflow-x-auto scrollbar-none">
              {[
                { id: 'turnos', label: `Turnos (${turnosCliente.length})`, icon: Calendar },
                { id: 'compras', label: `Compras Tienda (${comprasCliente.length})`, icon: ShoppingBag },
                { id: 'estetica', label: 'Ficha Dermatológica & Piel', icon: Heart },
                { id: 'fidelizacion', label: `Fidelización (${estampitasCliente ?? 0}/10)`, icon: Award },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = fichaTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFichaTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-[#7A3B3B] text-[#7A3B3B]'
                        : 'border-transparent text-[#8A7F74] hover:text-[#2A2825]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Contenido Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {cargandoFicha && (
                <div className="py-12 text-center text-[#8A7F74]">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
                  <p className="text-xs font-medium">Cargando expediente del cliente...</p>
                </div>
              )}

              {!cargandoFicha && fichaTab === 'turnos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#3C3530]">
                      Historial y Próximos Turnos Agendados
                    </h4>
                    <span className="text-[11px] text-[#8A7F74]">{turnosCliente.length} cita(s) registrada(s)</span>
                  </div>

                  {turnosCliente.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1] text-[#8A7F74] text-xs">
                      Este cliente aún no registra citas ni reservas en la agenda.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {turnosCliente.map((t: any, idx: number) => {
                        const fechaStr = t.fechaHoraInicio || t.fecha || t.fechaHora;
                        const esFuturo = new Date(fechaStr).getTime() > Date.now();
                        const estado = t.estado || 'Confirmado';

                        return (
                          <div
                            key={t.turnoId || idx}
                            className="p-3.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#2A2825] text-sm">
                                  {t.servicioNombre || 'Servicio Estético'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  estado === 'Completado' ? 'bg-emerald-100 text-emerald-800' :
                                  estado === 'Confirmado' ? 'bg-blue-100 text-blue-800' :
                                  estado === 'Cancelado' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {estado}
                                </span>
                                {esFuturo && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                                    Próximo
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-[#8A7F74]">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                  {new Date(fechaStr).toLocaleString('es-AR', {
                                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                                <span>Prof: <strong>{t.profesionalNombre || 'Especialista'}</strong></span>
                                {t.cabinaNombre && <span>Cabina: <strong>{t.cabinaNombre}</strong></span>}
                              </div>
                            </div>

                            <div className="text-right sm:self-center">
                              <span className="text-sm font-extrabold text-[#7A3B3B] block">
                                ${Number(t.precio || t.monto || 0).toLocaleString('es-AR')} ARS
                              </span>
                              <span className="text-[10px] text-[#8A7F74]">
                                {t.medioPago || 'Abonado en centro'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!cargandoFicha && fichaTab === 'compras' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#3C3530]">
                      Historial de Compras en la Tienda Oficial
                    </h4>
                    <span className="text-[11px] text-[#8A7F74]">{comprasCliente.length} orden(es) registrada(s)</span>
                  </div>

                  {comprasCliente.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1] text-[#8A7F74] text-xs">
                      Este cliente aún no ha realizado compras de cosméticos en la tienda online.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {comprasCliente.map((ord: any, idx: number) => (
                        <div
                          key={ord.ordenId || idx}
                          className="p-3.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2 text-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE8E1]/80 pb-2">
                            <div>
                              <span className="font-bold text-[#2A2825]">Orden #{ord.ordenId}</span>
                              <span className="text-[#8A7F74] text-[11px] ml-2">
                                {new Date(ord.fecha).toLocaleString('es-AR')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {ord.tipoEntrega === 'retiro' || String(ord.medioDetalle || '').toLowerCase().includes('retiro') ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <Store className="w-3 h-3 text-emerald-700" /> Retiro en local
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                  <Truck className="w-3 h-3 text-blue-700" /> Envío a domicilio
                                </span>
                              )}
                              {(() => {
                                const est = String(ord.estado || '').toLowerCase();
                                const esPend = est === '0' || est === 'pendiente' || est.includes('pend');
                                const esCanc = !esPend && (est === '5' || est.includes('canc'));

                                if (esPend) {
                                  return (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                      ⏳ Pendiente Pago
                                    </span>
                                  );
                                }
                                if (esCanc) {
                                  return (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                      ✕ Cancelada
                                    </span>
                                  );
                                }
                                return (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    ✓ Pagada
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Productos en la orden */}
                          <div className="space-y-1 text-[11px]">
                            {(ord.detalles || []).map((prod: any, pIdx: number) => (
                              <div key={pIdx} className="flex justify-between text-[#5A524A]">
                                <span>{prod.nombreProducto || 'Producto'} &times; {prod.cantidad}</span>
                                <span className="font-semibold">${Number(prod.subtotal || prod.precioUnitario * prod.cantidad).toLocaleString('es-AR')}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#EDE8E1]/60 text-xs font-bold">
                            <span className="text-[#8A7F74]">Total de la Compra:</span>
                            <span className="text-[#7A3B3B] text-sm">${Number(ord.total).toLocaleString('es-AR')} ARS</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!cargandoFicha && fichaTab === 'estetica' && (
                <form onSubmit={handleGuardarFichaEstetica} className="space-y-4">
                  {fichaMensaje && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                      {fichaMensaje}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Biotipo Cutáneo */}
                    <div>
                      <label className="block text-xs font-bold text-[#3C3530] mb-1">
                        Biotipo Cutáneo / Tipo de Piel *
                      </label>
                      <select
                        value={fichaTipoPiel}
                        onChange={(e) => setFichaTipoPiel(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                      >
                        <option value="Seca">Piel Seca (Alípica / Deshidratada)</option>
                        <option value="Mixta">Piel Mixta (Zona T seborreica y mejillas secas)</option>
                        <option value="Grasa">Piel Grasa (Seborrea y poros dilatados)</option>
                        <option value="Sensible">Piel Sensible (Reactiva / Rosácea)</option>
                      </select>
                      <p className="text-[10px] text-[#8A7F74] mt-1">
                        Utilizado por el asistente con IA (RAG) para recomendar productos compatibles.
                      </p>
                    </div>

                    {/* Alergias */}
                    <div>
                      <label className="block text-xs font-bold text-[#3C3530] mb-1">
                        Alergias o Contraindicaciones Registradas
                      </label>
                      <input
                        type="text"
                        value={fichaAlergias}
                        onChange={(e) => setFichaAlergias(e.target.value)}
                        placeholder="Ej. Ácido glicólico, parabenos, látex..."
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                      />
                    </div>
                  </div>

                  {/* Observaciones Dermatológicas */}
                  <div>
                    <label className="block text-xs font-bold text-[#3C3530] mb-1">
                      Observaciones y Recomendaciones Clínicas del Especialista
                    </label>
                    <textarea
                      rows={3}
                      value={fichaObservaciones}
                      onChange={(e) => setFichaObservaciones(e.target.value)}
                      placeholder="Registrá observaciones de diagnóstico dérmico, rutina domiciliaria recomendada o tratamientos sugeridos..."
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                    />
                  </div>

                  {/* Notas Administrativas Internas */}
                  <div>
                    <label className="block text-xs font-bold text-[#3C3530] mb-1">
                      Notas Administrativas Internas (Privadas para administración)
                    </label>
                    <textarea
                      rows={2}
                      value={fichaNotasAdmin}
                      onChange={(e) => setFichaNotasAdmin(e.target.value)}
                      placeholder="Preferencias de horarios, profesional favorito o avisos especiales..."
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                    />
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[#EDE8E1]">
                    <button
                      type="submit"
                      disabled={guardandoFicha}
                      className="px-4 py-2.5 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {guardandoFicha ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Guardar Ficha del Cliente</span>
                    </button>
                  </div>
                </form>
              )}

              {!cargandoFicha && fichaTab === 'fidelizacion' && (
                <div className="space-y-4">
                  <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl p-5 text-center">
                    <p className="text-xs text-[#8A7F74]">Cuponera de Estampitas Electrónicas</p>
                    <p className="text-4xl font-extrabold text-[#7A3B3B] mt-1">{estampitasCliente ?? 0} / 10</p>
                    <p className="text-xs text-[#8A7F74] mt-1">
                      {10 - (estampitasCliente ?? 0) <= 0
                        ? '¡Meta alcanzada! El cliente tiene una recompensa disponible.'
                        : `Le faltan ${10 - (estampitasCliente ?? 0)} estampita(s) para su próximo beneficio.`}
                    </p>
                    <div className="w-full bg-[#EDE8E1] h-3 rounded-full overflow-hidden mt-3 max-w-md mx-auto">
                      <div
                        className="bg-[#7A3B3B] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(((estampitasCliente ?? 0) / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#EDE8E1] rounded-2xl text-xs text-[#5A524A] space-y-2">
                    <h5 className="font-bold text-[#2A2825] flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-[#7A3B3B]" />
                      <span>Beneficios y Cupones del Programa</span>
                    </h5>
                    <p className="text-[11px] text-[#8A7F74]">
                      Al completar 10 sellos, el sistema genera automáticamente un cupón en la cuenta del cliente para aplicar en su siguiente turno o compra de tienda.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-[#EDE8E1] bg-[#FAF8F5] flex justify-end">
              <button
                type="button"
                onClick={() => setClienteFicha(null)}
                className="px-5 py-2 bg-[#3C3530] hover:bg-[#2A2825] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
