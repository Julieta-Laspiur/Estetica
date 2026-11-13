import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    Check,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    AlertTriangle,
    CreditCard,
    Banknote,
    Printer,
    Hourglass,
    FileText,
    CheckCircle2,
    XCircle,
    Info,
    RotateCcw,
    ExternalLink,
    Layers,
    DoorOpen,
    Building2,
    Copy,
    MessageSquare,
    X
} from 'lucide-react';
import { serviciosApi, turnosApi, pagosApi, usuariosApi, type AuthUser } from '../../../services/api';
import { configuracionService } from '../../../services/configuracionService';

interface Servicio {
    id: string;
    nombre: string;
    duracion: number;
    precio: number;
    categoria: string;
    requiereCabinaEspecifica?: boolean;
    cabinaEspecificaId?: number;
    cabinaEspecificaNombre?: string;
    profesionalesHabilitadosIds?: number[];
}

interface Profesional {
    id: string;
    nombre: string;
    especialidad: string;
}

interface ReservarTurnoProps {
    initialServicioId?: string | number | null;
    currentUser?: AuthUser | null;
    onNavigate?: (section: string) => void;
}

interface ReservaCompletadaData {
    turnoId: number | string;
    servicio: Servicio;
    profesional: Profesional;
    fecha: string;
    hora: string;
    metodoPago: 'mercadopago' | 'efectivo' | 'transferencia';
    medioDetalle: string;
    total: number;
    codigoOperacion?: string;
    fechaRegistro: string;
    initPointUrl?: string;
}

export function ReservarTurno({ initialServicioId, currentUser, onNavigate }: ReservarTurnoProps = {}) {
    const [activeTab, setActiveTab] = useState<'nueva_reserva' | 'mis_turnos'>('nueva_reserva');
    const [step, setStep] = useState(initialServicioId ? 2 : 1);
    const [selectedServicio, setSelectedServicio] = useState<string | null>(initialServicioId ? initialServicioId.toString() : null);
    const [selectedProfesional, setSelectedProfesional] = useState<string | null>(null);
    const [selectedFecha, setSelectedFecha] = useState<string>('');
    const [selectedHora, setSelectedHora] = useState<string | null>(null);
    const [metodoPago, setMetodoPago] = useState<'mercadopago' | 'efectivo' | 'transferencia'>('mercadopago');
    const [aceptaPolitica24h, setAceptaPolitica24h] = useState(false);
    const [copiadoCbu, setCopiadoCbu] = useState(false);
    const [copiadoAlias, setCopiadoAlias] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reservaExitosa, setReservaExitosa] = useState<ReservaCompletadaData | null>(null);
    const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
    const [siteConfig] = useState(() => configuracionService.get());

    // Lista de turnos del cliente
    const [misTurnos, setMisTurnos] = useState<any[]>([]);
    const [loadingMisTurnos, setLoadingMisTurnos] = useState(false);

    // Modal de reprogramación autónoma del cliente (HU-04 / RN-02)
    const [turnoParaReprogramar, setTurnoParaReprogramar] = useState<any | null>(null);
    const [reprogramarFecha, setReprogramarFecha] = useState('');
    const [reprogramarHora, setReprogramarHora] = useState('11:00');
    const [reprogramando, setReprogramando] = useState(false);
    const [errorReprogramar, setErrorReprogramar] = useState<string | null>(null);

    useEffect(() => {
        if (initialServicioId) {
            setSelectedServicio(initialServicioId.toString());
            setStep(2);
        }
    }, [initialServicioId]);

    const [servicios, setServicios] = useState<Servicio[]>([
        { id: '1', nombre: 'Limpieza Facial Profunda', duracion: 60, precio: 4500, categoria: 'Facial', profesionalesHabilitadosIds: [1] },
        { id: '2', nombre: 'Masaje Relajante & Descontracturante', duracion: 50, precio: 5200, categoria: 'Masajes', profesionalesHabilitadosIds: [2] },
        { id: '3', nombre: 'Drenaje Linfático Manual', duracion: 45, precio: 4800, categoria: 'Corporal', profesionalesHabilitadosIds: [2, 3] },
        { id: '4', nombre: 'Radiofrecuencia Facial Tensora', duracion: 45, precio: 6500, categoria: 'Facial', profesionalesHabilitadosIds: [1, 3] },
        { id: '5', nombre: 'Peeling Químico Renovador', duracion: 40, precio: 5800, categoria: 'Facial', profesionalesHabilitadosIds: [1] },
        { id: '6', nombre: 'Lifting de Pestañas & Perfilado', duracion: 45, precio: 3900, categoria: 'Pestañas/Cejas', profesionalesHabilitadosIds: [1, 2] },
    ]);

    const [profesionales, setProfesionales] = useState<Profesional[]>([
        { id: '1', nombre: 'Dra. Camila Rossi', especialidad: 'Dermatocosmiatría y Estética Facial' },
        { id: '2', nombre: 'Lic. Sofía Vega', especialidad: 'Masoterapia y Drenaje Linfático' },
        { id: '3', nombre: 'Téc. Lucía Méndez', especialidad: 'Aparatología y Radiofrecuencia' },
    ]);

    // Cargar Servicios y Profesionales dinámicos
    useEffect(() => {
        // Cargar Servicios
        serviciosApi.getActivos()
            .then(apiServs => {
                if (apiServs && apiServs.length > 0) {
                    const metaGuardada = JSON.parse(localStorage.getItem('estetica_servicios_meta') || '{}');
                    const mapped: Servicio[] = apiServs.map(s => {
                        const meta = metaGuardada[String(s.servicioId)] || {};
                        let cat = meta.categoria || s.categoria;
                        if (!cat) {
                            const nLower = s.nombre.toLowerCase();
                            if (nLower.includes('masaje') || nLower.includes('descontracturante')) cat = 'Masajes';
                            else if (nLower.includes('corporal') || nLower.includes('drenaje')) cat = 'Corporal';
                            else if (nLower.includes('pestaña') || nLower.includes('ceja')) cat = 'Pestañas/Cejas';
                            else cat = 'Facial';
                        }
                        return {
                            id: s.servicioId.toString(),
                            nombre: s.nombre,
                            duracion: s.duracionMin,
                            precio: s.precio,
                            categoria: cat,
                            requiereCabinaEspecifica: meta.requiereCabinaEspecifica ?? s.requiereCabinaEspecifica,
                            cabinaEspecificaId: meta.cabinaEspecificaId || s.cabinaEspecificaId,
                            cabinaEspecificaNombre: meta.cabinaEspecificaNombre || s.cabinaEspecificaNombre,
                            profesionalesHabilitadosIds: meta.profesionalesHabilitadosIds || s.profesionalesHabilitadosIds,
                        };
                    });
                    setServicios(mapped);
                }
            })
            .catch(() => {});

        // Cargar Profesionales
        usuariosApi.getProfesionalesList()
            .then(profs => {
                if (profs && profs.length > 0) {
                    setProfesionales(profs.filter(p => p.activo).map(p => ({
                        id: p.profesionalId.toString(),
                        nombre: p.nombreCompleto,
                        especialidad: p.especialidad,
                    })));
                }
            })
            .catch(() => {});
    }, []);

    const horariosDisponibles = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    // Cargar Mis Turnos exclusivamente para el cliente autenticado
    const cargarMisTurnos = async () => {
        if (!currentUser) {
            setMisTurnos([]);
            setLoadingMisTurnos(false);
            return;
        }

        setLoadingMisTurnos(true);

        const obtenerTurnosLocalesDelCliente = (): any[] => {
            try {
                const turnosLocales = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
                if (!Array.isArray(turnosLocales)) return [];
                return turnosLocales.filter(t => {
                    if (currentUser.usuarioId && t.usuarioId && Number(t.usuarioId) === Number(currentUser.usuarioId)) {
                        return true;
                    }
                    if (currentUser.email && t.clienteEmail && t.clienteEmail.toLowerCase() === currentUser.email.toLowerCase().trim()) {
                        return true;
                    }
                    return false;
                });
            } catch {
                return [];
            }
        };

        try {
            let turnosApiData: any[] = [];
            // Si el cliente tiene un ID en la base de datos, consultar únicamente sus citas
            if (currentUser.usuarioId && currentUser.usuarioId > 0) {
                try {
                    turnosApiData = await turnosApi.getPorUsuario(currentUser.usuarioId);
                } catch (errApi) {
                    console.warn('API de turnos offline o inaccesible, recurriendo a almacenamiento del cliente:', errApi);
                    turnosApiData = [];
                }
            }

            const turnosLocalesCliente = obtenerTurnosLocalesDelCliente();

            // Combinar turnos sin duplicados
            const idsVistos = new Set<string>();
            const combinados: any[] = [];

            if (Array.isArray(turnosApiData)) {
                turnosApiData.forEach(t => {
                    const key = String(t.turnoId);
                    if (!idsVistos.has(key)) {
                        idsVistos.add(key);
                        combinados.push(t);
                    }
                });
            }

            turnosLocalesCliente.forEach(t => {
                const key = String(t.turnoId);
                if (!idsVistos.has(key)) {
                    idsVistos.add(key);
                    combinados.push(t);
                }
            });

            // Enriquecer con métodos de pago almacenados localmente
            const pagosGuardados = JSON.parse(localStorage.getItem('estetica_turnos_pagos') || '{}');
            const enriquecidos = combinados.map(t => ({
                ...t,
                metodoPagoGuardado: t.metodoPagoGuardado || pagosGuardados[String(t.turnoId)]?.metodo || (t.metodoPago || 'efectivo'),
                detallePagoGuardado: t.detallePagoGuardado || pagosGuardados[String(t.turnoId)]?.detalle || '',
            }));

            setMisTurnos(enriquecidos);
        } catch {
            // En caso de contingencia total, mostrar únicamente los turnos locales del cliente
            setMisTurnos(obtenerTurnosLocalesDelCliente());
        } finally {
            setLoadingMisTurnos(false);
        }
    };

    useEffect(() => {
        cargarMisTurnos();
    }, [currentUser]);

    const guardarTurnoLocal = (nuevoTurno: ReservaCompletadaData) => {
        try {
            // Guardar mapping de pago para el Admin y el Cliente
            const pagosData = JSON.parse(localStorage.getItem('estetica_turnos_pagos') || '{}');
            pagosData[String(nuevoTurno.turnoId)] = {
                metodo: nuevoTurno.metodoPago,
                detalle: nuevoTurno.medioDetalle,
                fecha: nuevoTurno.fechaRegistro,
                total: nuevoTurno.total,
                codigoOperacion: nuevoTurno.codigoOperacion,
            };
            localStorage.setItem('estetica_turnos_pagos', JSON.stringify(pagosData));

            // Guardar en historial asignando explícitamente el usuario actual
            const listado = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
            const clienteNom = currentUser
                ? `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim() || 'Cliente Registrado'
                : 'Cliente Web';

            const turnoFormateado = {
                turnoId: nuevoTurno.turnoId,
                usuarioId: currentUser?.usuarioId || null,
                clienteEmail: currentUser?.email?.toLowerCase().trim() || null,
                clienteNombreCompleto: clienteNom,
                profesionalId: Number(nuevoTurno.profesional.id) || 1,
                profesionalNombreCompleto: nuevoTurno.profesional.nombre,
                cabinaId: nuevoTurno.servicio.requiereCabinaEspecifica && nuevoTurno.servicio.cabinaEspecificaId ? nuevoTurno.servicio.cabinaEspecificaId : 1,
                cabinaNombre: nuevoTurno.servicio.cabinaEspecificaNombre || 'Cabina Principal 01',
                fechaHoraInicio: `${nuevoTurno.fecha}T${nuevoTurno.hora}:00`,
                fechaRegistro: nuevoTurno.fechaRegistro || new Date().toISOString(),
                fechaCreacion: nuevoTurno.fechaRegistro || new Date().toISOString(),
                estado: 'Pendiente', // Pendiente de confirmación del admin
                total: nuevoTurno.total,
                servicios: [{
                    servicioId: parseInt(nuevoTurno.servicio.id),
                    nombre: nuevoTurno.servicio.nombre,
                    duracionMin: nuevoTurno.servicio.duracion,
                    precio: nuevoTurno.servicio.precio
                }],
                metodoPago: nuevoTurno.metodoPago,
                metodoPagoGuardado: nuevoTurno.metodoPago,
                detallePagoGuardado: nuevoTurno.medioDetalle,
                codigoOperacion: nuevoTurno.codigoOperacion,
                initPointUrl: nuevoTurno.initPointUrl,
            };
            listado.unshift(turnoFormateado);
            localStorage.setItem('estetica_reservas_cliente', JSON.stringify(listado));

            // Notificar a los paneles administrativos (Caja, Turnos, Calendario, Dashboard)
            try {
                window.dispatchEvent(new CustomEvent('estetica_turno_creado', { detail: turnoFormateado }));
            } catch {}
        } catch (e) {
            console.error('Error al persistir turno local:', e);
        }
    };

    const handleCopiarTexto = async (texto: string, tipo: 'cbu' | 'alias') => {
        try {
            await navigator.clipboard.writeText(texto);
            if (tipo === 'cbu') {
                setCopiadoCbu(true);
                setTimeout(() => setCopiadoCbu(false), 2000);
            } else {
                setCopiadoAlias(true);
                setTimeout(() => setCopiadoAlias(false), 2000);
            }
        } catch {}
    };

    // Confirmar y registrar reserva (Efectivo o Transferencia)
    const ejecutarRegistroReserva = async (metodo: 'efectivo' | 'transferencia') => {
        if (!currentUser) {
            alert('Por favor iniciá sesión con tu cuenta para poder reservar un turno.');
            if (onNavigate) onNavigate('login');
            return;
        }

        const servicio = servicios.find(s => s.id === selectedServicio);
        const profesional = profesionales.find(p => p.id === selectedProfesional);

        if (!servicio || !profesional || !selectedFecha || !selectedHora) {
            alert('Por favor completá todos los pasos antes de confirmar la reserva.');
            return;
        }

        setIsSubmitting(true);
        let turnoIdGenerado: number | string = Math.floor(1000 + Math.random() * 9000);

        try {
            const fechaHoraInicio = `${selectedFecha}T${selectedHora}:00Z`;
            const payload: any = {
                profesionalId: parseInt(profesional.id),
                cabinaId: servicio.requiereCabinaEspecifica && servicio.cabinaEspecificaId ? servicio.cabinaEspecificaId : 1,
                fechaHoraInicio,
                serviciosIds: [parseInt(servicio.id)],
            };
            if (currentUser?.usuarioId) {
                payload.usuarioId = currentUser.usuarioId;
            }

            const res = await turnosApi.reservar(payload);
            if (res && res.turnoId) {
                turnoIdGenerado = res.turnoId;
            }
        } catch {
            // En caso de que el backend no tenga sesión activa, se usa el ID local
        } finally {
            setIsSubmitting(false);

            const detalleMedio = metodo === 'transferencia'
                ? 'Transferencia Bancaria (Pendiente de Comprobante)'
                : 'Pago en Recepción en Mostrador';

            const codigoTransaccion = metodo === 'transferencia'
                ? `TRF-${Math.floor(100000000 + Math.random() * 900000000)}`
                : `EF-${Math.floor(100000000 + Math.random() * 900000000)}`;

            const dataExito: ReservaCompletadaData = {
                turnoId: turnoIdGenerado,
                servicio,
                profesional,
                fecha: selectedFecha,
                hora: selectedHora,
                metodoPago: metodo,
                medioDetalle: detalleMedio,
                total: servicio.precio,
                codigoOperacion: codigoTransaccion,
                fechaRegistro: new Date().toISOString(),
            };

            guardarTurnoLocal(dataExito);
            setReservaExitosa(dataExito);
            cargarMisTurnos();
            setStep(5); // Pantalla de Comprobante / Voucher
        }
    };

    // Procesar reserva y Redirigir DIRECTAMENTE a la Aplicación / Checkout de Mercado Pago
    const handleConfirmarMercadoPagoDirecto = async () => {
        if (!currentUser) {
            alert('Por favor iniciá sesión con tu cuenta para poder reservar un turno.');
            if (onNavigate) onNavigate('login');
            return;
        }

        const servicio = servicios.find(s => s.id === selectedServicio);
        const profesional = profesionales.find(p => p.id === selectedProfesional);

        if (!servicio || !profesional || !selectedFecha || !selectedHora) {
            alert('Por favor completá todos los pasos antes de confirmar la reserva.');
            return;
        }

        setIsSubmitting(true);
        let turnoIdGenerado: number | string = Math.floor(1000 + Math.random() * 9000);
        let codigoOperacion = `MP-${Math.floor(100000000 + Math.random() * 900000000)}`;
        let initPointUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=PREF_${Date.now()}`;

        try {
            // 1. Reservar turno en backend
            const fechaHoraInicio = `${selectedFecha}T${selectedHora}:00Z`;
            const payload: any = {
                profesionalId: parseInt(profesional.id),
                cabinaId: servicio.requiereCabinaEspecifica && servicio.cabinaEspecificaId ? servicio.cabinaEspecificaId : 1,
                fechaHoraInicio,
                serviciosIds: [parseInt(servicio.id)],
            };
            if (currentUser?.usuarioId) {
                payload.usuarioId = currentUser.usuarioId;
            }

            try {
                const resTurno = await turnosApi.reservar(payload);
                if (resTurno && resTurno.turnoId) {
                    turnoIdGenerado = resTurno.turnoId;
                } else {
                    throw new Error('No se recibió el identificador del turno.');
                }
            } catch (errTurno: any) {
                console.error('Error al reservar turno en servidor:', errTurno);
                alert(errTurno?.message || 'No se pudo reservar el turno en el horario seleccionado. Por favor elegí otro horario.');
                setIsSubmitting(false);
                return;
            }

            // 2. Procesar preferencia con la API oficial de Mercado Pago
            try {
                const resPago = await pagosApi.procesar({
                    turnoId: typeof turnoIdGenerado === 'number' ? turnoIdGenerado : parseInt(String(turnoIdGenerado)),
                    proveedor: 0
                });
                if (resPago && resPago.initPointUrl) {
                    initPointUrl = resPago.initPointUrl;
                    if (resPago.referenciaExterna) {
                        codigoOperacion = resPago.referenciaExterna;
                    }
                } else {
                    throw new Error('No se recibió el enlace de pago de Mercado Pago.');
                }
            } catch (errPago: any) {
                console.error('Error al generar orden en Mercado Pago:', errPago);
                alert('No se pudo generar el checkout de Mercado Pago: ' + (errPago?.message || 'Error de pasarela'));
                setIsSubmitting(false);
                return;
            }

            const dataExito: ReservaCompletadaData = {
                turnoId: turnoIdGenerado,
                servicio,
                profesional,
                fecha: selectedFecha,
                hora: selectedHora,
                metodoPago: 'mercadopago',
                medioDetalle: 'Mercado Pago Checkout Oficial',
                total: servicio.precio,
                codigoOperacion,
                fechaRegistro: new Date().toISOString(),
                initPointUrl,
            };

            guardarTurnoLocal(dataExito);
            setReservaExitosa(dataExito);
            cargarMisTurnos();
            setStep(5); // Pantalla de Comprobante / Voucher

            // 3. Redirección efectiva a la aplicación / checkout de Mercado Pago
            const mpWindow = window.open(initPointUrl, '_blank');
            if (!mpWindow || mpWindow.closed || typeof mpWindow.closed === 'undefined') {
                window.location.href = initPointUrl;
            }
        } catch (e: any) {
            console.error('Error al procesar reserva con Mercado Pago:', e);
            alert('Ocurrió un error al procesar el pago: ' + (e?.message || 'Error de conexión'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Manejador del botón principal en Paso 4
    const handleProcederPago = () => {
        if (!aceptaPolitica24h) {
            alert('Debes confirmar que has leído y aceptas la política de no reembolso para cancelaciones pasadas las 24 horas.');
            return;
        }

        if (metodoPago === 'mercadopago') {
            handleConfirmarMercadoPagoDirecto();
        } else if (metodoPago === 'transferencia') {
            ejecutarRegistroReserva('transferencia');
        } else {
            ejecutarRegistroReserva('efectivo');
        }
    };

    const handleReiniciar = () => {
        setStep(1);
        setSelectedServicio(null);
        setSelectedProfesional(null);
        setSelectedFecha('');
        setSelectedHora(null);
        setMetodoPago('mercadopago');
        setAceptaPolitica24h(false);
        setReservaExitosa(null);
    };

    // Abrir modal de reprogramación validando anticipación de 24 horas (HU-04 / RN-02)
    const handleAbrirReprogramar = (turno: any) => {
        const fechaCita = new Date(turno.fechaHoraInicio);
        const ahora = new Date();
        const horasRestantes = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

        if (horasRestantes < 24) {
            alert(
                '⚠️ POLÍTICA DE MODIFICACIÓN Y REPROGRAMACIÓN (MENOS DE 24 HORAS):\n\n' +
                'No es posible cambiar o reprogramar este turno de forma digital porque faltan menos de 24 horas para la cita programada.\n\n' +
                'De acuerdo a los términos y condiciones del centro de estética, las modificaciones dentro de las 24 horas previas requieren coordinación directa con la administración.\n\n' +
                'Por favor comunicate telefónicamente o por WhatsApp con el centro de estética.'
            );
            return;
        }

        setTurnoParaReprogramar(turno);
        setErrorReprogramar(null);
        // Sugerir fecha mínima: mañana
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        setReprogramarFecha(manana.toISOString().split('T')[0]);
        setReprogramarHora('11:00');
    };

    // Confirmar nueva fecha y hora con la API de turnos
    const handleConfirmarReprogramar = async () => {
        if (!turnoParaReprogramar || !reprogramarFecha || !reprogramarHora) return;

        setReprogramando(true);
        setErrorReprogramar(null);
        const nuevaFechaHora = `${reprogramarFecha}T${reprogramarHora}:00Z`;

        try {
            await turnosApi.reprogramar(turnoParaReprogramar.turnoId, {
                nuevaFechaHoraInicio: nuevaFechaHora,
                motivo: 'Reprogramación solicitada autónomamente por el cliente'
            });
            alert(`✅ ¡Turno #${turnoParaReprogramar.turnoId} reprogramado exitosamente!\n\nNueva fecha: ${reprogramarFecha} a las ${reprogramarHora} hs.`);
            setTurnoParaReprogramar(null);
            cargarMisTurnos();
        } catch (err: any) {
            const msg = err?.message || 'Error al reprogramar el turno. Verificá la fecha y horario o contactá al centro.';
            setErrorReprogramar(msg);
        } finally {
            setReprogramando(false);
        }
    };

    // Cancelar turno del cliente con validación estricta de 24 horas
    const handleCancelarTurnoCliente = async (turno: any) => {
        const fechaCita = new Date(turno.fechaHoraInicio);
        const ahora = new Date();
        const horasRestantes = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

        if (horasRestantes < 24) {
            alert(
                '⚠️ POLÍTICA DE CANCELACIÓN (MENOS DE 24 HORAS):\n\n' +
                'No es posible cancelar este turno de forma digital porque faltan menos de 24 horas para la cita programada.\n\n' +
                'De acuerdo a los términos y condiciones del centro de estética, pasadas las 24 horas previas NO SE REALIZARÁ REEMBOLSO de la seña ni de los importes abonados.\n\n' +
                'Por favor comunicate telefónicamente con la administración.'
            );
            return;
        }

        const confirmacion = confirm(
            `¿Confirmás la cancelación del Turno #${turno.turnoId}?\n\nAl tener más de 24 horas de antelación, tu cancelación cumple con los términos y la administración gestionará tu caso.`
        );
        if (!confirmacion) return;

        try {
            await turnosApi.cancelar(turno.turnoId, 'Cancelación autónoma por el cliente');
            alert(`Turno #${turno.turnoId} cancelado exitosamente.`);
            cargarMisTurnos();
        } catch {
            // Fallback local
            const listado = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
            const actualizados = listado.map((t: any) =>
                t.turnoId === turno.turnoId ? { ...t, estado: 'Cancelado' } : t
            );
            localStorage.setItem('estetica_reservas_cliente', JSON.stringify(actualizados));
            setMisTurnos(actualizados);
            alert(`Turno #${turno.turnoId} cancelado en el sistema.`);
        }
    };

    const servicioSeleccionadoObj = servicios.find(s => s.id === selectedServicio);
    const profesionalSeleccionadoObj = profesionales.find(p => p.id === selectedProfesional);

    return (
        <div className="min-h-screen bg-[#F7F4F0] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header principal y navegación de pestañas */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE8E1] text-[#7A3B3B] mb-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Agenda Online & Pasarela de Pagos</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2825]">
                            Reserva de Turnos
                        </h1>
                        <p className="text-sm text-[#8A7F74] mt-1">
                            Elegí tu tratamiento, fecha y aboná con Mercado Pago o Efectivo con confirmación del Administrador.
                        </p>
                    </div>

                    {/* Switcher de pestañas */}
                    <div className="flex items-center bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#EDE8E1]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('nueva_reserva')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                activeTab === 'nueva_reserva'
                                    ? 'bg-[#7A3B3B] text-white shadow-xs'
                                    : 'text-[#5A524A] hover:text-[#2A2825]'
                            }`}
                        >
                            Agendar Cita
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('mis_turnos')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'mis_turnos'
                                    ? 'bg-[#7A3B3B] text-white shadow-xs'
                                    : 'text-[#5A524A] hover:text-[#2A2825]'
                            }`}
                        >
                            <span>Mis Turnos</span>
                            {misTurnos.length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    activeTab === 'mis_turnos' ? 'bg-white text-[#7A3B3B]' : 'bg-[#7A3B3B]/15 text-[#7A3B3B]'
                                }`}>
                                    {misTurnos.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* VISTA 1: TAB MIS TURNOS */}
                {activeTab === 'mis_turnos' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs space-y-6">
                        <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#2A2825]">Historial de Mis Turnos</h2>
                                <p className="text-xs text-[#8A7F74]">
                                    Controlá el estado de aprobación de tus citas y pagos
                                </p>
                            </div>
                            <button
                                onClick={cargarMisTurnos}
                                className="p-2 rounded-xl border border-[#EDE8E1] text-[#7A3B3B] hover:bg-[#FAF8F5] text-xs font-semibold flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Actualizar</span>
                            </button>
                        </div>

                        {loadingMisTurnos ? (
                            <div className="py-12 text-center text-[#8A7F74]">
                                <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
                                <p className="text-xs">Cargando tus citas agendadas...</p>
                            </div>
                        ) : !currentUser ? (
                            <div className="py-14 text-center space-y-3">
                                <Calendar className="w-12 h-12 text-[#DDD5C8] mx-auto" />
                                <h3 className="font-bold text-base text-[#2A2825]">Iniciá sesión para ver tus turnos</h3>
                                <p className="text-xs text-[#8A7F74] max-w-sm mx-auto">
                                    Para consultar tu historial de citas, comprobantes y estado de confirmación, iniciá sesión con tu cuenta.
                                </p>
                                {onNavigate && (
                                    <button
                                        onClick={() => onNavigate('auth')}
                                        className="mt-3 px-6 py-2.5 bg-[#3C3530] text-white rounded-xl text-xs font-bold hover:bg-[#2A2825] transition-colors shadow-xs"
                                    >
                                        Iniciar Sesión / Registrarse
                                    </button>
                                )}
                            </div>
                        ) : misTurnos.length === 0 ? (
                            <div className="py-14 text-center space-y-3">
                                <Calendar className="w-12 h-12 text-[#DDD5C8] mx-auto" />
                                <h3 className="font-bold text-base text-[#2A2825]">No tenés turnos agendados aún</h3>
                                <p className="text-xs text-[#8A7F74] max-w-sm mx-auto">
                                    Reservá tu primer tratamiento facial o corporal en línea y asegurá tu horario en cabina.
                                </p>
                                <button
                                    onClick={() => setActiveTab('nueva_reserva')}
                                    className="mt-3 px-6 py-2.5 bg-[#7A3B3B] text-white rounded-xl text-xs font-bold hover:bg-[#5C2B2B] transition-colors"
                                >
                                    Agendar un Turno Ahora
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {misTurnos.map((t) => {
                                    const dateObj = new Date(t.fechaHoraInicio);
                                    const fechaFormat = dateObj.toLocaleDateString('es-AR', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    });
                                    const horaFormat = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                                    const nombreServicio = t.servicios?.[0]?.nombre || 'Tratamiento Estético';

                                    const isPendiente = t.estado === 0 || t.estado === '0' || String(t.estado).toLowerCase().includes('pend');
                                    const isConfirmado = t.estado === 1 || t.estado === '1' || String(t.estado).toLowerCase().includes('conf');
                                    const isCancelado = t.estado === 4 || t.estado === '4' || String(t.estado).toLowerCase().includes('canc');

                                    return (
                                        <div
                                            key={t.turnoId}
                                            className="p-5 rounded-2xl border border-[#EDE8E1] bg-[#FAF8F5] hover:border-[#7A3B3B]/40 transition-all space-y-3"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EDE8E1] flex items-center justify-center text-[#7A3B3B] font-bold text-xs shadow-2xs">
                                                        #{t.turnoId}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-sm text-[#2A2825]">{nombreServicio}</h3>
                                                        <p className="text-xs text-[#8A7F74]">
                                                            Especialista: {t.profesionalNombreCompleto || 'Profesional asignado'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Badge de Estado del Turno */}
                                                <div>
                                                    {isPendiente && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                            <Hourglass className="w-3.5 h-3.5" />
                                                            <span>Pendiente de Confirmación del Admin</span>
                                                        </span>
                                                    )}
                                                    {isConfirmado && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Confirmado por Administración</span>
                                                        </span>
                                                    )}
                                                    {isCancelado && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span>Cancelado</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#EDE8E1] text-xs text-[#5A524A]">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                    <span className="capitalize">{fechaFormat} - {horaFormat} hs</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                    <span>
                                                        Pago: <strong>
                                                            {t.metodoPagoGuardado === 'mercadopago'
                                                                ? 'Mercado Pago (Online)'
                                                                : t.metodoPagoGuardado === 'transferencia'
                                                                ? 'Transferencia Bancaria'
                                                                : 'Efectivo en Recepción'}
                                                        </strong>
                                                    </span>
                                                </div>
                                                <div className="text-right sm:text-right font-bold text-[#2A2825]">
                                                    Monto: ${Number(t.total || 0).toLocaleString('es-AR')} ARS
                                                </div>
                                            </div>

                                            {/* Nota informativa y acciones de pago para turnos pendientes */}
                                            {isPendiente && (
                                                <div className="space-y-2.5">
                                                    <div className={`p-3.5 rounded-xl border text-[11px] flex items-start gap-2.5 ${
                                                        t.metodoPagoGuardado === 'transferencia'
                                                            ? 'bg-purple-50 border-purple-200 text-purple-950'
                                                            : 'bg-amber-50 border-amber-200 text-amber-900'
                                                    }`}>
                                                        <Info className={`w-4 h-4 shrink-0 mt-0.5 ${
                                                            t.metodoPagoGuardado === 'transferencia' ? 'text-purple-700' : 'text-amber-700'
                                                        }`} />
                                                        <div>
                                                            <p className="font-bold">
                                                                {t.metodoPagoGuardado === 'mercadopago'
                                                                    ? '🟡 Turno Pendiente de Pago (Mercado Pago)'
                                                                    : t.metodoPagoGuardado === 'transferencia'
                                                                    ? '🟣 Turno Pendiente de Validación de Comprobante'
                                                                    : '🟡 Turno Pendiente de Pago en Mostrador'}
                             </p>
                                                            <p className={`mt-0.5 leading-relaxed ${
                                                                t.metodoPagoGuardado === 'transferencia' ? 'text-purple-900' : 'text-amber-800'
                                                            }`}>
                                                                {t.metodoPagoGuardado === 'mercadopago'
                                                                    ? 'Si aún no completaste el pago o saliste de la aplicación de Mercado Pago, tu turno se encuentra reservado provisoriamente. Podés abonar con el botón a continuación. En cuanto Mercado Pago confirme la transacción mediante nuestro Webhook, el turno quedará formalmente Confirmado.'
                                                                    : t.metodoPagoGuardado === 'transferencia'
                                                                    ? 'Tu turno está reservado provisoriamente. Para confirmarlo, debés enviar el comprobante de transferencia al WhatsApp de la administración. Una vez verificada la acreditación, el Administrador confirmará tu turno formalmente desde su panel.'
                                                                    : 'El turno ha sido reservado para abono presencial en recepción. La administración confirmará tu cita al momento del cobro.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {t.metodoPagoGuardado === 'mercadopago' && (
                                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                                            {t.initPointUrl && (
                                                                <a
                                                                    href={t.initPointUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-3.5 py-1.5 rounded-xl bg-[#009EE3] hover:bg-[#0089C7] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all"
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                    <span>Completar Pago en Mercado Pago</span>
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={cargarMisTurnos}
                                                                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                                <span>Verificar si ya pagué</span>
                                                            </button>
                                                        </div>
                                                    )}

                                                    {t.metodoPagoGuardado === 'transferencia' && (
                                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                                            <a
                                                                href={`https://wa.me/${(siteConfig.transferenciaWhatsappComprobante || siteConfig.whatsapp || '+54 9 11 2345-6789').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola! Consulto por la validación de mi Turno #${t.turnoId} (${fechaFormat} - ${horaFormat} hs). Ya realicé la transferencia bancaria por $${Number(t.total || 0).toLocaleString('es-AR')} ARS y adjunto mi comprobante para que el Admin confirme el turno.`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                <span>Enviar Comprobante por WhatsApp</span>
                                                            </a>
                                                            <button
                                                                onClick={cargarMisTurnos}
                                                                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                                <span>Verificar Estado</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Acciones de cancelar o reprogramar con regla 24hs */}
                                            {!isCancelado && (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#EDE8E1]">
                                                    <span className="text-[10px] text-[#8A7F74]">
                                                        * Modificación o cancelación sin cargo hasta 24 hs antes de la cita.
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAbrirReprogramar(t)}
                                                            className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#7A3B3B]/40 hover:bg-[#7A3B3B] hover:text-white text-[#7A3B3B] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                                                            title="Elegir otra fecha y horario para este turno"
                                                        >
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>Cambiar Turno</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelarTurnoCliente(t)}
                                                            className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline px-2 py-1"
                                                        >
                                                            Cancelar Turno
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* MODAL PARA QUE EL CLIENTE CAMBIE SU TURNO (REPROGRAMACIÓN) */}
                        {turnoParaReprogramar && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
                                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EDE8E1] space-y-5 animate-in zoom-in-95">
                                    <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-[#FAF0F0] text-[#7A3B3B] flex items-center justify-center font-bold">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-[#2A2825]">Cambiar Fecha y Hora</h3>
                                                <p className="text-xs text-[#8A7F74]">Turno #{turnoParaReprogramar.turnoId}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setTurnoParaReprogramar(null)}
                                            className="p-1.5 rounded-lg text-[#8A7F74] hover:text-[#2A2825] hover:bg-[#FAF8F5]"
                                            aria-label="Cerrar modal"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EDE8E1] text-xs space-y-1">
                                        <p className="text-[#8A7F74]">Tratamiento:</p>
                                        <p className="font-bold text-[#2A2825]">
                                            {turnoParaReprogramar.servicios?.[0]?.nombre || 'Tratamiento Estético'}
                                        </p>
                                        <p className="text-[#8A7F74] pt-1">Especialista actual:</p>
                                        <p className="font-semibold text-[#5A524A]">
                                            {turnoParaReprogramar.profesionalNombreCompleto || 'Profesional asignado'}
                                        </p>
                                    </div>

                                    {errorReprogramar && (
                                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                                            <span>{errorReprogramar}</span>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-[#2A2825] mb-1">
                                                Elegí la nueva fecha:
                                            </label>
                                            <input
                                                type="date"
                                                min={(() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + 1);
                                                    return d.toISOString().split('T')[0];
                                                })()}
                                                value={reprogramarFecha}
                                                onChange={(e) => setReprogramarFecha(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5C8] bg-white text-xs font-semibold focus:outline-none focus:border-[#7A3B3B]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[#2A2825] mb-1">
                                                Elegí el nuevo horario:
                                            </label>
                                            <select
                                                value={reprogramarHora}
                                                onChange={(e) => setReprogramarHora(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5C8] bg-white text-xs font-semibold focus:outline-none focus:border-[#7A3B3B]"
                                            >
                                                {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((h) => (
                                                    <option key={h} value={h}>{h} hs</option>
                                                ))}
                                            </select>
                                        </div>

                                        <p className="text-[11px] text-[#8A7F74] leading-relaxed bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                                            ℹ️ Tu turno se actualizará manteniendo la misma cabina y especialista asignado.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-[#EDE8E1]">
                                        <button
                                            type="button"
                                            onClick={() => setTurnoParaReprogramar(null)}
                                            className="flex-1 py-2.5 px-4 rounded-xl border border-[#DDD5C8] text-xs font-bold text-[#5A524A] hover:bg-[#FAF8F5] transition-colors"
                                        >
                                            Volver
                                        </button>
                                        <button
                                            type="button"
                                            disabled={reprogramando || !reprogramarFecha || !reprogramarHora}
                                            onClick={handleConfirmarReprogramar}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                                        >
                                            {reprogramando ? 'Guardando...' : 'Confirmar Cambio'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* VISTA 2: FLUJO DE AGENDAR NUEVA RESERVA */}
                {activeTab === 'nueva_reserva' && step < 5 && (
                    <>
                        {/* Indicador de pasos 1 al 4 */}
                        <div className="bg-white p-6 rounded-3xl border border-[#EDE8E1] shadow-xs">
                            <div className="flex items-center justify-between">
                                {[
                                    { num: 1, label: 'Servicio' },
                                    { num: 2, label: 'Profesional' },
                                    { num: 3, label: 'Fecha y Hora' },
                                    { num: 4, label: 'Pago y Reserva' }
                                ].map((item, idx) => (
                                    <div key={item.num} className="flex items-center flex-1">
                                        <div className="flex flex-col items-center flex-1">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                                    step === item.num
                                                        ? 'bg-[#7A3B3B] text-white shadow-md ring-4 ring-[#7A3B3B]/15'
                                                        : step > item.num
                                                        ? 'bg-[#3C3530] text-white'
                                                        : 'bg-[#EDE8E1] text-[#8A7F74]'
                                                }`}
                                            >
                                                {step > item.num ? <Check className="w-5 h-5" /> : item.num}
                                            </div>
                                            <span
                                                className={`text-xs mt-2 text-center hidden sm:block font-semibold ${
                                                    step >= item.num ? 'text-[#2A2825]' : 'text-[#8A7F74]'
                                                }`}
                                            >
                                                {item.label}
                                            </span>
                                        </div>
                                        {idx < 3 && (
                                            <div
                                                className={`h-0.5 flex-1 transition-colors mx-2 ${
                                                    step > item.num ? 'bg-[#7A3B3B]' : 'bg-[#EDE8E1]'
                                                }`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PASO 1: SELECCIONAR SERVICIO */}
                        {step === 1 && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825] mb-1">
                                            1. Seleccioná tu Tratamiento
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[#8A7F74]">
                                            Elegí el servicio estético o terapéutico que deseás realizarte
                                        </p>
                                    </div>

                                    {/* Selector de Categoría */}
                                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                        <span className="font-bold text-[#8A7F74] mr-1 flex items-center gap-1">
                                            <Layers className="w-3.5 h-3.5 text-[#7A3B3B]" /> Categoría:
                                        </span>
                                        {['todos', 'Facial', 'Corporal', 'Masajes', 'Pestañas/Cejas'].map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFiltroCategoria(cat)}
                                                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                                                    filtroCategoria === cat
                                                        ? 'bg-[#7A3B3B] text-white shadow-xs'
                                                        : 'bg-[#FAF8F5] text-[#5A524A] hover:bg-[#EDE8E1]'
                                                }`}
                                            >
                                                {cat === 'todos' ? 'Todos' : cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {servicios
                                        .filter(s => filtroCategoria === 'todos' || s.categoria === filtroCategoria)
                                        .map((servicio) => {
                                            const isSelected = selectedServicio === servicio.id;
                                            return (
                                                <button
                                                    key={servicio.id}
                                                    type="button"
                                                    onClick={() => setSelectedServicio(servicio.id)}
                                                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                                        isSelected
                                                            ? 'border-[#7A3B3B] bg-[#FAF8F5] shadow-sm'
                                                            : 'border-[#EDE8E1] bg-white hover:border-[#DDD5C8] hover:shadow-2xs'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A3B3B] bg-[#7A3B3B]/10 px-2.5 py-0.5 rounded-full inline-block">
                                                                    {servicio.categoria}
                                                                </span>
                                                                {servicio.requiereCabinaEspecifica && (
                                                                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                        <DoorOpen className="w-3 h-3 text-amber-700" />
                                                                        <span>Cabina Específica</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="font-bold text-base text-[#2A2825] leading-snug">
                                                                {servicio.nombre}
                                                            </h3>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="w-6 h-6 bg-[#7A3B3B] rounded-full flex items-center justify-center flex-shrink-0 shadow-xs">
                                                                <Check className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between pt-3 border-t border-[#F5F2EB] mt-3">
                                                        <div className="flex items-center gap-1.5 text-xs text-[#8A7F74] font-medium">
                                                            <Clock className="w-3.5 h-3.5 text-[#7A3B3B]" />
                                                            <span>{servicio.duracion} min</span>
                                                        </div>
                                                        <div className="text-base font-bold text-[#3C3530]">
                                                            ${servicio.precio.toLocaleString('es-AR')} ARS
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-[#EDE8E1]">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        disabled={!selectedServicio}
                                        className="bg-[#3C3530] text-white px-7 py-3 rounded-xl hover:bg-[#7A3B3B] transition-colors font-semibold text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <span>Continuar a Profesional</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: SELECCIONAR PROFESIONAL (FILTRADO POR PROFESIONALES HABILITADOS) */}
                        {step === 2 && (() => {
                            const servicioSeleccionadoObj = servicios.find(s => s.id === selectedServicio);
                            const profesionalesDisponibles = profesionales.filter(p => {
                                if (!servicioSeleccionadoObj?.profesionalesHabilitadosIds || servicioSeleccionadoObj.profesionalesHabilitadosIds.length === 0) {
                                    return true;
                                }
                                return servicioSeleccionadoObj.profesionalesHabilitadosIds.includes(parseInt(p.id));
                            });

                            return (
                                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs space-y-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825] mb-1">
                                            2. Seleccioná Especialista
                                        </h2>
                                        <p className="text-xs sm:text-sm text-[#8A7F74]">
                                            Especialistas habilitados para realizar <strong className="text-[#7A3B3B]">{servicioSeleccionadoObj?.nombre}</strong>
                                        </p>
                                    </div>

                                    {profesionalesDisponibles.length === 0 ? (
                                        <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1] text-xs text-[#8A7F74]">
                                            No hay profesionales asignados específicamente a este servicio. Comunicate con administración.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profesionalesDisponibles.map((profesional) => {
                                                const isSelected = selectedProfesional === profesional.id;
                                                return (
                                                    <button
                                                        key={profesional.id}
                                                        type="button"
                                                        onClick={() => setSelectedProfesional(profesional.id)}
                                                        className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                                            isSelected
                                                                ? 'border-[#7A3B3B] bg-[#FAF8F5] shadow-sm'
                                                                : 'border-[#EDE8E1] bg-white hover:border-[#DDD5C8] hover:shadow-2xs'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7A3B3B] to-[#5C2B2B] flex items-center justify-center text-white text-base font-bold shadow-xs flex-shrink-0">
                                                                {profesional.nombre.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-bold text-base text-[#2A2825] truncate">
                                                                    {profesional.nombre}
                                                                </h3>
                                                                <p className="text-xs text-[#8A7F74] mt-0.5 leading-relaxed">
                                                                    {profesional.especialidad}
                                                                </p>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-6 h-6 bg-[#7A3B3B] rounded-full flex items-center justify-center flex-shrink-0 shadow-xs">
                                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-4 border-t border-[#EDE8E1]">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-5 py-2.5 rounded-xl border border-[#EDE8E1] text-[#3C3530] hover:bg-[#FAF8F5] text-xs font-semibold flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Cambiar Tratamiento</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            disabled={!selectedProfesional}
                                            className="bg-[#3C3530] text-white px-7 py-3 rounded-xl hover:bg-[#7A3B3B] transition-colors font-semibold text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <span>Continuar a Fecha y Hora</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                        {/* PASO 3: SELECCIONAR FECHA Y HORA */}
                        {step === 3 && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs space-y-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825] mb-1">
                                        3. Elegí Fecha y Horario
                                    </h2>
                                    <p className="text-xs sm:text-sm text-[#8A7F74]">
                                        Seleccioná el día y el horario disponible en cabina
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3C3530] mb-2">
                                            Día del Turno
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedFecha}
                                            onChange={(e) => setSelectedFecha(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 border border-[#DDD5C8] rounded-xl bg-[#FAF8F5] text-sm text-[#2A2825] focus:outline-none focus:border-[#7A3B3B] focus:ring-1 focus:ring-[#7A3B3B] transition-colors"
                                        />
                                        <p className="text-[11px] text-[#8A7F74] mt-2">
                                            Atención de Lunes a Sábados de 09:00 a 18:00 hs.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3C3530] mb-2">
                                            Horarios Disponibles
                                        </label>
                                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                                            {horariosDisponibles.map((hora) => {
                                                const isSelected = selectedHora === hora;
                                                return (
                                                    <button
                                                        key={hora}
                                                        type="button"
                                                        onClick={() => setSelectedHora(hora)}
                                                        disabled={!selectedFecha}
                                                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                                            isSelected
                                                                ? 'border-[#7A3B3B] bg-[#7A3B3B] text-white shadow-xs'
                                                                : 'border-[#EDE8E1] bg-white text-[#3C3530] hover:border-[#7A3B3B] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {hora} hs
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-[#EDE8E1]">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="px-5 py-2.5 rounded-xl border border-[#EDE8E1] text-[#3C3530] hover:bg-[#FAF8F5] transition-colors text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Volver</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(4)}
                                        disabled={!selectedFecha || !selectedHora}
                                        className="bg-[#3C3530] text-white px-7 py-3 rounded-xl hover:bg-[#7A3B3B] transition-colors font-semibold text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <span>Continuar a Pago</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PASO 4: PASARELA DE PAGO, CONFIRMACIÓN Y POLÍTICA 24H */}
                        {step === 4 && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs space-y-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825] mb-1">
                                        4. Método de Pago & Confirmación
                                    </h2>
                                    <p className="text-xs sm:text-sm text-[#8A7F74]">
                                        Elegí abonar por Mercado Pago o en Efectivo. El administrador confirmará el turno una vez pagado.
                                    </p>
                                </div>

                                {/* Resumen del Turno */}
                                <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-5 space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A3B3B]">
                                        Resumen de la Cita
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-[#8A7F74] block">Tratamiento:</span>
                                            <strong className="text-[#2A2825] text-sm">
                                                {servicioSeleccionadoObj?.nombre} ({servicioSeleccionadoObj?.duracion} min)
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="text-[#8A7F74] block">Profesional:</span>
                                            <strong className="text-[#2A2825] text-sm">
                                                {profesionalSeleccionadoObj?.nombre}
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="text-[#8A7F74] block">Fecha y Hora:</span>
                                            <strong className="text-[#2A2825] text-sm capitalize">
                                                {selectedFecha && new Date(selectedFecha + 'T00:00:00').toLocaleDateString('es-AR', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long'
                                                })} - {selectedHora} hs
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="text-[#8A7F74] block">Total a Abonar:</span>
                                            <span className="text-lg font-extrabold text-[#7A3B3B]">
                                                ${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')} ARS
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Selección de Método de Pago */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3C3530]">
                                        Seleccioná el Método de Pago
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Opción 1: Mercado Pago */}
                                        <div
                                            onClick={() => setMetodoPago('mercadopago')}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                                metodoPago === 'mercadopago'
                                                    ? 'border-[#009EE3] bg-[#009EE3]/5 shadow-sm ring-1 ring-[#009EE3]/30'
                                                    : 'border-[#EDE8E1] bg-white hover:border-[#DDD5C8]'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[#009EE3] flex items-center justify-center text-white shadow-2xs font-bold">
                                                            <CreditCard className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="font-bold text-sm text-[#2A2825]">Mercado Pago</h4>
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#009EE3] text-white">
                                                                    Online
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-[#8A7F74] mt-0.5">
                                                                Tarjetas, dinero en cuenta o QR
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        metodoPago === 'mercadopago' ? 'border-[#009EE3] bg-[#009EE3]' : 'border-[#DDD5C8]'
                                                    }`}>
                                                        {metodoPago === 'mercadopago' && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[#5A524A] mt-3 leading-relaxed">
                                                    Pagá de forma segura redirigiéndote directamente a la aplicación oficial de Mercado Pago.
                                                </p>
                                            </div>

                                            {metodoPago === 'mercadopago' && (
                                                <div className="mt-4 pt-3 border-t border-[#009EE3]/20 text-[11px] text-[#009EE3] font-medium flex items-center gap-1.5">
                                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Redirección directa a Mercado Pago al confirmar</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Opción 2: Efectivo */}
                                        <div
                                            onClick={() => setMetodoPago('efectivo')}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                                metodoPago === 'efectivo'
                                                    ? 'border-emerald-600 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-600/30'
                                                    : 'border-[#EDE8E1] bg-white hover:border-[#DDD5C8]'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-2xs font-bold">
                                                            <Banknote className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="font-bold text-sm text-[#2A2825]">Pago en Efectivo</h4>
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                                                                    En Recepción
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-[#8A7F74] mt-0.5">
                                                                Abonás el día del turno
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        metodoPago === 'efectivo' ? 'border-emerald-600 bg-emerald-600' : 'border-[#DDD5C8]'
                                                    }`}>
                                                        {metodoPago === 'efectivo' && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[#5A524A] mt-3 leading-relaxed">
                                                    Abonás en el mostrador del centro estético al presentarte a tu sesión.
                                                </p>
                                            </div>

                                            {metodoPago === 'efectivo' && (
                                                <div className="mt-4 pt-3 border-t border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                                                    <p>
                                                        ✓ Abonarás <strong>${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')} ARS</strong> al llegar.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Opción 3: Transferencia Bancaria */}
                                        <div
                                            onClick={() => setMetodoPago('transferencia')}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                                metodoPago === 'transferencia'
                                                    ? 'border-purple-600 bg-purple-500/5 shadow-sm ring-1 ring-purple-600/30'
                                                    : 'border-[#EDE8E1] bg-white hover:border-[#DDD5C8]'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-2xs font-bold">
                                                            <Building2 className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="font-bold text-sm text-[#2A2825]">Transferencia</h4>
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-700 text-white">
                                                                    CBU / Alias
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-[#8A7F74] mt-0.5">
                                                                Banco o Billetera Virtual
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        metodoPago === 'transferencia' ? 'border-purple-600 bg-purple-600' : 'border-[#DDD5C8]'
                                                    }`}>
                                                        {metodoPago === 'transferencia' && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[#5A524A] mt-3 leading-relaxed">
                                                    Transferí a nuestra cuenta bancaria y enviá el comprobante para que el Admin confirme el turno.
                                                </p>
                                            </div>

                                            {metodoPago === 'transferencia' && (
                                                <div className="mt-4 pt-3 border-t border-purple-200 text-[11px] text-purple-900 font-medium">
                                                    ✓ Datos bancarios disponibles abajo
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* DETALLES DE TRANSFERENCIA BANCARIA (Se muestra cuando se selecciona Transferencia) */}
                                    {metodoPago === 'transferencia' && (
                                        <div className="p-5 bg-gradient-to-br from-purple-50/60 to-purple-100/30 border-2 border-purple-200 rounded-3xl space-y-4 animate-in fade-in">
                                            <div className="flex items-center justify-between pb-3 border-b border-purple-200">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-5 h-5 text-purple-800" />
                                                    <h4 className="font-bold text-sm text-purple-950">
                                                        Datos para realizar la Transferencia Bancaria
                                                    </h4>
                                                </div>
                                                <span className="text-xs font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                                                    Monto a transferir: ${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')} ARS
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                                                    <span className="text-[10px] uppercase font-bold text-purple-600 block">Banco</span>
                                                    <span className="font-bold text-[#2A2825]">{siteConfig.transferenciaBanco || 'Banco Santander Río'}</span>
                                                </div>
                                                <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                                                    <span className="text-[10px] uppercase font-bold text-purple-600 block">Titular de la Cuenta</span>
                                                    <span className="font-bold text-[#2A2825]">{siteConfig.transferenciaTitular || 'Centro Estético S.R.L.'}</span>
                                                </div>
                                                <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                                                    <span className="text-[10px] uppercase font-bold text-purple-600 block">CUIT / CUIL</span>
                                                    <span className="font-mono font-bold text-[#2A2825]">{siteConfig.transferenciaCuit || '30-71649281-9'}</span>
                                                </div>
                                                <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold text-purple-600 block">Alias</span>
                                                        <span className="font-mono font-bold text-[#7A3B3B] text-sm">
                                                            {siteConfig.transferenciaAlias || 'ESTETICA.BIENESTAR.MP'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopiarTexto(siteConfig.transferenciaAlias || 'ESTETICA.BIENESTAR.MP', 'alias')}
                                                        className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        {copiadoAlias ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                                                        <span>{copiadoAlias ? 'Copiado' : 'Copiar'}</span>
                                                    </button>
                                                </div>
                                                <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-purple-100 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold text-purple-600 block">CBU / CVU</span>
                                                        <span className="font-mono font-bold text-[#2A2825] text-xs sm:text-sm">
                                                            {siteConfig.transferenciaCbuCvu || '0720182620000000948215'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopiarTexto(siteConfig.transferenciaCbuCvu || '0720182620000000948215', 'cbu')}
                                                        className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        {copiadoCbu ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                                                        <span>{copiadoCbu ? 'Copiado' : 'Copiar'}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Indicación obligatoria de envío de comprobante */}
                                            <div className="bg-purple-100/80 border border-purple-300 rounded-2xl p-4 text-xs text-purple-950 space-y-1.5">
                                                <div className="flex items-center gap-2 font-bold text-purple-900">
                                                    <MessageSquare className="w-4 h-4 text-purple-800 shrink-0" />
                                                    <span>Paso obligatorio luego de transferir:</span>
                                                </div>
                                                <p className="leading-relaxed text-purple-900">
                                                    Una vez realizada la transferencia, deberás enviar el comprobante de pago por WhatsApp al número{' '}
                                                    <strong className="underline text-purple-950">
                                                        {siteConfig.transferenciaWhatsappComprobante || siteConfig.whatsapp || '+54 9 11 2345-6789'}
                                                    </strong>{' '}
                                                    especificando el código de tu turno.
                                                </p>
                                                <p className="text-[11px] text-purple-800">
                                                    👉 <strong>El Administrador</strong> verificará la acreditación en la cuenta y <strong>confirmará el turno desde su perfil</strong> para asegurar tu sesión.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RECORDATORIO OBLIGATORIO: POLÍTICA DE NO REEMBOLSO < 24 HORAS */}
                                <div className="bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-5 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-900">
                                                Política Estricta de Cancelación y Reembolso
                                            </h4>
                                            <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                                                Las reservas garantizan la disponibilidad exclusiva de la cabina y el profesional asignado. 
                                                Podés cancelar o reprogramar tu turno sin costo avisando con <strong>al menos {siteConfig.horasCancelacionSinCargo} horas de antelación</strong>.
                                            </p>
                                            <p className="text-xs font-bold text-amber-950 mt-1.5 underline">
                                                ⚠️ IMPORTANTE: No hay reembolso si se cancela el turno pasadas las {siteConfig.horasCancelacionSinCargo} horas previas a la cita.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-amber-200">
                                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={aceptaPolitica24h}
                                                onChange={(e) => setAceptaPolitica24h(e.target.checked)}
                                                className="w-4 h-4 rounded border-amber-400 text-[#7A3B3B] focus:ring-[#7A3B3B] mt-0.5"
                                            />
                                            <span className="text-xs font-bold text-amber-950">
                                                He leído y acepto que no hay reembolso si cancelo el turno con menos de {siteConfig.horasCancelacionSinCargo} horas de anticipación.
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* AVISO DE CONFIRMACIÓN POR EL ADMINISTRADOR */}
                                <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#5A524A]">
                                    <ShieldCheck className="w-5 h-5 text-[#7A3B3B] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-[#2A2825] block mb-0.5">
                                            Confirmación y Validación por Administración
                                        </strong>
                                        <p className="leading-relaxed">
                                            Una vez agendado con tu método de pago seleccionado, el turno quedará registrado en estado <strong>Pendiente</strong>.
                                            El Administrador verificará el pago y confirmará la cita para asegurarte la atención. Recibirás aviso automático.
                                        </p>
                                    </div>
                                </div>

                                {/* Botones de Navegación del Paso 4 */}
                                <div className="flex items-center justify-between pt-4 border-t border-[#EDE8E1]">
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="px-5 py-2.5 rounded-xl border border-[#EDE8E1] text-[#3C3530] hover:bg-[#FAF8F5] transition-colors text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Volver a Horarios</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleProcederPago}
                                        disabled={isSubmitting || !aceptaPolitica24h}
                                        className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center gap-2 ${
                                            metodoPago === 'mercadopago'
                                                ? 'bg-[#009EE3] text-white hover:bg-[#0089C7]'
                                                : metodoPago === 'transferencia'
                                                ? 'bg-purple-700 text-white hover:bg-purple-800'
                                                : 'bg-[#3C3530] text-white hover:bg-[#7A3B3B]'
                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>
                                            {isSubmitting
                                                ? 'Procesando Reserva...'
                                                : metodoPago === 'mercadopago'
                                                ? `Pagar con Mercado Pago ($${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')})`
                                                : metodoPago === 'transferencia'
                                                ? `Confirmar Reserva por Transferencia ($${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')})`
                                                : 'Confirmar Reserva en Efectivo'
                                            }
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* PASO 5: COMPROBANTE DE RESERVA / VOUCHER DIGITAL */}
                {activeTab === 'nueva_reserva' && step === 5 && reservaExitosa && (
                    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#EDE8E1] shadow-md space-y-8 animate-in fade-in">
                        {/* Header Comprobante */}
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                                <Hourglass className="w-8 h-8 animate-pulse" />
                            </div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                reservaExitosa.metodoPago === 'transferencia'
                                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                                {reservaExitosa.metodoPago === 'mercadopago'
                                    ? '🟡 Pendiente de Pago - Esperando Acreditación de Mercado Pago (Webhook)'
                                    : reservaExitosa.metodoPago === 'transferencia'
                                    ? '🟣 Pendiente de Validación - Enviá tu Comprobante de Transferencia'
                                    : '🟡 Pendiente de Pago en Recepción'}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2825]">
                                ¡Reserva Registrada Provisoriamente!
                            </h2>
                            <p className="text-xs sm:text-sm text-[#8A7F74] max-w-lg mx-auto">
                                {reservaExitosa.metodoPago === 'mercadopago'
                                    ? 'Tu turno quedó agendado en espera del pago. En cuanto Mercado Pago confirme la transacción a nuestro Webhook, tu cita pasará automáticamente a estado CONFIRMADO.'
                                    : reservaExitosa.metodoPago === 'transferencia'
                                    ? 'Tu turno quedó agendado en estado PENDIENTE. Por favor enviá el comprobante de transferencia por WhatsApp para que la Administración verifique el pago y confirme tu turno formalmente desde su perfil.'
                                    : 'Tu cita ha quedado agendada en el sistema. El Administrador verificará el pago en el local para confirmar el turno formalmente.'}
                            </p>
                        </div>

                        {/* Tarjeta Voucher Estilo Editorial */}
                        <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-3xl p-6 sm:p-8 space-y-6 max-w-xl mx-auto shadow-xs">
                            <div className="flex items-center justify-between pb-4 border-b border-[#EDE8E1]">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A3B3B]">
                                        Comprobante Oficial de Reserva
                                    </span>
                                    <h3 className="text-lg font-bold text-[#2A2825]">Centro Estético</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-[#8A7F74] block">Código de Turno</span>
                                    <span className="text-base font-mono font-bold text-[#7A3B3B]">
                                        #{reservaExitosa.turnoId}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div className="flex justify-between py-1 border-b border-[#EDE8E1]">
                                    <span className="text-[#8A7F74]">Tratamiento:</span>
                                    <span className="font-bold text-[#2A2825]">{reservaExitosa.servicio.nombre}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#EDE8E1]">
                                    <span className="text-[#8A7F74]">Duración de la sesión:</span>
                                    <span className="font-semibold text-[#2A2825]">{reservaExitosa.servicio.duracion} minutos</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#EDE8E1]">
                                    <span className="text-[#8A7F74]">Especialista asignado:</span>
                                    <span className="font-semibold text-[#2A2825]">{reservaExitosa.profesional.nombre}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#EDE8E1]">
                                    <span className="text-[#8A7F74]">Fecha programada:</span>
                                    <span className="font-bold text-[#2A2825] capitalize">
                                        {new Date(reservaExitosa.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#EDE8E1]">
                                    <span className="text-[#8A7F74]">Horario de inicio:</span>
                                    <span className="font-bold text-[#2A2825]">{reservaExitosa.hora} hs</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#EDE8E1]">
                                    <span className="text-[#8A7F74]">Método de Pago:</span>
                                    <span className="font-semibold text-[#2A2825]">
                                        {reservaExitosa.metodoPago === 'mercadopago'
                                            ? '💳 Mercado Pago Online'
                                            : reservaExitosa.metodoPago === 'transferencia'
                                            ? '🏛️ Transferencia Bancaria'
                                            : '💵 Efectivo en Recepción'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#EDE8E1]">
                                    <span className="text-[#8A7F74]">Detalle de transacción:</span>
                                    <span className="font-mono text-[#7A3B3B] font-medium">{reservaExitosa.medioDetalle}</span>
                                </div>
                                {reservaExitosa.codigoOperacion && (
                                    <div className="flex justify-between py-1 border-b border-[#EDE8E1]">
                                        <span className="text-[#8A7F74]">Ref. Operación:</span>
                                        <span className="font-mono text-[#2A2825]">{reservaExitosa.codigoOperacion}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 text-sm">
                                    <span className="font-bold text-[#2A2825]">Total de la Reserva:</span>
                                    <span className="font-extrabold text-[#7A3B3B] text-base">
                                        ${reservaExitosa.total.toLocaleString('es-AR')} ARS
                                    </span>
                                </div>
                            </div>

                            {/* Recordatorio destacado de Política 24hs */}
                            <div className="bg-amber-100/60 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                                <p className="leading-relaxed">
                                    <strong>Recordatorio de Cancelación:</strong> Podés reprogramar o cancelar con al menos 24 hs de anticipación.
                                    Pasadas las 24 horas, <strong>no hay reembolso</strong> de la reserva.
                                </p>
                            </div>
                        </div>

                        {/* ACCIÓN DESTACADA DE TRANSFERENCIA BANCARIA */}
                        {reservaExitosa.metodoPago === 'transferencia' && (() => {
                            const numWa = (siteConfig.transferenciaWhatsappComprobante || siteConfig.whatsapp || '+54 9 11 2345-6789').replace(/[^0-9]/g, '');
                            const msgWa = `Hola! Acabo de registrar la reserva del Turno #${reservaExitosa.turnoId} para ${reservaExitosa.servicio.nombre} el día ${reservaExitosa.fecha} a las ${reservaExitosa.hora} hs (Total: $${reservaExitosa.total.toLocaleString('es-AR')} ARS). Adjunto en este chat el comprobante de transferencia bancaria para que puedan validarlo y confirmar el turno. ¡Muchas gracias!`;
                            const waUrl = `https://wa.me/${numWa}?text=${encodeURIComponent(msgWa)}`;

                            return (
                                <div className="bg-purple-50/70 border-2 border-purple-200 rounded-3xl p-6 text-center space-y-4 max-w-xl mx-auto shadow-xs">
                                    <div className="inline-flex items-center gap-2 bg-purple-700 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Envío Obligatorio de Comprobante</span>
                                    </div>

                                    <h4 className="text-base font-bold text-purple-950">
                                        Enviá tu comprobante para confirmar el turno
                                    </h4>

                                    <p className="text-xs text-[#5A524A] max-w-md mx-auto leading-relaxed">
                                        Tu turno se encuentra guardado en estado <strong>Pendiente</strong>. Para que el Administrador compruebe la acreditación de <strong>${reservaExitosa.total.toLocaleString('es-AR')} ARS</strong> y confirme el turno desde su panel, enviá el comprobante por WhatsApp:
                                    </p>

                                    {/* Botón WhatsApp directo */}
                                    <div>
                                        <a
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-[0.98]"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            <span>Enviar Comprobante por WhatsApp</span>
                                        </a>
                                    </div>

                                    {/* Resumen de cuenta bancaria para copiar */}
                                    <div className="pt-3 border-t border-purple-200/80 text-left bg-white/70 p-4 rounded-2xl space-y-2 text-xs">
                                        <span className="font-bold text-purple-950 block text-[11px] uppercase tracking-wider">
                                            Recordatorio de Cuenta para Transferir:
                                        </span>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                                            <span className="text-[#5A524A]">Alias: <strong>{siteConfig.transferenciaAlias}</strong></span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopiarTexto(siteConfig.transferenciaAlias, 'alias')}
                                                className="text-purple-700 font-bold hover:underline self-start sm:self-auto flex items-center gap-1"
                                            >
                                                {copiadoAlias ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                <span>{copiadoAlias ? 'Alias Copiado' : 'Copiar Alias'}</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                                            <span className="text-[#5A524A]">CBU/CVU: <strong className="font-mono">{siteConfig.transferenciaCbuCvu}</strong></span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopiarTexto(siteConfig.transferenciaCbuCvu, 'cbu')}
                                                className="text-purple-700 font-bold hover:underline self-start sm:self-auto flex items-center gap-1"
                                            >
                                                {copiadoCbu ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                <span>{copiadoCbu ? 'CBU Copiado' : 'Copiar CBU'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ACCIÓN DESTACADA DE MERCADO PAGO */}
                        {reservaExitosa.metodoPago === 'mercadopago' && reservaExitosa.initPointUrl && (
                            <div className="bg-[#009EE3]/10 border border-[#009EE3]/30 rounded-3xl p-5 sm:p-6 text-center space-y-3 max-w-xl mx-auto shadow-xs">
                                <div className="inline-flex items-center gap-2 bg-[#009EE3] text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Pasarela Oficial Mercado Pago</span>
                                </div>
                                <h4 className="text-base font-bold text-[#2A2825]">
                                    Tu pago está listo para completarse
                                </h4>
                                <p className="text-xs text-[#5A524A] max-w-md mx-auto leading-relaxed">
                                    Se ha generado tu preferencia de pago seguro por <strong>${reservaExitosa.total.toLocaleString('es-AR')} ARS</strong>.
                                    Si no se abrió la ventana de Mercado Pago automáticamente, hacé clic en el botón a continuación para completar la transacción:
                                </p>
                                <div>
                                    <a
                                        href={reservaExitosa.initPointUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#009EE3] hover:bg-[#0089C7] text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-[0.98]"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Abrir Ventana de Pago Mercado Pago</span>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Botones de Acción del Comprobante */}
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#EDE8E1]">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-5 py-2.5 rounded-xl border border-[#EDE8E1] text-[#3C3530] hover:bg-[#FAF8F5] transition-colors text-xs font-semibold flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4 text-[#7A3B3B]" />
                                <span>Imprimir Comprobante</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('mis_turnos');
                                    setStep(1);
                                }}
                                className="px-6 py-2.5 rounded-xl bg-[#3C3530] text-white hover:bg-[#2A2825] transition-colors text-xs font-bold flex items-center gap-2 shadow-xs"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Ver Mis Turnos</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleReiniciar}
                                className="px-6 py-2.5 rounded-xl bg-[#7A3B3B] text-white hover:bg-[#5C2B2B] transition-colors text-xs font-bold flex items-center gap-2 shadow-xs"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Agendar Otro Turno</span>
                            </button>

                            {onNavigate && (
                                <button
                                    type="button"
                                    onClick={() => onNavigate('inicio')}
                                    className="px-5 py-2.5 rounded-xl border border-[#EDE8E1] text-[#3C3530] hover:bg-[#FAF8F5] transition-colors text-xs font-semibold"
                                >
                                    Volver al Inicio
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default ReservarTurno;
