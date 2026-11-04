import { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Mail,
  Phone,
  Calendar,
  Heart,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  Save,
  Edit3,
  X,
  Trash2,
  CheckCircle2,
  Layers,
  ChevronRight,
  ShoppingBag,
  LogOut,
} from 'lucide-react';
import type { AuthUser } from '../../../services/api';
import {
  clientePerfilService,
  type PerfilClienteCompleto,
  TRATAMIENTOS_DISPONIBLES,
} from '../../../services/clientePerfilService';
import { lealtadService } from '../../../services/lealtadService';

interface PerfilClienteProps {
  currentUser?: AuthUser | null;
  onUpdateUser?: (updated: AuthUser) => void;
  onNavigate?: (section: string) => void;
  onLogout?: () => void;
}

export function PerfilCliente({
  currentUser,
  onUpdateUser,
  onNavigate,
  onLogout,
}: PerfilClienteProps) {
  const [perfil, setPerfil] = useState<PerfilClienteCompleto>(() =>
    clientePerfilService.getPerfil(currentUser)
  );

  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState<PerfilClienteCompleto>({ ...perfil });
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);
  const [pestanaActiva, setPestanaActiva] = useState<'datos' | 'estetica' | 'accesos'>('datos');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener estadísticas de fidelidad del cliente
  const tarjetaCliente = lealtadService.getTarjetaCliente(
    perfil.usuarioId,
    `${perfil.nombre} ${perfil.apellido}`.trim()
  );

  const totalCorazones = Object.values(tarjetaCliente.progresosPorTipo || {}).reduce(
    (acc, p) => acc + (p.estampitasActuales || 0),
    0
  ) || (tarjetaCliente.estampitasActuales || 6);

  // Sincronizar si cambia currentUser
  useEffect(() => {
    const cargado = clientePerfilService.getPerfil(currentUser);
    setPerfil(cargado);
    setFormData(cargado);
  }, [currentUser]);

  const mostrarToast = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setMensajeToast({ texto, tipo });
    setTimeout(() => {
      setMensajeToast(null);
    }, 4000);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCargandoFoto(true);
      const dataUrl = await clientePerfilService.procesarArchivoADataUrl(file);
      
      const perfilActualizado: PerfilClienteCompleto = {
        ...formData,
        fotoUrl: dataUrl,
      };

      setFormData(perfilActualizado);
      setPerfil(perfilActualizado);

      // Guardar inmediatamente la foto
      await clientePerfilService.guardarPerfil(perfilActualizado);

      if (currentUser && onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          fotoUrl: dataUrl,
        });
      }

      mostrarToast('Foto de perfil actualizada exitosamente');
    } catch (err: any) {
      mostrarToast(err?.message || 'Error al procesar la foto', 'error');
    } finally {
      setCargandoFoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEliminarFoto = async () => {
    const perfilActualizado: PerfilClienteCompleto = {
      ...formData,
      fotoUrl: '',
    };
    setFormData(perfilActualizado);
    setPerfil(perfilActualizado);
    await clientePerfilService.guardarPerfil(perfilActualizado);

    if (currentUser && onUpdateUser) {
      onUpdateUser({
        ...currentUser,
        fotoUrl: '',
      });
    }

    mostrarToast('Foto de perfil eliminada');
  };

  const handleToggleInteres = (tratamiento: string) => {
    const actuales = formData.interesesTratamientos || [];
    const existe = actuales.includes(tratamiento);
    const nuevos = existe
      ? actuales.filter((t) => t !== tratamiento)
      : [...actuales, tratamiento];

    setFormData({
      ...formData,
      interesesTratamientos: nuevos,
    });
  };

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      mostrarToast('El nombre no puede estar vacío', 'error');
      return;
    }

    try {
      const guardado = await clientePerfilService.guardarPerfil(formData);
      setPerfil(guardado);
      setEditando(false);

      if (currentUser && onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          nombre: guardado.nombre,
          apellido: guardado.apellido,
          telefono: guardado.telefono,
          fotoUrl: guardado.fotoUrl,
          direccion: guardado.direccion,
          fechaNacimiento: guardado.fechaNacimiento,
        });
      }

      mostrarToast('¡Perfil e información estética guardados con éxito!');
    } catch (err: any) {
      mostrarToast(err?.message || 'Error al guardar los cambios', 'error');
    }
  };

  const handleCancelarEdicion = () => {
    setFormData({ ...perfil });
    setEditando(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {mensajeToast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-6 ${
            mensajeToast.tipo === 'exito'
              ? 'bg-white border-emerald-200 text-emerald-900'
              : 'bg-white border-rose-200 text-rose-900'
          }`}
        >
          {mensajeToast.tipo === 'exito' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{mensajeToast.texto}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Encabezado Principal / Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Foto de Perfil con Input interactivo */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#EDE8E1] bg-[#FAF8F5] flex items-center justify-center text-3xl font-extrabold text-[#7A3B3B] shadow-inner">
                {perfil.fotoUrl ? (
                  <img
                    src={perfil.fotoUrl}
                    alt={`${perfil.nombre} ${perfil.apellido}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {perfil.nombre.charAt(0)}
                    {perfil.apellido ? perfil.apellido.charAt(0) : ''}
                  </span>
                )}
              </div>

              {/* Botón flotante para cambiar foto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={cargandoFoto}
                title="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#7A3B3B] text-white hover:bg-[#5C2B2B] flex items-center justify-center shadow-md transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSubirFoto}
                className="hidden"
              />
            </div>

            {/* Info principal y Acciones */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">
                      {perfil.nombre} {perfil.apellido}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF0F0] text-[#7A3B3B] border border-[#7A3B3B]/20">
                      Cliente VIP
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#8A7F74] flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{perfil.email}</span>
                    {perfil.telefono && (
                      <>
                        <span>•</span>
                        <Phone className="w-3.5 h-3.5" />
                        <span>{perfil.telefono}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Botones de Acción: Modo Edición */}
                <div className="flex items-center justify-center sm:justify-end gap-2 pt-1 sm:pt-0">
                  {perfil.fotoUrl && (
                    <button
                      type="button"
                      onClick={handleEliminarFoto}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
                      title="Quitar foto de perfil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Quitar Foto</span>
                    </button>
                  )}

                  {!editando ? (
                    <button
                      type="button"
                      onClick={() => setEditando(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7A3B3B] hover:bg-[#5C2B2B] shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Perfil & Info</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelarEdicion}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5A524A] bg-[#FAF8F5] hover:bg-[#EDE8E1] border border-[#EDE8E1] transition-colors flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGuardarCambios}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Indicadores rápidos */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#EDE8E1] text-center sm:text-left">
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE8E1]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7F74] block">
                    Corazones Club
                  </span>
                  <span className="text-base sm:text-lg font-black text-red-600 flex items-center justify-center sm:justify-start gap-1 font-mono">
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    {totalCorazones}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE8E1]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7F74] block">
                    Tipo de Piel
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#2A2825] truncate block">
                    {perfil.tipoPiel || 'No especificado'}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE8E1]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7F74] block">
                    Estado Cuenta
                  </span>
                  <span className="text-xs font-bold text-emerald-800 flex items-center justify-center sm:justify-start gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verificada</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Perfil */}
        <div className="flex border-b border-[#EDE8E1] gap-2 pb-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setPestanaActiva('datos')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              pestanaActiva === 'datos'
                ? 'bg-[#3C3530] text-white shadow-xs'
                : 'text-[#8A7F74] hover:text-[#2A2825] hover:bg-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Datos Personales & Contacto</span>
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('estetica')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              pestanaActiva === 'estetica'
                ? 'bg-[#3C3530] text-white shadow-xs'
                : 'text-[#8A7F74] hover:text-[#2A2825] hover:bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ficha Estética, Piel & Preferencias</span>
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('accesos')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              pestanaActiva === 'accesos'
                ? 'bg-[#3C3530] text-white shadow-xs'
                : 'text-[#8A7F74] hover:text-[#2A2825] hover:bg-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Historial & Accesos Rápidos</span>
          </button>
        </div>

        {/* ── SECCIÓN 1: DATOS PERSONALES & CONTACTO ── */}
        {pestanaActiva === 'datos' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-xs space-y-6">
            <div className="border-b border-[#EDE8E1] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Información Personal de la Cuenta</span>
                </h2>
                <p className="text-xs text-[#8A7F74]">
                  Tus datos de identificación y contacto para confirmación de turnos y avisos
                </p>
              </div>
              {!editando && (
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="text-xs font-bold text-[#7A3B3B] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Datos</span>
                </button>
              )}
            </div>

            <form onSubmit={handleGuardarCambios} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!editando}
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825] disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* Apellido */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!editando}
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825] disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!editando}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825] disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* Teléfono / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    disabled={!editando}
                    value={formData.telefono}
                    placeholder="+54 9 11..."
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825] disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* Fecha de Nacimiento */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Fecha de Nacimiento (Beneficios de Cumpleaños)
                  </label>
                  <input
                    type="date"
                    disabled={!editando}
                    value={formData.fechaNacimiento || ''}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825] disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* DNI */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    DNI / Identificación
                  </label>
                  <input
                    type="text"
                    disabled={!editando}
                    value={formData.dni || ''}
                    placeholder="38.452.918"
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825] disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* Domicilio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Dirección / Domicilio
                  </label>
                  <input
                    type="text"
                    disabled={!editando}
                    value={formData.direccion || ''}
                    placeholder="Calle, número, piso o depto"
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825] disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* Ciudad / Localidad */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider">
                    Ciudad / Barrio
                  </label>
                  <input
                    type="text"
                    disabled={!editando}
                    value={formData.ciudad || ''}
                    placeholder="Ej: Palermo, CABA"
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825] disabled:opacity-80 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                {/* Contacto de Emergencia */}
                <div className="sm:col-span-2 pt-2 border-t border-[#EDE8E1]">
                  <p className="text-xs font-bold text-[#3C3530] uppercase tracking-wider mb-2">
                    Contacto de Emergencia (Opcional)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      disabled={!editando}
                      value={formData.contactoEmergenciaNombre || ''}
                      placeholder="Nombre del contacto"
                      onChange={(e) => setFormData({ ...formData, contactoEmergenciaNombre: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] disabled:opacity-80"
                    />
                    <input
                      type="tel"
                      disabled={!editando}
                      value={formData.contactoEmergenciaTelefono || ''}
                      placeholder="Teléfono del contacto"
                      onChange={(e) => setFormData({ ...formData, contactoEmergenciaTelefono: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] disabled:opacity-80"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Guardar si está editando */}
              {editando && (
                <div className="pt-4 border-t border-[#EDE8E1] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelarEdicion}
                    className="px-4 py-2.5 rounded-xl border border-[#EDE8E1] text-xs font-bold text-[#5A524A] hover:bg-[#FAF8F5]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ── SECCIÓN 2: FICHA ESTÉTICA, PIEL & PREFERENCIAS (AGREGAR INFO) ── */}
        {pestanaActiva === 'estetica' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-xs space-y-6">
            <div className="border-b border-[#EDE8E1] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Ficha Cutánea & Preferencias del Cliente</span>
                </h2>
                <p className="text-xs text-[#8A7F74]">
                  Información clave para que nuestras profesionales adapten cada producto y protocolo a tus necesidades
                </p>
              </div>
              {!editando && (
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="text-xs font-bold text-[#7A3B3B] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modificar Ficha</span>
                </button>
              )}
            </div>

            <form onSubmit={handleGuardarCambios} className="space-y-6">
              {/* Tipo de Piel */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider block">
                  Tipo de Piel Dominante
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {(['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible', 'Madura'] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      disabled={!editando}
                      onClick={() => setFormData({ ...formData, tipoPiel: tipo })}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        formData.tipoPiel === tipo
                          ? 'bg-[#7A3B3B] text-white border-[#7A3B3B] shadow-xs font-bold'
                          : 'bg-[#FAF8F5] text-[#5A524A] border-[#EDE8E1] hover:border-[#8A7F74] font-medium'
                      } ${!editando ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="text-xs">{tipo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alergias o Sensibilidades */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Alergias, Reacciones o Sensibilidades a Cosméticos</span>
                </label>
                <textarea
                  rows={2}
                  disabled={!editando}
                  value={formData.alergias}
                  onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                  placeholder="Ej: Reacción a cremas con perfumes, alergia al látex, intolerancia al ácido glicólico..."
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] disabled:opacity-80"
                />
              </div>

              {/* Tratamientos de Preferencia */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider block">
                  Tratamientos de Mayor Interés / Frecuencia
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRATAMIENTOS_DISPONIBLES.map((tratamiento) => {
                    const seleccionado = (formData.interesesTratamientos || []).includes(tratamiento);
                    return (
                      <button
                        key={tratamiento}
                        type="button"
                        disabled={!editando}
                        onClick={() => handleToggleInteres(tratamiento)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                          seleccionado
                            ? 'bg-[#FAF0F0] text-[#7A3B3B] border-[#7A3B3B]/30 font-bold'
                            : 'bg-[#FAF8F5] text-[#8A7F74] border-[#EDE8E1]'
                        } ${!editando ? 'cursor-default' : 'cursor-pointer hover:border-[#7A3B3B]'}`}
                      >
                        {seleccionado ? '✓ ' : '+ '}
                        {tratamiento}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notas Especiales para la Profesional */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3C3530] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#7A3B3B]" />
                  <span>Notas Especiales para Cabina & Hábitos de Cuidado</span>
                </label>
                <textarea
                  rows={3}
                  disabled={!editando}
                  value={formData.notasEspeciales}
                  onChange={(e) => setFormData({ ...formData, notasEspeciales: e.target.value })}
                  placeholder="Detalles sobre uso diario de protector solar, tratamientos médicos recientes, embarazo o preferencias de horarios..."
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] disabled:opacity-80"
                />
              </div>

              {/* Botón Guardar si está editando */}
              {editando && (
                <div className="pt-4 border-t border-[#EDE8E1] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelarEdicion}
                    className="px-4 py-2.5 rounded-xl border border-[#EDE8E1] text-xs font-bold text-[#5A524A] hover:bg-[#FAF8F5]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Guardar Ficha
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ── SECCIÓN 3: ACCESOS RÁPIDOS & ACTIVIDAD ── */}
        {pestanaActiva === 'accesos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-xs">
              <h2 className="text-base font-bold text-[#2A2825] mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7A3B3B]" />
                <span>Gestión de Citas, Beneficios & Compras</span>
              </h2>
              <p className="text-xs text-[#8A7F74] mb-6">
                Accedé directamente a las diferentes áreas de tu cuenta
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate?.('reservar')}
                  className="p-5 rounded-2xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left flex items-start justify-between group shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF0F0] text-[#7A3B3B] flex items-center justify-center mb-3">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#2A2825]">Mis Turnos & Reservas</h3>
                    <p className="text-xs text-[#8A7F74]">
                      Consultar citas agendadas, reprogramar o reservar nuevo servicio
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8A7F74] group-hover:text-[#7A3B3B] transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate?.('lealtad')}
                  className="p-5 rounded-2xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left flex items-start justify-between group shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-red-600 flex items-center justify-center mb-3 border border-red-200">
                      <Heart className="w-5 h-5 fill-red-500" />
                    </div>
                    <h3 className="text-sm font-bold text-[#2A2825]">Tarjetas de Fidelidad</h3>
                    <p className="text-xs text-[#8A7F74]">
                      Ver corazones acumulados, sellos en vivo y premios listos para canjear
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8A7F74] group-hover:text-[#7A3B3B] transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate?.('wishlist')}
                  className="p-5 rounded-2xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left flex items-start justify-between group shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#3C3530] flex items-center justify-center mb-3 border border-[#EDE8E1]">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#2A2825]">Lista de Deseos</h3>
                    <p className="text-xs text-[#8A7F74]">
                      Productos y cosmecéuticos favoritos guardados para comprar
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8A7F74] group-hover:text-[#7A3B3B] transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate?.('carrito')}
                  className="p-5 rounded-2xl border border-[#EDE8E1] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] transition-all text-left flex items-start justify-between group shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#3C3530] flex items-center justify-center mb-3 border border-[#EDE8E1]">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#2A2825]">Mi Carrito de Compras</h3>
                    <p className="text-xs text-[#8A7F74]">
                      Ver artículos agregados y finalizar pago con Mercado Pago
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8A7F74] group-hover:text-[#7A3B3B] transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Botón de Cerrar Sesión */}
            {onLogout && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-6 py-2.5 rounded-2xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
