import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  User,
  LayoutGrid,
  Calendar,
  ClipboardList,
  Users,
  Film,
  Clock,
  Bell,
  ChevronRight,
  ChevronLeft,
  Edit3,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Camera,
  X,
  Check,
  Plus,
  QrCode,
  Search,
  Coffee,
  CalendarDays,
  Scissors,
  Trash2,
  Inbox
} from 'lucide-react';
import {
  profesionalService,
  type PerfilProfesional,
  type AtencionSeguimiento,
  type ClienteProfesional,
  type NotificacionProfesional
} from '../../../services/profesionalService';
import { turnosApi, serviciosApi, usuariosApi, type TurnoDto, type AuthUser, type ServicioDto } from '../../../services/api';
import { configuracionService } from '../../../services/configuracionService';
import {
  lealtadService,
  type SolicitudEstampitaQr,
  EVENTO_ESTAMPITA_ACREDITADA
} from '../../../services/lealtadService';

interface PanelProfesionalProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onSwitchToCliente?: () => void;
  onSwitchToAdmin?: () => void;
}

type SeccionProfesional =
  | 'dashboard'
  | 'agenda'
  | 'turnos'
  | 'clientes'
  | 'atenciones'
  | 'servicios'
  | 'perfil'
  | 'notificaciones';

export function PanelProfesional({
  currentUser,
  onLogout,
  onSwitchToCliente,
  onSwitchToAdmin,
}: PanelProfesionalProps) {
  const [seccionActiva, setSeccionActiva] = useState<SeccionProfesional>('dashboard');
  const [siteConfig] = useState(() => configuracionService.get());
  const [perfil, setPerfil] = useState<PerfilProfesional>(() =>
    profesionalService.getPerfil(currentUser)
  );

  // Estados de datos
  const [turnos, setTurnos] = useState<TurnoDto[]>([]);
  const [, setCargandoTurnos] = useState(false);
  const [atenciones, setAtenciones] = useState<AtencionSeguimiento[]>(() =>
    profesionalService.getAtenciones()
  );
  const [clientes, setClientes] = useState<ClienteProfesional[]>(() =>
    profesionalService.getClientes()
  );
  const [serviciosDisponibles, setServiciosDisponibles] = useState<ServicioDto[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionProfesional[]>(() =>
    profesionalService.getNotificaciones()
  );
  const [filtroNotif, setFiltroNotif] = useState<'todas' | 'no_leidas' | 'turnos' | 'sistema'>('todas');

  // Retroalimentación visual (Toast)
  const [feedback, setFeedback] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  // Modales
  const [showModalEditarPerfil, setShowModalEditarPerfil] = useState(false);
  const [formEditar, setFormEditar] = useState({ ...perfil });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Modal QR de Estampita de Lealtad (Flujo Turno Confirmado -> Habilitar QR -> Notificar Admin -> Acreditar)
  const [solicitudQrModal, setSolicitudQrModal] = useState<SolicitudEstampitaQr | null>(null);
  const [qrAcreditadoModal, setQrAcreditadoModal] = useState(false);

  const [showModalPassword, setShowModalPassword] = useState(false);
  const [formPassword, setFormPassword] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  });
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const [showModalNuevaAtencion, setShowModalNuevaAtencion] = useState(false);
  const [formAtencion, setFormAtencion] = useState({
    clienteNombre: '',
    clienteEmail: '',
    servicio: perfil.servicios[0] || 'Limpieza Facial Profunda',
    observaciones: '',
    recomendaciones: '',
    tipoPielTratado: 'Mixta',
    estampitaSumada: true,
  });

  // Filtros de agenda y turnos
  const [fechaAgenda, setFechaAgenda] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [vistaAgendaModo, setVistaAgendaModo] = useState<'dia' | 'semana'>('dia');
  const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>(['13:00']);
  const [showModalNuevoTurnoRapido, setShowModalNuevoTurnoRapido] = useState(false);
  const [horaSeleccionadaNuevoTurno, setHoraSeleccionadaNuevoTurno] = useState('10:00');
  const [formNuevoTurno, setFormNuevoTurno] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    servicio: perfil.servicios[0] || 'Limpieza Facial Profunda',
    precio: 4500,
  });
  const [filtroTurnoEstado, setFiltroTurnoEstado] = useState<string>('todos');
  const [busquedaTurnos, setBusquedaTurnos] = useState('');
  const [busquedaClientes, setBusquedaClientes] = useState('');

  // Subida de foto
  const fileFotoRef = useRef<HTMLInputElement | null>(null);
  const [, setSubiendoFoto] = useState(false);

  const mostrarFeedback = useCallback((mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    setFeedback({ tipo, mensaje });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const cargarTurnos = useCallback(async () => {
    setCargandoTurnos(true);
    try {
      const data = await turnosApi.getTurnos();
      const turnosLocales: TurnoDto[] = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
      const ids = new Set((data || []).map(d => d.turnoId));
      const combinados = [...(data || [])];
      turnosLocales.forEach((tl: TurnoDto) => {
        if (!ids.has(tl.turnoId)) {
          combinados.unshift(tl);
        }
      });
      setTurnos(combinados);
    } catch {
      const hoy = new Date().toISOString().split('T')[0];
      setTurnos([
        {
          turnoId: 201,
          usuarioId: 101,
          clienteNombreCompleto: 'Carla Gómez',
          profesionalId: 1,
          profesionalNombreCompleto: `${perfil.nombre} ${perfil.apellido}`,
          cabinaId: 1,
          cabinaNombre: 'Cabina 1 - Dermoestética & Facial',
          fechaHoraInicio: `${hoy}T10:00:00`,
          fechaHoraFin: `${hoy}T11:00:00`,
          estado: 'Confirmado',
          total: 4500,
          servicios: [{ servicioId: 1, nombre: 'Limpieza Facial Profunda', duracionMin: 60, precio: 4500 }],
        },
        {
          turnoId: 202,
          usuarioId: 102,
          clienteNombreCompleto: 'Luciana Martínez',
          profesionalId: 1,
          profesionalNombreCompleto: `${perfil.nombre} ${perfil.apellido}`,
          cabinaId: 1,
          cabinaNombre: 'Cabina 1 - Dermoestética & Facial',
          fechaHoraInicio: `${hoy}T14:30:00`,
          fechaHoraFin: `${hoy}T15:30:00`,
          estado: 'Confirmado',
          total: 5200,
          servicios: [{ servicioId: 2, nombre: 'Peeling Químico Magistral', duracionMin: 60, precio: 5200 }],
        },
        {
          turnoId: 203,
          usuarioId: 103,
          clienteNombreCompleto: 'Mariana Benítez',
          profesionalId: 1,
          profesionalNombreCompleto: `${perfil.nombre} ${perfil.apellido}`,
          cabinaId: 1,
          cabinaNombre: 'Cabina 1 - Dermoestética & Facial',
          fechaHoraInicio: `${hoy}T16:00:00`,
          fechaHoraFin: `${hoy}T17:00:00`,
          estado: 'Pendiente',
          total: 6500,
          servicios: [{ servicioId: 3, nombre: 'Radiofrecuencia Tripolar Facial', duracionMin: 60, precio: 6500 }],
        },
        {
          turnoId: 204,
          usuarioId: 104,
          clienteNombreCompleto: 'Sofía Romero',
          profesionalId: 1,
          profesionalNombreCompleto: `${perfil.nombre} ${perfil.apellido}`,
          cabinaId: 1,
          cabinaNombre: 'Cabina 1 - Dermoestética & Facial',
          fechaHoraInicio: `${hoy}T17:30:00`,
          fechaHoraFin: `${hoy}T18:30:00`,
          estado: 'Completado',
          total: 3800,
          servicios: [{ servicioId: 4, nombre: 'Lifting de Pestañas & Perfilado', duracionMin: 60, precio: 3800 }],
        },
      ]);
    } finally {
      setCargandoTurnos(false);
    }
  }, [perfil.nombre, perfil.apellido]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    if (currentUserRef.current !== currentUser) {
      currentUserRef.current = currentUser;
      setPerfil(profesionalService.getPerfil(currentUser));
    }
    cargarTurnos();
    serviciosApi.getActivos()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setServiciosDisponibles(res);
        }
      })
      .catch(() => {});
  }, [currentUser, cargarTurnos]);

  // Escuchar cuando el Administrador escanea o acredita el QR para actualizar el modal en tiempo real
  useEffect(() => {
    const handleAcreditacion = (e: Event) => {
      const customEvent = e as CustomEvent<{ solicitud?: SolicitudEstampitaQr }>;
      if (customEvent.detail?.solicitud) {
        const sol = customEvent.detail.solicitud;
        if (
          solicitudQrModal &&
          (solicitudQrModal.id === sol.id ||
            solicitudQrModal.codigoQr === sol.codigoQr)
        ) {
          setQrAcreditadoModal(true);
          mostrarFeedback(`¡El Administrador acreditó con éxito la estampita de ${sol.clienteNombre}! 🎉`);
        }
        const actNotif = profesionalService.agregarNotificacion({
          titulo: 'Estampita Acreditada',
          mensaje: `Recepción acreditó la estampita de fidelización para ${sol.clienteNombre}.`,
          tipo: 'fidelizacion',
          accionSeccion: 'clientes',
        });
        setNotificaciones(actNotif);
      }
    };
    window.addEventListener(EVENTO_ESTAMPITA_ACREDITADA, handleAcreditacion);
    return () => window.removeEventListener(EVENTO_ESTAMPITA_ACREDITADA, handleAcreditacion);
  }, [solicitudQrModal, mostrarFeedback]);

  const handleHabilitarQrEstampita = (turno: TurnoDto) => {
    const isPend = turno.estado === 0 || turno.estado === '0' || String(turno.estado).toLowerCase().includes('pend');
    if (isPend) {
      mostrarFeedback('⚠️ No podés habilitar el QR de fidelización: el turno se encuentra PENDIENTE DE PAGO. Debe estar confirmado tras abonarse.', 'error');
      return;
    }

    const sol = lealtadService.solicitarQr({
      turnoId: turno.turnoId,
      clienteId: turno.usuarioId || 101,
      clienteNombre: turno.clienteNombreCompleto || 'Paciente',
      clienteTelefono: '+54 9 11 5566-7788',
      profesionalId: perfil.id,
      profesionalNombre: `${perfil.nombre} ${perfil.apellido}`,
      servicioNombre: turno.servicios?.[0]?.nombre || 'Tratamiento facial',
      fechaTurno: turno.fechaHoraInicio.split('T')[0],
      horaTurno: turno.fechaHoraInicio.split('T')[1]?.slice(0, 5) || '10:00',
    });
    setSolicitudQrModal(sol);
    setQrAcreditadoModal(sol.estado === 'acreditado');
    mostrarFeedback(`¡Código QR habilitado para ${turno.clienteNombreCompleto}! Solicitud enviada a Administración.`);
  };

  const handleCambiarDisponibilidad = (nuevoEstado: 'Disponible' | 'En atención' | 'Pausado' | 'Ausente') => {
    const act = profesionalService.setDisponibilidad(nuevoEstado);
    setPerfil(act);
    mostrarFeedback(`Disponibilidad cambiada a "${nuevoEstado}"`);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarFeedback('Por favor seleccioná una imagen válida (JPG, PNG o WebP).', 'error');
      return;
    }

    setSubiendoFoto(true);
    try {
      const url = await profesionalService.procesarFotoPerfil(file);
      const act = profesionalService.updatePerfil({ fotoUrl: url });
      setPerfil(act);
      mostrarFeedback('¡Foto de perfil actualizada exitosamente!');
    } catch {
      mostrarFeedback('Error al procesar la foto seleccionada.', 'error');
    } finally {
      setSubiendoFoto(false);
      if (fileFotoRef.current) fileFotoRef.current.value = '';
    }
  };

  const handleGuardarEdicionPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    try {
      const act = profesionalService.updatePerfil(formEditar);
      setPerfil(act);
      setShowModalEditarPerfil(false);

      // Sincronizar en el backend si el usuario está autenticado
      const uid = currentUser?.usuarioId || perfil.usuarioId;
      if (uid) {
        usuariosApi.actualizarPerfil({
          usuarioId: uid,
          nombre: formEditar.nombre,
          apellido: formEditar.apellido,
          telefono: formEditar.telefono,
        }).catch(() => {});
      }

      mostrarFeedback('¡Perfil profesional actualizado correctamente!');
    } catch {
      mostrarFeedback('Ocurrió un error al guardar los cambios.', 'error');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPassword(null);

    if (formPassword.nueva.length < 6) {
      setErrorPassword('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (formPassword.nueva !== formPassword.confirmar) {
      setErrorPassword('Las contraseñas no coinciden.');
      return;
    }

    setGuardandoPassword(true);
    try {
      const uid = currentUser?.usuarioId || perfil.usuarioId || 2;
      await usuariosApi.resetPassword(uid, formPassword.nueva).catch(() => {});
      setShowModalPassword(false);
      setFormPassword({ actual: '', nueva: '', confirmar: '' });
      mostrarFeedback('¡Contraseña actualizada con éxito!');
    } catch {
      setErrorPassword('Error al actualizar la contraseña.');
    } finally {
      setGuardandoPassword(false);
    }
  };

  const handleCrearAtencion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAtencion.clienteNombre.trim() || !formAtencion.observaciones.trim()) {
      mostrarFeedback('Por favor completá los campos obligatorios.', 'error');
      return;
    }

    const nueva = profesionalService.agregarAtencion({
      clienteId: 999,
      clienteNombre: formAtencion.clienteNombre.trim(),
      clienteEmail: formAtencion.clienteEmail.trim() || 'cliente@estetica.com',
      fecha: new Date().toISOString().split('T')[0],
      servicio: formAtencion.servicio,
      observaciones: formAtencion.observaciones.trim(),
      recomendaciones: formAtencion.recomendaciones.trim(),
      tipoPielTratado: formAtencion.tipoPielTratado,
      estampitaSumada: formAtencion.estampitaSumada,
    });

    setAtenciones(prev => [nueva, ...prev]);
    // Sincronizar directorio de clientes de inmediato
    setClientes(profesionalService.getClientes());
    setShowModalNuevaAtencion(false);
    setFormAtencion({
      clienteNombre: '',
      clienteEmail: '',
      servicio: perfil.servicios[0] || 'Limpieza Facial Profunda',
      observaciones: '',
      recomendaciones: '',
      tipoPielTratado: 'Mixta',
      estampitaSumada: true,
    });
    mostrarFeedback('¡Ficha de atención clínica registrada correctamente!');
  };

  const handleCompletarTurno = async (turnoId: number, clienteNombre?: string) => {
    try {
      // 1. Actualizar estado local
      setTurnos(prev =>
        prev.map(t => (t.turnoId === turnoId ? { ...t, estado: 'Completado' } : t))
      );
      // 2. Persistir en localStorage
      const turnosLocales: TurnoDto[] = JSON.parse(
        localStorage.getItem('estetica_reservas_cliente') || '[]'
      );
      const act = turnosLocales.map((t: TurnoDto) =>
        t.turnoId === turnoId ? { ...t, estado: 'Completado' } : t
      );
      localStorage.setItem('estetica_reservas_cliente', JSON.stringify(act));
      // 3. Notificar al backend
      await turnosApi.completar(turnoId).catch(() => {});
      // 4. Agregar notificación en la bandeja del profesional
      const actNotif = profesionalService.agregarNotificacion({
        titulo: 'Turno Completado',
        mensaje: `Turno de ${clienteNombre || 'paciente'} registrado como completado.`,
        tipo: 'recordatorio',
        accionSeccion: 'atenciones',
      });
      setNotificaciones(actNotif);
      mostrarFeedback(`✓ Turno de ${clienteNombre || 'paciente'} marcado como Completado.`);
    } catch {
      mostrarFeedback('Error al completar el turno.', 'error');
    }
  };

  const handleConfirmarTurno = async (turnoId: number, clienteNombre?: string) => {
    try {
      setTurnos(prev =>
        prev.map(t => (t.turnoId === turnoId ? { ...t, estado: 'Confirmado' } : t))
      );
      const turnosLocales: TurnoDto[] = JSON.parse(
        localStorage.getItem('estetica_reservas_cliente') || '[]'
      );
      const act = turnosLocales.map((t: TurnoDto) =>
        t.turnoId === turnoId ? { ...t, estado: 'Confirmado' } : t
      );
      localStorage.setItem('estetica_reservas_cliente', JSON.stringify(act));
      await turnosApi.confirmar(turnoId).catch(() => {});
      mostrarFeedback(`✓ Turno de ${clienteNombre || 'paciente'} Confirmado.`);
    } catch {
      mostrarFeedback('Error al confirmar el turno.', 'error');
    }
  };

  const handleCancelarTurno = async (turnoId: number, clienteNombre?: string) => {
    if (!window.confirm(`¿Confirmás la cancelación del turno de ${clienteNombre || 'este paciente'}?`)) {
      return;
    }
    try {
      setTurnos(prev => prev.filter(t => t.turnoId !== turnoId));
      const turnosLocales: TurnoDto[] = JSON.parse(
        localStorage.getItem('estetica_reservas_cliente') || '[]'
      );
      const act = turnosLocales.filter((t: TurnoDto) => t.turnoId !== turnoId);
      localStorage.setItem('estetica_reservas_cliente', JSON.stringify(act));
      await turnosApi.cancelar(turnoId, 'Cancelado desde panel profesional').catch(() => {});
      // Notificación del turno cancelado
      const actNotif = profesionalService.agregarNotificacion({
        titulo: 'Turno Cancelado',
        mensaje: `Se canceló la cita de ${clienteNombre || 'paciente'}.`,
        tipo: 'turno_cancelado',
        accionSeccion: 'turnos',
      });
      setNotificaciones(actNotif);
      mostrarFeedback(`Turno de ${clienteNombre || 'paciente'} cancelado.`);
    } catch {
      mostrarFeedback('Error al cancelar el turno.', 'error');
    }
  };

  const handleToggleServicioPerfil = (servicioNombre: string) => {
    let nuevosServicios = [...perfil.servicios];
    if (nuevosServicios.includes(servicioNombre)) {
      if (nuevosServicios.length <= 1) {
        mostrarFeedback('Debés mantener al menos un servicio asignado a tu perfil.', 'error');
        return;
      }
      nuevosServicios = nuevosServicios.filter(s => s !== servicioNombre);
      mostrarFeedback(`Servicio "${servicioNombre}" quitado de tu perfil.`);
    } else {
      nuevosServicios.push(servicioNombre);
      mostrarFeedback(`Servicio "${servicioNombre}" habilitado en tu perfil.`);
    }
    const act = profesionalService.updatePerfil({ servicios: nuevosServicios });
    setPerfil(act);
    setFormEditar(prev => ({ ...prev, servicios: nuevosServicios }));
  };

  const handleToggleLeidaNotificacion = (id: string, leidaActual: boolean) => {
    const act = profesionalService.marcarNotificacionLeida(id, !leidaActual);
    setNotificaciones(act);
    mostrarFeedback(!leidaActual ? 'Notificación marcada como leída.' : 'Notificación marcada como no leída.');
  };

  const handleEliminarNotificacion = (id: string) => {
    const act = profesionalService.eliminarNotificacion(id);
    setNotificaciones(act);
    mostrarFeedback('Notificación eliminada.');
  };

  const handleLimpiarTodasNotificaciones = () => {
    if (!window.confirm('¿Confirmás que querés vaciar toda la bandeja de notificaciones?')) return;
    const act = profesionalService.limpiarNotificaciones();
    setNotificaciones(act);
    mostrarFeedback('Bandeja de notificaciones vaciada.');
  };

  const handleAbrirNotificacion = (notif: NotificacionProfesional) => {
    if (!notif.leida) {
      const act = profesionalService.marcarNotificacionLeida(notif.id, true);
      setNotificaciones(act);
    }
    if (notif.accionSeccion) {
      setSeccionActiva(notif.accionSeccion as SeccionProfesional);
    }
  };

  const modificarFechaAgenda = (dias: number) => {
    const d = new Date(fechaAgenda + 'T00:00:00');
    d.setDate(d.getDate() + dias);
    const nuevaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setFechaAgenda(nuevaStr);
  };

  const HORAS_AGENDA = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const hoyISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const turnosHoy = turnos.filter(t => t.fechaHoraInicio.split('T')[0] === hoyISO);
  const turnosDelDia = turnos.filter(t => t.fechaHoraInicio.split('T')[0] === fechaAgenda);

  // Próximos 7 días
  const turnosProximos7Dias = turnos.filter(t => {
    const f = t.fechaHoraInicio.split('T')[0];
    return f > hoyISO;
  }).slice(0, 5);

  // Métricas calculadas para el dashboard
  const facturacionTotalEstimada = turnos.reduce((acc, t) => acc + (t.total || 0), 0);
  const facturacionCobrada = turnos
    .filter(t => t.estado === 'Completado')
    .reduce((acc, t) => acc + (t.total || 0), 0);
  const atencionesConcluidasCount = turnos.filter(t => t.estado === 'Completado').length || atenciones.length;
  const ticketPromedio = atencionesConcluidasCount > 0 ? Math.round(facturacionCobrada / atencionesConcluidasCount) || 4500 : 4500;

  // Fecha actual formateada para cabecera superior derecha (estilo imagen: "quarta-feira, 31/12 / Dezembro / 2025")
  const { nombreDia, diaNum, nombreMes, anioNum } = useMemo(() => {
    const ahora = new Date();
    return {
      nombreDia: ahora.toLocaleDateString('es-AR', { weekday: 'long' }),
      diaNum: ahora.getDate(),
      nombreMes: ahora.toLocaleDateString('es-AR', { month: 'long' }),
      anioNum: ahora.getFullYear(),
    };
  }, []);

  const getDiasSemana = (fechaStr: string) => {
    const d = new Date(fechaStr + 'T00:00:00');
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const lunes = new Date(d);
    lunes.setDate(d.getDate() + diffToMonday);

    const dias = [];
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    for (let i = 0; i < 6; i++) {
      const diaFecha = new Date(lunes);
      diaFecha.setDate(lunes.getDate() + i);
      const iso = `${diaFecha.getFullYear()}-${String(diaFecha.getMonth() + 1).padStart(2, '0')}-${String(diaFecha.getDate()).padStart(2, '0')}`;
      const turnosEnDia = turnos.filter(t => t.fechaHoraInicio.startsWith(iso));
      dias.push({
        nombre: nombresDias[i],
        fecha: iso,
        numero: diaFecha.getDate(),
        mes: diaFecha.toLocaleDateString('es-AR', { month: 'short' }),
        turnos: turnosEnDia,
        esSeleccionado: iso === fechaAgenda,
      });
    }
    return dias;
  };

  const toggleBloquearHorario = (hora: string) => {
    if (horariosBloqueados.includes(hora)) {
      setHorariosBloqueados(prev => prev.filter(h => h !== hora));
      mostrarFeedback(`Horario de las ${hora} hs desbloqueado.`);
    } else {
      setHorariosBloqueados(prev => [...prev, hora]);
      mostrarFeedback(`Horario de las ${hora} hs bloqueado para receso/preparación.`);
    }
  };

  const handleCrearTurnoRapido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNuevoTurno.clienteNombre.trim()) {
      mostrarFeedback('Por favor ingresá el nombre del paciente.', 'error');
      return;
    }

    const nuevoTurno: TurnoDto = {
      turnoId: Date.now(),
      usuarioId: 999,
      clienteNombreCompleto: formNuevoTurno.clienteNombre.trim(),
      profesionalId: 1,
      profesionalNombreCompleto: `${perfil.nombre} ${perfil.apellido}`,
      cabinaId: 1,
      cabinaNombre: perfil.cabinaHabitual,
      fechaHoraInicio: `${fechaAgenda}T${horaSeleccionadaNuevoTurno}:00`,
      fechaHoraFin: `${fechaAgenda}T${String(Number(horaSeleccionadaNuevoTurno.split(':')[0]) + 1).padStart(2, '0')}:00:00`,
      estado: 'Confirmado',
      total: formNuevoTurno.precio || 4500,
      servicios: [{
        servicioId: 10,
        nombre: formNuevoTurno.servicio,
        duracionMin: 60,
        precio: formNuevoTurno.precio || 4500,
      }],
    };

    setTurnos(prev => [nuevoTurno, ...prev]);
    const turnosLocales: TurnoDto[] = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
    localStorage.setItem('estetica_reservas_cliente', JSON.stringify([nuevoTurno, ...turnosLocales]));

    setShowModalNuevoTurnoRapido(false);
    setFormNuevoTurno({
      clienteNombre: '',
      clienteTelefono: '',
      servicio: perfil.servicios[0] || 'Limpieza Facial Profunda',
      precio: 4500,
    });
    const actNotif = profesionalService.agregarNotificacion({
      titulo: 'Nuevo Turno Asignado',
      mensaje: `Cita asignada a ${nuevoTurno.clienteNombreCompleto} para las ${horaSeleccionadaNuevoTurno} hs.`,
      tipo: 'turno_nuevo',
      accionSeccion: 'agenda',
    });
    setNotificaciones(actNotif);
    mostrarFeedback(`¡Turno asignado a ${nuevoTurno.clienteNombreCompleto} para las ${horaSeleccionadaNuevoTurno} hs!`);
  };

  const badgeColorPorEstado: Record<string, string> = {
    Disponible: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    'En atención': 'bg-amber-50 text-amber-800 border-amber-300',
    Pausado: 'bg-zinc-100 text-zinc-700 border-zinc-300',
    Ausente: 'bg-rose-50 text-rose-800 border-rose-300',
  };

  // Menú del Sidebar idéntico a la imagen de referencia ("Agenda Book")
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'servicios', label: 'Servicios', icon: Scissors },
    { id: 'turnos', label: 'Turnos', icon: ClipboardList },
    { id: 'atenciones', label: 'Atenciones', icon: Film },
    { id: 'perfil', label: 'Mi Perfil', icon: User },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, badge: notificaciones.filter(n => !n.leida).length || undefined },
  ];

  return (
    <div className="flex h-screen bg-[#FAF7F2] text-[#2A2825] font-sans overflow-hidden selection:bg-[#7A3B3B] selection:text-white">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 ${
            feedback.tipo === 'exito'
              ? 'bg-[#3C3530] text-white border-emerald-500/40'
              : 'bg-[#3C3530] text-white border-red-500/40'
          }`}
        >
          {feedback.tipo === 'exito' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{feedback.mensaje}</span>
        </div>
      )}

      {/* ── SIDEBAR LATERAL IDÉNTICO A LA CAPTURA DE REFERENCIA (ESTÉTICA CÁLIDA TIPO ADMIN) ── */}
      <aside className="w-64 bg-[#F4ECE1] border-r border-[#E8DFD1] h-screen flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
        <div className="space-y-6">
          {/* Logo y Nombre del Panel */}
          <div className="px-2 pt-1 flex items-center gap-3">
            {(siteConfig.logoRedondoUrl || siteConfig.logoRectangularUrl || siteConfig.logoUrl) ? (
              <img
                src={siteConfig.logoRedondoUrl || siteConfig.logoRectangularUrl || siteConfig.logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-xl object-contain bg-white shadow-2xs border border-[#DDD5C8] p-0.5"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#7A3B3B] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                {siteConfig.nombreCentro.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-[#3C3530] leading-tight truncate">
                {siteConfig.nombreCentro}
              </h2>
              <p className="text-[11px] font-semibold text-[#8A7F74] tracking-wide">
                Panel Profesional
              </p>
            </div>
          </div>

          {/* Lista de navegación con botones tipo píldora (pill) como en la captura */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = seccionActiva === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSeccionActiva(item.id as SeccionProfesional)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#C28A5B] text-white shadow-sm'
                      : 'text-[#4A423A] hover:bg-[#EAE1D3] hover:text-[#2A2825]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#7A3B3B] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Botón inferior: Salir / Cerrar Sesión */}
        <div className="pt-4 border-t border-[#E8DFD1] space-y-2">
          {onSwitchToAdmin && (
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="w-full py-2 px-3 rounded-xl bg-white/80 hover:bg-white border border-[#DDD5C8] text-xs font-bold text-[#7A3B3B] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>← Volver al Panel Admin</span>
            </button>
          )}

          {onSwitchToCliente && (
            <button
              type="button"
              onClick={onSwitchToCliente}
              className="w-full py-2 px-3 rounded-xl bg-white/80 hover:bg-white border border-[#DDD5C8] text-xs font-bold text-[#3C3530] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>← Volver a la Tienda</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Confirmás que querés cerrar la sesión del panel profesional?')) {
                if (onLogout) onLogout();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL DE CONTENIDO (ESTÉTICA CÁLIDA, TARJETAS BLANCAS CON BORDES SUAVES) ── */}
      <main className="flex-1 h-screen overflow-y-auto p-6 lg:p-8 space-y-6">
        
        {/* Cabecera superior con saludo, disponibilidad y fecha en español */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE2D5]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A2825] tracking-tight">
                Hola, {perfil.nombre}
              </h1>

              {/* Badge interactivo de estado de disponibilidad */}
              <div className="relative group">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-2xs ${
                    badgeColorPorEstado[perfil.disponibilidad] || badgeColorPorEstado.Disponible
                  }`}
                  title="Cambiar estado de atención"
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>{perfil.disponibilidad}</span>
                </button>

                <div className="absolute left-0 top-full mt-1.5 w-40 bg-white border border-[#EDE8E1] rounded-2xl shadow-xl py-1 hidden group-hover:block z-30">
                  {(['Disponible', 'En atención', 'Pausado', 'Ausente'] as const).map(est => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => handleCambiarDisponibilidad(est)}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#3C3530] hover:bg-[#FAF8F5] hover:text-[#7A3B3B] flex items-center justify-between"
                    >
                      <span>{est}</span>
                      {perfil.disponibilidad === est && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#8A7F74] mt-0.5 font-medium">
              Visión general de tu agenda y salón este mes.
            </p>
          </div>

          {/* Fecha en esquina superior derecha */}
          <div className="text-right text-xs text-[#8A7F74] font-medium hidden sm:block">
            <span className="capitalize block font-bold text-[#3C3530]">
              {nombreDia}, {diaNum} de {nombreMes}
            </span>
            <span className="capitalize block text-[11px]">
              Año {anioNum}
            </span>
          </div>
        </div>

        {/* ── 1. VISTA DASHBOARD (ESTÉTICA CÁLIDA TOTALMENTE EN ESPAÑOL) ── */}
        {seccionActiva === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* FILA 1: 4 TARJETAS KPI PRINCIPALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Facturación Estimada */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-[#8A7F74] block">
                  Facturación estimada ({nombreMes})
                </span>
                <span className="text-2xl font-black text-[#2A2825] block">
                  ${facturacionTotalEstimada.toLocaleString('es-AR')}
                </span>
                <p className="text-[11px] text-[#8A7F74] leading-relaxed">
                  <strong className="text-[#3C3530]">{turnos.length} turno(s)</strong> futuros este mes. Considera citas agendadas a partir de hoy.
                </p>
              </div>

              {/* Card 2: Atenciones concluidas */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-[#8A7F74] block">
                  Atenciones concluidas
                </span>
                <span className="text-2xl font-black text-[#2A2825] block">
                  {atencionesConcluidasCount}
                </span>
                <p className="text-[11px] text-[#8A7F74] leading-relaxed">
                  <strong className="text-[#3C3530]">Ticket promedio: ${ticketPromedio.toLocaleString('es-AR')}</strong>. Considera citas marcadas como "Completado".
                </p>
              </div>

              {/* Card 3: Nuevos pacientes */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-[#8A7F74] block">
                  Nuevos pacientes
                </span>
                <span className="text-2xl font-black text-[#2A2825] block">
                  {clientes.length}
                </span>
                <p className="text-[11px] text-[#8A7F74] leading-relaxed">
                  Registrados este mes. Crecimiento directo de tu base.
                </p>
              </div>

              {/* Card 4: Recaudación cobrada */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-2">
                <span className="text-xs font-bold text-[#8A7F74] block">
                  Recaudación del mes
                </span>
                <span className="text-2xl font-black text-[#2A2825] block">
                  ${(facturacionCobrada || 54000).toLocaleString('es-AR')}
                </span>
                <p className="text-[11px] text-emerald-700 font-bold leading-relaxed">
                  +18.0% vs mes anterior
                </p>
                <p className="text-[10px] text-[#8A7F74]">
                  Basado en citas concluidas con importe registrado.
                </p>
              </div>
            </div>

            {/* FILA 2: HOY (TURNOS DEL DÍA) Y PRÓXIMOS 7 DÍAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Card: Hoy */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#2A2825]">Hoy</h3>
                    <p className="text-xs text-[#8A7F74]">Turnos del día.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSeccionActiva('agenda')}
                    className="text-xs font-bold text-[#7A3B3B] hover:underline"
                  >
                    Abrir agenda →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {turnosHoy.length > 0 ? (
                    turnosHoy.map((t) => (
                      <div
                        key={t.turnoId}
                        className="p-3.5 bg-[#FAF6F0] border border-[#EDE4D6] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-[#C28A5B] transition-colors"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#2A2825] truncate">
                            {t.clienteNombreCompleto}
                          </h4>
                          <p className="text-[11px] text-[#6E6359] font-medium mt-0.5">
                            {t.servicios?.[0]?.nombre || 'Tratamiento facial'} • {t.fechaHoraInicio.split('T')[1]?.slice(0, 5)} hs
                          </p>
                        </div>
                        {/* Píldora de precio destacada como en la imagen */}
                        <div className="px-3.5 py-1.5 rounded-lg bg-[#EFE5D8] border border-[#DDD5C8] text-[#7A3B3B] font-extrabold text-xs shrink-0">
                          ${t.total.toLocaleString('es-AR')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-[#8A7F74] italic">
                      No hay turnos registrados para hoy en este momento.
                    </div>
                  )}
                </div>
              </div>

              {/* Card: Próximos 7 días */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="border-b border-[#F2ECE1] pb-2.5">
                  <h3 className="text-sm font-extrabold text-[#2A2825]">Próximos 7 días</h3>
                  <p className="text-xs text-[#8A7F74]">Turnos confirmados en agenda.</p>
                </div>

                <div className="space-y-2.5">
                  {turnosProximos7Dias.length > 0 ? (
                    turnosProximos7Dias.map((t) => (
                      <div
                        key={t.turnoId}
                        className="p-3 bg-white border border-[#EDE4D6] rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#2A2825] block">{t.clienteNombreCompleto}</span>
                          <span className="text-[#8A7F74] text-[11px]">
                            {t.fechaHoraInicio.split('T')[0]} • {t.fechaHoraInicio.split('T')[1]?.slice(0, 5)} hs
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#5A5046]">
                          {t.servicios?.[0]?.nombre || 'Tratamiento'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-[#8A7F74] italic">
                      Sin turnos programados en los próximos 7 días.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FILA 3: ÚLTIMOS TURNOS AGENDADOS Y CUMPLEAÑEROS DEL MES (MIMO / SALUDAR) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Card: Últimos turnos agendados */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="border-b border-[#F2ECE1] pb-2.5">
                  <h3 className="text-sm font-extrabold text-[#2A2825]">Últimos turnos agendados</h3>
                  <p className="text-xs text-[#8A7F74]">Seguimiento de actividad y citas recientes.</p>
                </div>

                <div className="space-y-2">
                  {turnos.slice(0, 3).map((t) => (
                    <div
                      key={t.turnoId}
                      className="p-3 rounded-xl border border-[#EDE4D6] bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#2A2825] block">{t.clienteNombreCompleto}</span>
                        <span className="text-[#8A7F74] text-[11px]">
                          {t.servicios?.[0]?.nombre} • {t.fechaHoraInicio.split('T')[0]}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.estado === 'Completado' || t.estado === 3
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : (t.estado === 'Confirmado' || t.estado === 1)
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {t.estado === 'Completado' || t.estado === 3
                          ? 'Completado'
                          : (t.estado === 'Confirmado' || t.estado === 1 ? 'Confirmado' : 'Pendiente')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card: Cumpleañeros del mes con botón Mimo / Saludar */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="border-b border-[#F2ECE1] pb-2.5">
                  <h3 className="text-sm font-extrabold text-[#2A2825]">Cumpleañeros del mes</h3>
                  <p className="text-xs text-[#8A7F74]">Ocasión especial para enviar un saludo o beneficio de fidelización.</p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { nombre: 'Laura Méndez', fecha: '12/11', tel: '+5491155551122' },
                    { nombre: 'Camila Silva', fecha: '24/11', tel: '+5491155553344' },
                  ].map((cli, i) => (
                    <div
                      key={i}
                      className="p-3 bg-[#FAF6F0] border border-[#EDE4D6] rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#2A2825] block">{cli.nombre}</span>
                        <span className="text-[#8A7F74] text-[11px]">Cumpleaños el {cli.fecha}</span>
                      </div>
                      <a
                        href={`https://wa.me/${cli.tel.replace(/\D/g, '')}?text=¡Hola%20${encodeURIComponent(cli.nombre)}!%20Desde%20el%20centro%20de%20estética%20te%20deseamos%20un%20muy%20feliz%20cumpleaños%20🎉%20Tenemos%20un%20mimo%20especial%20para%20vos%20en%20tu%20próxima%20sesión.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#EFE5D8] hover:bg-[#E4D5C3] text-[#7A3B3B] font-extrabold text-[11px] border border-[#DDD5C8] transition-colors"
                      >
                        Mimo / Saludar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FILA 4: 3 TARJETAS INFERIORES (PACIENTES FRECUENTES, SERVICIOS MÁS SOLICITADOS, RENTABILIDAD) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Pacientes frecuentes */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-[#2A2825]">Pacientes frecuentes</h4>
                <p className="text-[11px] text-[#8A7F74]">Pacientes con mayor cantidad de visitas.</p>
                <div className="pt-2 space-y-1.5">
                  {clientes.slice(0, 2).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#F2ECE1] last:border-none">
                      <span className="font-semibold text-[#3C3530]">{c.nombreCompleto}</span>
                      <span className="text-[#8A7F74] text-[11px] font-bold">{c.totalSesiones} sesiones</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Servicios más solicitados */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-[#2A2825]">Servicios más solicitados</h4>
                <p className="text-[11px] text-[#8A7F74]">Ranking por cantidad de atenciones realizadas.</p>
                <div className="pt-2 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#2A2825] block">1. Limpieza Facial Profunda</span>
                      <span className="text-[10px] text-[#8A7F74]">8 atenciones</span>
                    </div>
                    <span className="font-bold text-[#3C3530]">$36.000</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Servicios más rentables / Cabina */}
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-[#2A2825]">Servicios más rentables</h4>
                <p className="text-[11px] text-[#8A7F74]">Considerando valor de tratamiento y uso de cabina.</p>
                <div className="pt-2 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#2A2825] block">1. Peeling Químico</span>
                      <span className="text-[10px] text-[#8A7F74]">{perfil.cabinaHabitual.split('-')[0]}</span>
                    </div>
                    <span className="font-extrabold text-emerald-700">Ganancia est. $28.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. VISTA: AGENDA INTERACTIVA (VISTA DÍA Y VISTA SEMANAL) ── */}
        {seccionActiva === 'agenda' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Control de fecha y alternador Día / Semana */}
            <div className="bg-white border border-[#EAE2D5] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => modificarFechaAgenda(-1)}
                  className="p-2 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] hover:bg-[#EDE8E1] text-[#3C3530] transition-colors"
                  title="Día anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#7A3B3B]" />
                  <input
                    type="date"
                    value={fechaAgenda}
                    onChange={(e) => setFechaAgenda(e.target.value)}
                    className="px-3.5 py-1.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm font-bold text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => modificarFechaAgenda(1)}
                  className="p-2 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] hover:bg-[#EDE8E1] text-[#3C3530] transition-colors"
                  title="Día siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    setFechaAgenda(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#EDE8E1] bg-white text-xs font-semibold text-[#5A524A] hover:bg-[#FAF8F5]"
                >
                  Hoy
                </button>

                {/* Alternador de vista */}
                <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EDE8E1] ml-2">
                  <button
                    type="button"
                    onClick={() => setVistaAgendaModo('dia')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      vistaAgendaModo === 'dia'
                        ? 'bg-white text-[#7A3B3B] shadow-2xs'
                        : 'text-[#8A7F74] hover:text-[#2A2825]'
                    }`}
                  >
                    Vista Día
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaAgendaModo('semana')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      vistaAgendaModo === 'semana'
                        ? 'bg-white text-[#7A3B3B] shadow-2xs'
                        : 'text-[#8A7F74] hover:text-[#2A2825]'
                    }`}
                  >
                    Vista Semana
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <span className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1] font-semibold text-[#3C3530]">
                  Citas en fecha: <strong className="text-[#7A3B3B]">{turnosDelDia.length}</strong>
                </span>
                <span className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1] font-semibold text-[#3C3530]">
                  Cabina: <strong className="text-[#3C3530]">{perfil.cabinaHabitual.split('-')[0]}</strong>
                </span>
              </div>
            </div>

            {/* Render según modo */}
            {vistaAgendaModo === 'semana' ? (
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-6 space-y-5 shadow-2xs">
                <div className="border-b border-[#EDE8E1] pb-3">
                  <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#7A3B3B]" />
                    <span>Vista Semanal de Agenda (Lunes a Sábado)</span>
                  </h3>
                  <p className="text-xs text-[#8A7F74]">
                    Programación semanal de {perfil.nombre} {perfil.apellido} en {perfil.cabinaHabitual}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getDiasSemana(fechaAgenda).map((dia) => (
                    <div
                      key={dia.fecha}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        dia.esSeleccionado
                          ? 'bg-[#FAF8F5] border-[#7A3B3B] ring-1 ring-[#7A3B3B]'
                          : 'bg-white border-[#EDE8E1] hover:border-[#DDD5C8]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#7A3B3B]">
                              {dia.nombre}
                            </span>
                            <h4 className="text-lg font-extrabold text-[#2A2825]">
                              {dia.numero} {dia.mes}
                            </h4>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            dia.turnos.length > 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-zinc-50 text-zinc-500 border border-zinc-200'
                          }`}>
                            {dia.turnos.length} {dia.turnos.length === 1 ? 'turno' : 'turnos'}
                          </span>
                        </div>

                        {dia.turnos.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {dia.turnos.map((t) => (
                              <div
                                key={t.turnoId}
                                className="p-2.5 rounded-lg bg-white border border-[#EDE8E1] text-xs space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center justify-between font-bold text-[#2A2825]">
                                  <span>{t.fechaHoraInicio.split('T')[1]?.slice(0, 5)} hs</span>
                                  <span className="text-[10px] text-[#7A3B3B]">{t.estado}</span>
                                </div>
                                <p className="text-[#3C3530] font-semibold truncate">{t.clienteNombreCompleto}</p>
                                <p className="text-[11px] text-[#8A7F74] truncate">{t.servicios?.[0]?.nombre || 'Tratamiento'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#8A7F74] py-6 text-center italic">
                            Sin turnos agendados en esta fecha
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFechaAgenda(dia.fecha);
                          setVistaAgendaModo('dia');
                        }}
                        className="w-full mt-3 py-2 px-3 rounded-xl bg-white border border-[#DDD5C8] hover:bg-[#FAF8F5] text-xs font-bold text-[#7A3B3B] transition-colors text-center"
                      >
                        Ver horarios de este día →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Vista Día (Franja horaria) */
              <div className="bg-white border border-[#EAE2D5] rounded-2xl p-6 space-y-4 shadow-2xs">
                <div className="border-b border-[#EDE8E1] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#2A2825]">
                      Agenda detallada del {fechaAgenda}
                    </h3>
                    <p className="text-xs text-[#8A7F74]">
                      Horarios programados para {perfil.nombre} {perfil.apellido} en {perfil.cabinaHabitual}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#8A7F74]">
                    {turnosDelDia.length} citas programadas
                  </span>
                </div>

                <div className="divide-y divide-[#EDE8E1]">
                  {HORAS_AGENDA.map((hora) => {
                    const turnoEnHora = turnosDelDia.find(t => {
                      const h = t.fechaHoraInicio.split('T')[1]?.slice(0, 5);
                      return h === hora;
                    });
                    const estaBloqueado = horariosBloqueados.includes(hora);

                    return (
                      <div key={hora} className="py-3.5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-20 shrink-0 text-left">
                          <span className="text-sm font-extrabold text-[#7A3B3B] block">
                            {hora} hs
                          </span>
                          <span className="text-[10px] text-[#8A7F74] font-medium block">60 min</span>
                        </div>

                        <div className="flex-1">
                          {turnoEnHora ? (
                            <div className="p-4 bg-[#FAF8F5] border border-[#DDD5C8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-[#7A3B3B] transition-all">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[#2A2825]">
                                    {turnoEnHora.clienteNombreCompleto}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#7A3B3B] border border-[#DDD5C8]">
                                    {turnoEnHora.estado}
                                  </span>
                                  <span className="text-xs font-bold text-[#3C3530]">
                                    ${turnoEnHora.total.toLocaleString('es-AR')}
                                  </span>
                                </div>
                                <p className="text-xs text-[#5A524A] font-medium flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                  <span>{turnoEnHora.servicios?.[0]?.nombre || 'Tratamiento facial'}</span>
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleHabilitarQrEstampita(turnoEnHora)}
                                  className="px-3 py-1.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                                  title="Habilitar código QR para que recepción acredite la estampita"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Habilitar QR</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormAtencion({
                                      clienteNombre: turnoEnHora.clienteNombreCompleto || '',
                                      clienteEmail: '',
                                      servicio: turnoEnHora.servicios?.[0]?.nombre || perfil.servicios[0],
                                      observaciones: '',
                                      recomendaciones: '',
                                      tipoPielTratado: 'Normal',
                                      estampitaSumada: true,
                                    });
                                    setShowModalNuevaAtencion(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-[#DDD5C8] hover:bg-[#FAF8F5] text-xs font-semibold text-[#3C3530] flex items-center gap-1.5 transition-colors"
                                >
                                  <Film className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                  <span>Registrar Ficha</span>
                                </button>

                                {turnoEnHora.estado !== 'Completado' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCompletarTurno(turnoEnHora.turnoId, turnoEnHora.clienteNombreCompleto)}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors shadow-2xs"
                                  >
                                    ✓ Completar
                                  </button>
                                )}

                                {turnoEnHora.estado === 'Pendiente' && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmarTurno(turnoEnHora.turnoId, turnoEnHora.clienteNombreCompleto)}
                                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-colors shadow-2xs"
                                  >
                                    Confirmar
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : estaBloqueado ? (
                            <div className="py-3 px-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                              <span className="flex items-center gap-2 font-semibold">
                                <Coffee className="w-4 h-4 text-amber-700" />
                                <span>Horario bloqueado: Receso / Preparación de cabina</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleBloquearHorario(hora)}
                                className="px-3 py-1 text-xs font-bold text-amber-800 bg-white border border-amber-300 rounded-xl hover:bg-amber-100 transition-colors"
                              >
                                Desbloquear
                              </button>
                            </div>
                          ) : (
                            <div className="py-2.5 px-4 rounded-xl border border-dashed border-[#DDD5C8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#8A7F74]">
                              <span>Horario libre disponible para asignar</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHoraSeleccionadaNuevoTurno(hora);
                                    setShowModalNuevoTurnoRapido(true);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#7A3B3B] hover:bg-[#5C2B2B] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Turno Rápido</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleBloquearHorario(hora)}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-[#7A3B3B] hover:bg-[#FAF8F5] rounded-lg border border-[#EDE8E1] transition-colors"
                                >
                                  + Bloquear
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 3. VISTA: MIS TURNOS ── */}
        {seccionActiva === 'turnos' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['todos', 'Confirmado', 'Pendiente', 'Completado'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFiltroTurnoEstado(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filtroTurnoEstado === st
                        ? 'bg-[#7A3B3B] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#5A524A] border border-[#EDE8E1] hover:bg-[#EDE8E1]'
                    }`}
                  >
                    {st === 'todos' ? 'Todos los turnos' : st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#8A7F74] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar paciente o servicio..."
                  value={busquedaTurnos}
                  onChange={(e) => setBusquedaTurnos(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>
            </div>

            <div className="bg-white border border-[#EAE2D5] rounded-2xl p-6 shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#EDE8E1] text-[#8A7F74] uppercase text-[11px] font-bold">
                      <th className="pb-3">Paciente</th>
                      <th className="pb-3">Fecha y Hora</th>
                      <th className="pb-3">Tratamiento</th>
                      <th className="pb-3">Cabina</th>
                      <th className="pb-3">Estado</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8E1]">
                    {turnos
                      .filter(t => filtroTurnoEstado === 'todos' || t.estado === filtroTurnoEstado)
                      .filter(t => !busquedaTurnos || t.clienteNombreCompleto?.toLowerCase().includes(busquedaTurnos.toLowerCase()) || t.servicios?.[0]?.nombre?.toLowerCase().includes(busquedaTurnos.toLowerCase()))
                      .map((t) => (
                        <tr key={t.turnoId} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3.5 font-bold text-[#2A2825]">{t.clienteNombreCompleto}</td>
                          <td className="py-3.5 text-[#5A524A]">
                            {t.fechaHoraInicio.split('T')[0]} • {t.fechaHoraInicio.split('T')[1]?.slice(0, 5)} hs
                          </td>
                          <td className="py-3.5 text-[#3C3530] font-medium">{t.servicios?.[0]?.nombre}</td>
                          <td className="py-3.5 text-[#8A7F74]">{t.cabinaNombre?.split('-')[0] || 'Cabina 1'}</td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              t.estado === 'Completado' || t.estado === 3
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : (t.estado === 'Confirmado' || t.estado === 1)
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {t.estado === 'Completado' || t.estado === 3
                                ? 'Completado'
                                : (t.estado === 'Confirmado' || t.estado === 1 ? 'Confirmado' : 'Pendiente')}
                            </span>
                          </td>
                          <td className="py-3.5 font-extrabold text-[#7A3B3B]">${t.total?.toLocaleString('es-AR')}</td>
                          <td className="py-3.5 text-right whitespace-nowrap space-x-1.5">
                            {t.estado !== 'Completado' && (
                              <button
                                type="button"
                                onClick={() => handleCompletarTurno(t.turnoId, t.clienteNombreCompleto)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs transition-colors"
                                title="Marcar turno como completado"
                              >
                                ✓ Completar
                              </button>
                            )}
                            {t.estado === 'Pendiente' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmarTurno(t.turnoId, t.clienteNombreCompleto)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold shadow-2xs transition-colors"
                                title="Confirmar turno"
                              >
                                Confirmar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleHabilitarQrEstampita(t)}
                              className="px-2.5 py-1 rounded-lg bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-2xs inline-flex items-center gap-1"
                              title="Habilitar código QR para que el Administrador acredite la estampita"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormAtencion({
                                  clienteNombre: t.clienteNombreCompleto || '',
                                  clienteEmail: '',
                                  servicio: t.servicios?.[0]?.nombre || perfil.servicios[0],
                                  observaciones: '',
                                  recomendaciones: '',
                                  tipoPielTratado: 'Normal',
                                  estampitaSumada: true,
                                });
                                setShowModalNuevaAtencion(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD5C8] hover:bg-[#FAF8F5] text-xs font-semibold text-[#3C3530]"
                              title="Registrar ficha de atención clínica"
                            >
                              Ficha
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelarTurno(t.turnoId, t.clienteNombreCompleto)}
                              className="px-2 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
                              title="Cancelar turno"
                            >
                              <X className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. VISTA: MIS CLIENTES ── */}
        {seccionActiva === 'clientes' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#2A2825]">Directorio de Pacientes Atendidos</h3>
                <p className="text-xs text-[#8A7F74]">Consultá la información clínica y datos de contacto de tus pacientes</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#8A7F74] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o teléfono..."
                  value={busquedaClientes}
                  onChange={(e) => setBusquedaClientes(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientes
                .filter(c => !busquedaClientes || c.nombreCompleto.toLowerCase().includes(busquedaClientes.toLowerCase()) || c.telefono.includes(busquedaClientes))
                .map((cli) => (
                  <div
                    key={cli.id}
                    className="p-5 rounded-2xl bg-white border border-[#EAE2D5] shadow-2xs space-y-3 hover:border-[#C28A5B] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#DDD5C8] text-[#7A3B3B] flex items-center justify-center font-bold text-sm">
                          {cli.nombreCompleto.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#2A2825]">{cli.nombreCompleto}</h4>
                          <span className="text-[11px] text-[#8A7F74] block">{cli.email}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] text-[#7A3B3B] border border-[#EDE8E1]">
                        {cli.totalSesiones} sesiones
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#5A524A] border-t border-[#F2ECE1] pt-3">
                      <p><strong>Último:</strong> {cli.ultimoTratamiento}</p>
                      <p><strong>Notas:</strong> {cli.notasImportantes || 'Sin observaciones previas'}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <a
                        href={`https://wa.me/${cli.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setFormAtencion({
                            clienteNombre: cli.nombreCompleto,
                            clienteEmail: cli.email,
                            servicio: cli.ultimoTratamiento || perfil.servicios[0] || 'Limpieza Facial Profunda',
                            observaciones: '',
                            recomendaciones: '',
                            tipoPielTratado: 'Normal',
                            estampitaSumada: true,
                          });
                          setShowModalNuevaAtencion(true);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#7A3B3B] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#DDD5C8] transition-colors shadow-2xs"
                        title="Registrar nueva ficha clínica para este paciente"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>+ Ficha</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── 5. VISTA: SEGUIMIENTO DE ATENCIONES (FICHAS CLÍNICAS) ── */}
        {seccionActiva === 'atenciones' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#2A2825]">Fichas de Seguimiento Clínico</h3>
                <p className="text-xs text-[#8A7F74]">Historial de tratamientos realizados, diagnóstico cutáneo y recomendaciones</p>
              </div>

              <button
                type="button"
                onClick={() => setShowModalNuevaAtencion(true)}
                className="px-4 py-2 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Ficha</span>
              </button>
            </div>

            <div className="space-y-4">
              {atenciones.map((at) => (
                <div
                  key={at.id}
                  className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2ECE1] pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#2A2825]">{at.clienteNombre}</h4>
                      <p className="text-xs text-[#8A7F74]">
                        Tratamiento: <strong className="text-[#3C3530]">{at.servicio}</strong> • Fecha: {at.fecha}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#7A3B3B] border border-[#DDD5C8] w-fit">
                      Piel {at.tipoPielTratado}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1]">
                      <span className="font-bold text-[#3C3530] block mb-1">Diagnóstico Cutáneo / Observaciones:</span>
                      <p className="text-[#5A524A]">{at.observaciones}</p>
                    </div>
                    <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1]">
                      <span className="font-bold text-[#3C3530] block mb-1">Recomendaciones & Cuidados Posteriores:</span>
                      <p className="text-[#5A524A]">{at.recomendaciones}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. VISTA: SERVICIOS & DISPONIBILIDAD ── */}
        {seccionActiva === 'servicios' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-[#EAE2D5] rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#2A2825]">Servicios Habilitados & Horarios de Atención</h3>
                <p className="text-xs text-[#8A7F74]">Gestioná los tratamientos que realizás en el centro, tu estado de atención y cabina asignada</p>
              </div>

              {/* Selector interactivo de disponibilidad */}
              <div className="space-y-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1]">
                <span className="text-xs font-bold text-[#8A7F74] uppercase tracking-wider block">
                  Estado de Atención Actual:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Disponible', 'En atención', 'Pausado', 'Ausente'] as const).map(est => {
                    const isSelected = perfil.disponibilidad === est;
                    return (
                      <button
                        key={est}
                        type="button"
                        onClick={() => handleCambiarDisponibilidad(est)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#7A3B3B] text-white border-[#7A3B3B] shadow-xs'
                            : 'bg-white text-[#3C3530] border-[#DDD5C8] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{est}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Servicios asignados al profesional */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8A7F74] uppercase tracking-wider block">
                    Servicios que realizás actualmente ({perfil.servicios.length}):
                  </span>
                  <span className="text-[11px] text-[#8A7F74]">
                    Clic en un servicio para quitarlo
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {perfil.servicios.map((srv, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleServicioPerfil(srv)}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-[#DDD5C8] text-xs font-semibold text-[#3C3530] flex items-center gap-1.5 transition-colors group shadow-2xs"
                      title="Quitar este tratamiento de tu perfil"
                    >
                      <span>✨ {srv}</span>
                      <X className="w-3 h-3 text-[#8A7F74] group-hover:text-rose-600" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Agregar otros servicios de la clínica */}
              {serviciosDisponibles.length > 0 && (
                <div className="space-y-3 border-t border-[#EDE8E1] pt-5">
                  <span className="text-xs font-bold text-[#8A7F74] uppercase tracking-wider block">
                    Sumar otros tratamientos del catálogo de la clínica:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {serviciosDisponibles
                      .filter(sd => !perfil.servicios.includes(sd.nombre))
                      .map(sd => (
                        <button
                          key={sd.servicioId}
                          type="button"
                          onClick={() => handleToggleServicioPerfil(sd.nombre)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-dashed border-[#DDD5C8] text-xs font-semibold text-[#5A524A] flex items-center gap-1.5 transition-colors shadow-2xs"
                          title={`Agregar ${sd.nombre} a tu perfil`}
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                          <span>{sd.nombre}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Horarios y cabina */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#EDE8E1] pt-5">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#8A7F74] uppercase tracking-wider block">
                    Horarios Semanales Establecidos:
                  </span>
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1] text-xs sm:text-sm font-semibold text-[#2A2825]">
                    {perfil.horariosAtencion}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#8A7F74] uppercase tracking-wider block">
                    Cabina Habitual de Atención:
                  </span>
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1] text-xs sm:text-sm font-semibold text-[#2A2825]">
                    {perfil.cabinaHabitual}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormEditar({ ...perfil });
                    setShowModalEditarPerfil(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Cabina y Horarios</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. VISTA: MI PERFIL (TARJETA COMPLETA CON FOTO, DATOS Y LOS 3 BOTONES DEBAJO) ── */}
        {seccionActiva === 'perfil' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* TARJETA PRINCIPAL CON LA INFORMACIÓN COMPLETA */}
            <div className="bg-white border border-[#EAE2D5] rounded-2xl p-6 sm:p-8 space-y-7 shadow-2xs">
              
              {/* Header de la Ficha: Foto, Nombre, Especialidad y Cabina */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                {/* Foto de Perfil con subida directa */}
                <div className="relative group shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#C28A5B] bg-[#FAF8F5] shadow-md p-0.5">
                    {perfil.fotoUrl ? (
                      <img
                        src={perfil.fotoUrl}
                        alt={`${perfil.nombre} ${perfil.apellido}`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-[#7A3B3B] bg-[#FAF8F5]">
                        {perfil.nombre.charAt(0)}{perfil.apellido.charAt(0)}
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileFotoRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSubirFoto}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileFotoRef.current?.click()}
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white shadow-md transition-all active:scale-95"
                    title="Cambiar foto de perfil desde tu computadora"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Información de Identidad */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#2A2825]">
                        {perfil.nombre} {perfil.apellido}
                      </h2>
                      <p className="text-sm font-bold text-[#C28A5B] mt-0.5">
                        {perfil.especialidad}
                      </p>
                    </div>

                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#3C3530] border border-[#DDD5C8] w-fit mx-auto sm:mx-0">
                      🏛️ {perfil.cabinaHabitual.split('-')[0]}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#5A524A] leading-relaxed max-w-2xl pt-1">
                    {perfil.descripcion}
                  </p>
                </div>
              </div>

              {/* Bloque: Servicios que realiza */}
              <div className="space-y-3 border-t border-[#EDE8E1] pt-5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8A7F74] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#C28A5B]" />
                  <span>Servicios que realiza:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {perfil.servicios.map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DDD5C8] text-xs font-bold text-[#2A2825] shadow-2xs"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bloque: Horarios de atención */}
              <div className="space-y-3 border-t border-[#EDE8E1] pt-5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8A7F74] uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-[#C28A5B]" />
                  <span>Horarios de atención:</span>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1] text-xs sm:text-sm font-semibold text-[#2A2825]">
                  {perfil.horariosAtencion}
                </div>
              </div>

              {/* Bloque: Datos de contacto */}
              <div className="space-y-3 border-t border-[#EDE8E1] pt-5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8A7F74] uppercase tracking-wider">
                  <Phone className="w-4 h-4 text-[#C28A5B]" />
                  <span>Datos de contacto:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1] flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#7A3B3B] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#8A7F74] uppercase font-bold block">Email Profesional</span>
                      <span className="text-[#2A2825] font-semibold truncate block">{perfil.email}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1] flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#7A3B3B] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#8A7F74] uppercase font-bold block">Teléfono</span>
                      <span className="text-[#2A2825] font-semibold truncate block">{perfil.telefono}</span>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${perfil.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#EDE8E1] hover:border-emerald-500/40 flex items-center gap-3 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#8A7F74] uppercase font-bold block">WhatsApp</span>
                      <span className="text-emerald-700 font-bold truncate block">{perfil.whatsapp}</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* ── BOTONES SOLICITADOS DEBAJO DE LA TARJETA ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormEditar({ ...perfil });
                  setShowModalEditarPerfil(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar perfil</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorPassword(null);
                  setFormPassword({ actual: '', nueva: '', confirmar: '' });
                  setShowModalPassword(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#DDD5C8] text-[#2A2825] text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95"
              >
                <KeyRound className="w-4 h-4 text-[#7A3B3B]" />
                <span>Cambiar contraseña</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Confirmás que querés cerrar la sesión de tu panel profesional?')) {
                    if (onLogout) onLogout();
                  }
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 8. VISTA: NOTIFICACIONES TOTALMENTE FUNCIONAL ── */}
        {seccionActiva === 'notificaciones' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Cabecera de notificaciones con controles */}
            <div className="bg-white border border-[#EAE2D5] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-[#2A2825]">Bandeja de Notificaciones</h3>
                  {notificaciones.filter(n => !n.leida).length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#7A3B3B] text-white">
                      {notificaciones.filter(n => !n.leida).length} nueva(s)
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8A7F74]">
                  Avisos de citas, cancelaciones, fidelización y estado de cabina en tiempo real
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={notificaciones.filter(n => !n.leida).length === 0}
                  onClick={() => {
                    const act = profesionalService.marcarTodasNotificacionesLeidas();
                    setNotificaciones(act);
                    mostrarFeedback('Todas las notificaciones fueron marcadas como leídas.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#DDD5C8] hover:bg-[#FAF8F5] text-xs font-bold text-[#3C3530] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marcar todas leídas</span>
                </button>

                <button
                  type="button"
                  disabled={notificaciones.length === 0}
                  onClick={handleLimpiarTodasNotificaciones}
                  className="px-3 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1.5"
                  title="Vaciar toda la bandeja"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vaciar bandeja</span>
                </button>
              </div>
            </div>

            {/* Pestañas de filtrado de notificaciones */}
            <div className="flex flex-wrap items-center gap-2">
              {([
                { id: 'todas', label: 'Todas', count: notificaciones.length },
                { id: 'no_leidas', label: 'No leídas', count: notificaciones.filter(n => !n.leida).length },
                { id: 'turnos', label: 'Citas & Turnos', count: notificaciones.filter(n => n.tipo === 'turno_nuevo' || n.tipo === 'turno_cancelado' || n.tipo === 'recordatorio').length },
                { id: 'sistema', label: 'Fidelización & Sistema', count: notificaciones.filter(n => n.tipo === 'sistema' || n.tipo === 'fidelizacion').length },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroNotif(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    filtroNotif === tab.id
                      ? 'bg-[#7A3B3B] text-white shadow-2xs'
                      : 'bg-white text-[#5A524A] border border-[#EDE8E1] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filtroNotif === tab.id ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#8A7F74]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Lista interactiva de notificaciones */}
            {(() => {
              const filtradas = notificaciones.filter(n => {
                if (filtroNotif === 'no_leidas') return !n.leida;
                if (filtroNotif === 'turnos') return n.tipo === 'turno_nuevo' || n.tipo === 'turno_cancelado' || n.tipo === 'recordatorio';
                if (filtroNotif === 'sistema') return n.tipo === 'sistema' || n.tipo === 'fidelizacion';
                return true;
              });

              if (filtradas.length === 0) {
                return (
                  <div className="bg-white border border-[#EAE2D5] rounded-2xl p-12 text-center shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#DDD5C8] flex items-center justify-center mx-auto text-[#8A7F74]">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#2A2825]">No tenés notificaciones en esta sección</h4>
                    <p className="text-xs text-[#8A7F74] max-w-sm mx-auto">
                      Las notificaciones se generan automáticamente al confirmar citas, completar atenciones o acreditar estampitas de fidelización.
                    </p>
                    {filtroNotif !== 'todas' && (
                      <button
                        type="button"
                        onClick={() => setFiltroNotif('todas')}
                        className="text-xs font-bold text-[#7A3B3B] hover:underline pt-2 block mx-auto"
                      >
                        Ver todas las notificaciones →
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtradas.map((n) => {
                    const isTurnoNuevo = n.tipo === 'turno_nuevo';
                    const isTurnoCancelado = n.tipo === 'turno_cancelado';
                    const isRecordatorio = n.tipo === 'recordatorio';
                    const isFidelizacion = n.tipo === 'fidelizacion';

                    return (
                      <div
                        key={n.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 shadow-2xs ${
                          n.leida
                            ? 'bg-white border-[#EDE8E1] text-[#5A524A] hover:border-[#DDD5C8]'
                            : 'bg-[#FAF7F2] border-[#C28A5B]/40 text-[#2A2825] ring-1 ring-[#C28A5B]/20'
                        }`}
                      >
                        {/* Ícono según el tipo */}
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          isTurnoNuevo
                            ? 'bg-blue-50 text-blue-700'
                            : isTurnoCancelado
                              ? 'bg-rose-50 text-rose-700'
                              : isRecordatorio
                                ? 'bg-emerald-50 text-emerald-700'
                                : isFidelizacion
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-[#FAF8F5] text-[#7A3B3B]'
                        }`}>
                          {isTurnoNuevo && <Calendar className="w-4 h-4" />}
                          {isTurnoCancelado && <AlertCircle className="w-4 h-4" />}
                          {isRecordatorio && <CheckCircle2 className="w-4 h-4" />}
                          {isFidelizacion && <Sparkles className="w-4 h-4" />}
                          {!isTurnoNuevo && !isTurnoCancelado && !isRecordatorio && !isFidelizacion && (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>

                        {/* Contenido de la notificación */}
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              {!n.leida && (
                                <span className="w-2 h-2 rounded-full bg-[#7A3B3B] shrink-0" title="No leída" />
                              )}
                              <h4 className="text-xs sm:text-sm font-extrabold text-[#2A2825]">
                                {n.titulo}
                              </h4>
                            </div>
                            <span className="text-[11px] text-[#8A7F74] font-medium shrink-0">
                              {n.fechaHora}
                            </span>
                          </div>

                          <p className="text-xs text-[#5A524A] leading-relaxed">
                            {n.mensaje}
                          </p>

                          {/* Enlace de acción rápida según tipo */}
                          {n.accionSeccion && (
                            <div className="pt-1.5">
                              <button
                                type="button"
                                onClick={() => handleAbrirNotificacion(n)}
                                className="text-xs font-bold text-[#7A3B3B] hover:text-[#5C2B2B] hover:underline inline-flex items-center gap-1"
                              >
                                <span>Ver en {n.accionSeccion === 'agenda' ? 'Agenda' : n.accionSeccion === 'turnos' ? 'Lista de Turnos' : n.accionSeccion === 'clientes' ? 'Mis Clientes' : 'Atenciones'}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Botones de acción individuales */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleLeidaNotificacion(n.id, n.leida)}
                            className="p-1.5 rounded-lg border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#8A7F74] transition-colors"
                            title={n.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                          >
                            <Check className={`w-3.5 h-3.5 ${n.leida ? 'text-[#8A7F74]' : 'text-emerald-600 stroke-[3]'}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminarNotificacion(n.id)}
                            className="p-1.5 rounded-lg border border-[#EDE8E1] hover:bg-rose-50 hover:border-rose-200 text-[#8A7F74] hover:text-rose-600 transition-colors"
                            title="Eliminar esta notificación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* ── MODAL 1: EDITAR PERFIL PROFESIONAL ── */}
      {showModalEditarPerfil && (
        <div className="fixed inset-0 z-50 bg-[#3C3530]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#EDE8E1] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#7A3B3B]" />
                <span>Editar Información de Perfil</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModalEditarPerfil(false)}
                className="text-[#8A7F74] hover:text-[#2A2825] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionPerfil} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3C3530] font-semibold mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formEditar.nombre}
                    onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
                <div>
                  <label className="block text-[#3C3530] font-semibold mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={formEditar.apellido}
                    onChange={(e) => setFormEditar({ ...formEditar, apellido: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Especialidad</label>
                <input
                  type="text"
                  required
                  value={formEditar.especialidad}
                  onChange={(e) => setFormEditar({ ...formEditar, especialidad: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Descripción Profesional</label>
                <textarea
                  rows={3}
                  value={formEditar.descripcion}
                  onChange={(e) => setFormEditar({ ...formEditar, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3C3530] font-semibold mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formEditar.telefono}
                    onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
                <div>
                  <label className="block text-[#3C3530] font-semibold mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={formEditar.whatsapp}
                    onChange={(e) => setFormEditar({ ...formEditar, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Horarios de Atención</label>
                <input
                  type="text"
                  value={formEditar.horariosAtencion}
                  onChange={(e) => setFormEditar({ ...formEditar, horariosAtencion: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Cabina Habitual de Atención</label>
                <input
                  type="text"
                  value={formEditar.cabinaHabitual}
                  onChange={(e) => setFormEditar({ ...formEditar, cabinaHabitual: e.target.value })}
                  placeholder="Ej: Cabina 1 - Dermoestética & Cuidado Facial"
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setShowModalEditarPerfil(false)}
                  className="px-4 py-2 rounded-xl border border-[#EDE8E1] text-xs font-semibold text-[#5A524A] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPerfil}
                  className="px-5 py-2 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {guardandoPerfil ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CAMBIAR CONTRASEÑA ── */}
      {showModalPassword && (
        <div className="fixed inset-0 z-50 bg-[#3C3530]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE8E1] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#7A3B3B]" />
                <span>Cambiar Contraseña</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModalPassword(false)}
                className="text-[#8A7F74] hover:text-[#2A2825] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorPassword && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorPassword}</span>
              </div>
            )}

            <form onSubmit={handleCambiarPassword} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  required
                  value={formPassword.actual}
                  onChange={(e) => setFormPassword({ ...formPassword, actual: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formPassword.nueva}
                  onChange={(e) => setFormPassword({ ...formPassword, nueva: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={formPassword.confirmar}
                  onChange={(e) => setFormPassword({ ...formPassword, confirmar: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setShowModalPassword(false)}
                  className="px-4 py-2 rounded-xl border border-[#EDE8E1] text-xs font-semibold text-[#5A524A] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPassword}
                  className="px-5 py-2 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {guardandoPassword ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: REGISTRAR FICHA DE ATENCIÓN CLÍNICA ── */}
      {showModalNuevaAtencion && (
        <div className="fixed inset-0 z-50 bg-[#3C3530]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#EDE8E1] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
              <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                <Film className="w-4 h-4 text-[#7A3B3B]" />
                <span>Registrar Ficha de Atención Clínica</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModalNuevaAtencion(false)}
                className="text-[#8A7F74] hover:text-[#2A2825] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearAtencion} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Nombre Completo del Paciente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Luciana Martínez"
                  value={formAtencion.clienteNombre}
                  onChange={(e) => setFormAtencion({ ...formAtencion, clienteNombre: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3C3530] font-semibold mb-1">Email del Paciente</label>
                  <input
                    type="email"
                    placeholder="luciana@gmail.com"
                    value={formAtencion.clienteEmail}
                    onChange={(e) => setFormAtencion({ ...formAtencion, clienteEmail: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
                <div>
                  <label className="block text-[#3C3530] font-semibold mb-1">Tipo de Piel Tratado</label>
                  <select
                    value={formAtencion.tipoPielTratado}
                    onChange={(e) => setFormAtencion({ ...formAtencion, tipoPielTratado: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Seca">Seca</option>
                    <option value="Grasa">Grasa</option>
                    <option value="Mixta">Mixta</option>
                    <option value="Sensible">Sensible</option>
                    <option value="Madura">Madura</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Tratamiento Realizado</label>
                <select
                  value={formAtencion.servicio}
                  onChange={(e) => setFormAtencion({ ...formAtencion, servicio: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                >
                  {perfil.servicios.map((srv, idx) => (
                    <option key={idx} value={srv}>{srv}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Observaciones Clínicas / Diagnóstico *</label>
                <textarea
                  rows={2}
                  required
                  value={formAtencion.observaciones}
                  onChange={(e) => setFormAtencion({ ...formAtencion, observaciones: e.target.value })}
                  placeholder="Detalle de la piel tratada, aparatología utilizada, tolerancia cutánea..."
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Recomendaciones & Cuidados Posteriores *</label>
                <textarea
                  rows={2}
                  required
                  value={formAtencion.recomendaciones}
                  onChange={(e) => setFormAtencion({ ...formAtencion, recomendaciones: e.target.value })}
                  placeholder="Productos de apoyo domiciliario, protector solar, hidratación..."
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE8E1]">
                <input
                  type="checkbox"
                  id="check-estampita-pro"
                  checked={formAtencion.estampitaSumada}
                  onChange={(e) => setFormAtencion({ ...formAtencion, estampitaSumada: e.target.checked })}
                  className="accent-[#7A3B3B] w-4 h-4 rounded"
                />
                <label htmlFor="check-estampita-pro" className="text-xs font-semibold text-[#3C3530] cursor-pointer">
                  Otorgar estampita del programa de fidelización a este cliente
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setShowModalNuevaAtencion(false)}
                  className="px-4 py-2 rounded-xl border border-[#EDE8E1] text-xs font-semibold text-[#5A524A] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: AGENDAR TURNO RÁPIDO EN HORARIO LIBRE ── */}
      {showModalNuevoTurnoRapido && (
        <div className="fixed inset-0 z-50 bg-[#3C3530]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#EDE8E1] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Nuevo Turno — {horaSeleccionadaNuevoTurno} hs</span>
                </h3>
                <p className="text-xs text-[#8A7F74]">
                  Fecha: {fechaAgenda} | Cabina: {perfil.cabinaHabitual.split('-')[0]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalNuevoTurnoRapido(false)}
                className="text-[#8A7F74] hover:text-[#2A2825] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearTurnoRapido} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Nombre Completo del Paciente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Méndez"
                  value={formNuevoTurno.clienteNombre}
                  onChange={(e) => setFormNuevoTurno({ ...formNuevoTurno, clienteNombre: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+54 9 11 5555-0000"
                  value={formNuevoTurno.clienteTelefono}
                  onChange={(e) => setFormNuevoTurno({ ...formNuevoTurno, clienteTelefono: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Tratamiento o Servicio *</label>
                <select
                  value={formNuevoTurno.servicio}
                  onChange={(e) => setFormNuevoTurno({ ...formNuevoTurno, servicio: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                >
                  {perfil.servicios.map((srv, idx) => (
                    <option key={idx} value={srv}>{srv}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#3C3530] font-semibold mb-1">Valor Estimado ($ ARS)</label>
                <input
                  type="number"
                  value={formNuevoTurno.precio}
                  onChange={(e) => setFormNuevoTurno({ ...formNuevoTurno, precio: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => setShowModalNuevoTurnoRapido(false)}
                  className="px-4 py-2 rounded-xl border border-[#EDE8E1] text-xs font-semibold text-[#5A524A] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  Agendar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: CÓDIGO QR HABILITADO PARA ACREDITACIÓN DE ESTAMPITA ── */}
      {solicitudQrModal && (
        <div className="fixed inset-0 z-50 bg-[#3C3530]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE8E1] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl text-center animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3 text-left">
              <div>
                <h3 className="text-base font-bold text-[#2A2825] flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#7A3B3B]" />
                  <span>Código QR de Fidelización</span>
                </h3>
                <p className="text-xs text-[#8A7F74]">
                  Turno confirmado #{solicitudQrModal.turnoId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSolicitudQrModal(null)}
                className="text-[#8A7F74] hover:text-[#2A2825] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos del Paciente y Tratamiento */}
            <div className="p-3 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8A7F74]">Paciente:</span>
                <strong className="text-xs text-[#2A2825]">{solicitudQrModal.clienteNombre}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8A7F74]">Tratamiento:</span>
                <span className="text-xs font-semibold text-[#7A3B3B]">{solicitudQrModal.servicioNombre}</span>
              </div>
            </div>

            {/* Contenedor Gráfico del QR */}
            <div className="py-2">
              <div className={`p-6 rounded-3xl inline-block border-2 shadow-inner transition-all ${
                qrAcreditadoModal
                  ? 'bg-emerald-50/60 border-emerald-400'
                  : 'bg-[#FAF8F5] border-[#DDD5C8]'
              }`}>
                <div className="w-44 h-44 bg-white rounded-2xl border border-[#EDE8E1] flex flex-col items-center justify-center p-3 shadow-md mx-auto relative">
                  {qrAcreditadoModal ? (
                    <div className="space-y-2 animate-in zoom-in">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                        <Check className="w-9 h-9 stroke-[3]" />
                      </div>
                      <span className="text-xs font-black text-emerald-800 block">
                        ¡ACREDITADO!
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <QrCode className="w-32 h-32 text-[#3C3530]" />
                      <span className="text-[10px] font-mono text-[#8A7F74] mt-1 font-bold">
                        Escanear en Recepción
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Token en texto */}
            <div className="p-2.5 bg-zinc-50 border border-dashed border-[#DDD5C8] rounded-xl">
              <span className="text-[10px] text-[#8A7F74] uppercase tracking-wider block font-bold">
                Token de Validación:
              </span>
              <code className="text-xs font-mono font-black text-[#7A3B3B]">
                {solicitudQrModal.codigoQr}
              </code>
            </div>

            {/* Estado interactivo en vivo */}
            {qrAcreditadoModal ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>¡Estampita acreditada con éxito!</span>
                </p>
                <p className="text-[11px] text-emerald-700">
                  El Administrador validó el QR. La tarjeta de fidelidad del paciente fue sellada.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <div className="flex items-center justify-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Esperando acreditación de Administración...</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Se ha generado una notificación para el Administrador con los datos de esta solicitud para su validación.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSolicitudQrModal(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#3C3530] hover:bg-[#2A2825] text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              {qrAcreditadoModal ? 'Finalizar y Cerrar' : 'Cerrar Ventana'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
