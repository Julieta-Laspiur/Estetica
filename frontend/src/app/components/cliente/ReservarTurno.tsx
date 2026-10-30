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
    QrCode,
    Printer,
    Hourglass,
    FileText,
    CheckCircle2,
    XCircle,
    Info,
    RotateCcw
} from 'lucide-react';
import { serviciosApi, turnosApi, type AuthUser } from '../../../services/api';

interface Servicio {
    id: string;
    nombre: string;
    duracion: number;
    precio: number;
    categoria: string;
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
    metodoPago: 'mercadopago' | 'efectivo';
    medioDetalle: string;
    total: number;
    codigoOperacion?: string;
    fechaRegistro: string;
}

export function ReservarTurno({ initialServicioId, currentUser, onNavigate }: ReservarTurnoProps = {}) {
    const [activeTab, setActiveTab] = useState<'nueva_reserva' | 'mis_turnos'>('nueva_reserva');
    const [step, setStep] = useState(initialServicioId ? 2 : 1);
    const [selectedServicio, setSelectedServicio] = useState<string | null>(initialServicioId ? initialServicioId.toString() : null);
    const [selectedProfesional, setSelectedProfesional] = useState<string | null>(null);
    const [selectedFecha, setSelectedFecha] = useState<string>('');
    const [selectedHora, setSelectedHora] = useState<string | null>(null);
    const [metodoPago, setMetodoPago] = useState<'mercadopago' | 'efectivo'>('mercadopago');
    const [medioMercadoPago, setMedioMercadoPago] = useState<'tarjeta' | 'dinero' | 'transferencia' | 'qr'>('tarjeta');
    const [aceptaPolitica24h, setAceptaPolitica24h] = useState(false);
    const [showMercadoPagoModal, setShowMercadoPagoModal] = useState(false);
    const [procesandoPagoMP, setProcesandoPagoMP] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reservaExitosa, setReservaExitosa] = useState<ReservaCompletadaData | null>(null);

    // Lista de turnos del cliente
    const [misTurnos, setMisTurnos] = useState<any[]>([]);
    const [loadingMisTurnos, setLoadingMisTurnos] = useState(false);

    useEffect(() => {
        if (initialServicioId) {
            setSelectedServicio(initialServicioId.toString());
            setStep(2);
        }
    }, [initialServicioId]);

    const [servicios, setServicios] = useState<Servicio[]>([
        { id: '1', nombre: 'Limpieza Facial Profunda', duracion: 60, precio: 4500, categoria: 'Faciales' },
        { id: '2', nombre: 'Masaje Relajante & Descontracturante', duracion: 50, precio: 5200, categoria: 'Masajes' },
        { id: '3', nombre: 'Drenaje Linfático Manual', duracion: 45, precio: 4800, categoria: 'Corporales' },
        { id: '4', nombre: 'Radiofrecuencia Facial Tensora', duracion: 45, precio: 6500, categoria: 'Faciales' },
        { id: '5', nombre: 'Peeling Químico Renovador', duracion: 40, precio: 5800, categoria: 'Faciales' },
    ]);

    useEffect(() => {
        serviciosApi.getActivos()
            .then(apiServs => {
                if (apiServs && apiServs.length > 0) {
                    const mapped: Servicio[] = apiServs.map(s => ({
                        id: s.servicioId.toString(),
                        nombre: s.nombre,
                        duracion: s.duracionMin,
                        precio: s.precio,
                        categoria: s.nombre.toLowerCase().includes('facial') ? 'Faciales' : 'Masajes & Corporales',
                    }));
                    setServicios(mapped);
                }
            })
            .catch(() => {
                // Fallback a servicios estáticos
            });
    }, []);

    const profesionales: Profesional[] = [
        { id: '1', nombre: 'Dra. Camila Rossi', especialidad: 'Dermatocosmiatría y Estética Facial' },
        { id: '2', nombre: 'Lic. Sofía Vega', especialidad: 'Masoterapia y Drenaje Linfático' },
        { id: '3', nombre: 'Téc. Lucía Méndez', especialidad: 'Aparatología y Radiofrecuencia' },
    ];

    const horariosDisponibles = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    // Cargar Mis Turnos
    const cargarMisTurnos = async () => {
        setLoadingMisTurnos(true);
        try {
            let turnosData: any[] = [];
            if (currentUser?.usuarioId) {
                turnosData = await turnosApi.getPorUsuario(currentUser.usuarioId);
            } else {
                turnosData = await turnosApi.getTurnos();
            }

            // Enriquecer con métodos de pago almacenados localmente
            const pagosGuardados = JSON.parse(localStorage.getItem('estetica_turnos_pagos') || '{}');
            const enriquecidos = turnosData.map(t => ({
                ...t,
                metodoPagoGuardado: pagosGuardados[String(t.turnoId)]?.metodo || (t.metodoPago || 'efectivo'),
                detallePagoGuardado: pagosGuardados[String(t.turnoId)]?.detalle || '',
            }));
            setMisTurnos(enriquecidos);
        } catch {
            // Leer desde localStorage si no hay conexión al backend
            const turnosLocales = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
            setMisTurnos(turnosLocales);
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

            // Guardar en historial de cliente
            const listado = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
            const turnoFormateado = {
                turnoId: nuevoTurno.turnoId,
                clienteNombreCompleto: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Cliente Web',
                profesionalNombreCompleto: nuevoTurno.profesional.nombre,
                cabinaNombre: 'Cabina Principal 01',
                fechaHoraInicio: `${nuevoTurno.fecha}T${nuevoTurno.hora}:00`,
                estado: 'Pendiente', // Pendiente de confirmación del admin
                total: nuevoTurno.total,
                servicios: [{
                    servicioId: parseInt(nuevoTurno.servicio.id),
                    nombre: nuevoTurno.servicio.nombre,
                    duracionMin: nuevoTurno.servicio.duracion,
                    precio: nuevoTurno.servicio.precio
                }],
                metodoPagoGuardado: nuevoTurno.metodoPago,
                detallePagoGuardado: nuevoTurno.medioDetalle,
                codigoOperacion: nuevoTurno.codigoOperacion,
            };
            listado.unshift(turnoFormateado);
            localStorage.setItem('estetica_reservas_cliente', JSON.stringify(listado));
        } catch (e) {
            console.error('Error al persistir turno local:', e);
        }
    };

    // Confirmar y registrar reserva
    const ejecutarRegistroReserva = async (codigoTransaccion?: string) => {
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
                cabinaId: 1,
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
            // En caso de que el backend no tenga sesión activa, se usa el ID simulado
        } finally {
            setIsSubmitting(false);

            let detalleMedio = 'Pago en Recepción en Mostrador';
            if (metodoPago === 'mercadopago') {
                switch (medioMercadoPago) {
                    case 'tarjeta': detalleMedio = 'Tarjeta Débito/Crédito (Mercado Pago)'; break;
                    case 'dinero': detalleMedio = 'Dinero en Cuenta (Mercado Pago)'; break;
                    case 'transferencia': detalleMedio = 'Transferencia CVU/Alias (Mercado Pago)'; break;
                    case 'qr': detalleMedio = 'Código QR (Mercado Pago)'; break;
                }
            }

            const dataExito: ReservaCompletadaData = {
                turnoId: turnoIdGenerado,
                servicio,
                profesional,
                fecha: selectedFecha,
                hora: selectedHora,
                metodoPago,
                medioDetalle: detalleMedio,
                total: servicio.precio,
                codigoOperacion: codigoTransaccion || `MP-${Math.floor(100000000 + Math.random() * 900000000)}`,
                fechaRegistro: new Date().toISOString(),
            };

            guardarTurnoLocal(dataExito);
            setReservaExitosa(dataExito);
            cargarMisTurnos();
            setStep(5); // Pantalla de Comprobante / Voucher
        }
    };

    // Manejador del botón principal en Paso 4
    const handleProcederPago = () => {
        if (!aceptaPolitica24h) {
            alert('Debes confirmar que has leído y aceptas la política de no reembolso para cancelaciones pasadas las 24 horas.');
            return;
        }

        if (metodoPago === 'mercadopago') {
            setShowMercadoPagoModal(true);
        } else {
            // Efectivo en mostrador
            ejecutarRegistroReserva();
        }
    };

    // Simulación de Checkout Mercado Pago
    const handleConfirmarMercadoPagoModal = () => {
        setProcesandoPagoMP(true);
        setTimeout(() => {
            setProcesandoPagoMP(false);
            setShowMercadoPagoModal(false);
            const opCode = `MP-${Math.floor(100000000 + Math.random() * 900000000)}`;
            ejecutarRegistroReserva(opCode);
        }, 1600);
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

                                    const isPendiente = String(t.estado).toLowerCase().includes('pend');
                                    const isConfirmado = String(t.estado).toLowerCase().includes('conf');
                                    const isCancelado = String(t.estado).toLowerCase().includes('canc');

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
                                                        Pago: <strong>{t.metodoPagoGuardado === 'mercadopago' ? 'Mercado Pago (Online)' : 'Efectivo en Recepción'}</strong>
                                                    </span>
                                                </div>
                                                <div className="text-right sm:text-right font-bold text-[#2A2825]">
                                                    Monto: ${Number(t.total || 0).toLocaleString('es-AR')} ARS
                                                </div>
                                            </div>

                                            {/* Nota informativa de confirmación */}
                                            {isPendiente && (
                                                <div className="p-3 bg-white rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                                                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                                                    <p>
                                                        El turno ha sido registrado con tu método de pago seleccionado. El Administrador verificará el pago para cambiar el estado a <strong>Confirmado</strong>.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Acción de cancelar con regla 24hs */}
                                            {!isCancelado && (
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-[10px] text-[#8A7F74]">
                                                        * Cancelación sin penalidad hasta 24 hs antes de la cita.
                                                    </span>
                                                    <button
                                                        onClick={() => handleCancelarTurnoCliente(t)}
                                                        className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline"
                                                    >
                                                        Cancelar Turno
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825] mb-1">
                                        1. Seleccioná tu Tratamiento
                                    </h2>
                                    <p className="text-xs sm:text-sm text-[#8A7F74]">
                                        Elegí el servicio estético o terapéutico que deseás realizarte
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {servicios.map((servicio) => {
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
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A3B3B] bg-[#7A3B3B]/10 px-2 py-0.5 rounded-full inline-block mb-1.5">
                                                            {servicio.categoria}
                                                        </span>
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

                        {/* PASO 2: SELECCIONAR PROFESIONAL */}
                        {step === 2 && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE8E1] shadow-xs space-y-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-[#2A2825] mb-1">
                                        2. Seleccioná Especialista
                                    </h2>
                                    <p className="text-xs sm:text-sm text-[#8A7F74]">
                                        Elegí el profesional que llevará a cabo tu sesión
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profesionales.map((profesional) => {
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

                                <div className="flex items-center justify-between pt-4 border-t border-[#EDE8E1]">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-5 py-2.5 rounded-xl border border-[#EDE8E1] text-[#3C3530] hover:bg-[#FAF8F5] transition-colors text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Volver</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        disabled={!selectedProfesional}
                                        className="bg-[#3C3530] text-white px-7 py-3 rounded-xl hover:bg-[#7A3B3B] transition-colors font-semibold text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <span>Continuar a Horarios</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Opción 1: Mercado Pago */}
                                        <div
                                            onClick={() => setMetodoPago('mercadopago')}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                                                metodoPago === 'mercadopago'
                                                    ? 'border-[#009EE3] bg-[#009EE3]/5 shadow-sm'
                                                    : 'border-[#EDE8E1] bg-white hover:border-[#DDD5C8]'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[#009EE3] flex items-center justify-center text-white shadow-2xs font-bold">
                                                        <CreditCard className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-sm text-[#2A2825]">Mercado Pago</h4>
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#009EE3] text-white">
                                                                Online
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[#8A7F74] mt-0.5">
                                                            Tarjetas de débito/crédito, dinero en cuenta o QR
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                    metodoPago === 'mercadopago' ? 'border-[#009EE3] bg-[#009EE3]' : 'border-[#DDD5C8]'
                                                }`}>
                                                    {metodoPago === 'mercadopago' && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>

                                            {/* Sub-opciones de Mercado Pago */}
                                            {metodoPago === 'mercadopago' && (
                                                <div className="mt-4 pt-3 border-t border-[#009EE3]/20 space-y-2">
                                                    <span className="text-[11px] font-bold text-[#009EE3] block">
                                                        Medio preferido en Mercado Pago:
                                                    </span>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        {[
                                                            { id: 'tarjeta', label: 'Tarjeta Débito/Crédito' },
                                                            { id: 'dinero', label: 'Dinero en Cuenta MP' },
                                                            { id: 'transferencia', label: 'Transferencia CVU' },
                                                            { id: 'qr', label: 'Escanear QR' }
                                                        ].map(medio => (
                                                            <button
                                                                key={medio.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setMedioMercadoPago(medio.id as any);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium text-left transition-colors ${
                                                                    medioMercadoPago === medio.id
                                                                        ? 'border-[#009EE3] bg-[#009EE3] text-white'
                                                                        : 'border-[#EDE8E1] bg-white text-[#5A524A] hover:bg-[#FAF8F5]'
                                                                }`}
                                                            >
                                                                {medio.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Opción 2: Efectivo */}
                                        <div
                                            onClick={() => setMetodoPago('efectivo')}
                                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                                                metodoPago === 'efectivo'
                                                    ? 'border-emerald-600 bg-emerald-500/5 shadow-sm'
                                                    : 'border-[#EDE8E1] bg-white hover:border-[#DDD5C8]'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-2xs font-bold">
                                                        <Banknote className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-sm text-[#2A2825]">Pago en Efectivo</h4>
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                                                                En Recepción
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[#8A7F74] mt-0.5">
                                                            Abonás al llegar al centro estético el día del turno
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                    metodoPago === 'efectivo' ? 'border-emerald-600 bg-emerald-600' : 'border-[#DDD5C8]'
                                                }`}>
                                                    {metodoPago === 'efectivo' && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>

                                            {metodoPago === 'efectivo' && (
                                                <div className="mt-4 pt-3 border-t border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                                                    <p>
                                                        ✓ Abonarás <strong>${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')} ARS</strong> directamente en recepción.
                                                    </p>
                                                    <p className="text-[10px] text-[#8A7F74]">
                                                        * Solicitamos presentarse 10 minutos antes del horario acordado.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                                Podés cancelar o reprogramar tu turno sin costo avisando con <strong>al menos 24 horas de antelación</strong>.
                                            </p>
                                            <p className="text-xs font-bold text-amber-950 mt-1.5 underline">
                                                ⚠️ IMPORTANTE: No hay reembolso si se cancela el turno pasadas las 24 horas previas a la cita.
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
                                                He leído y acepto que no hay reembolso si cancelo el turno con menos de 24 horas de anticipación.
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
                                                : 'bg-[#3C3530] text-white hover:bg-[#7A3B3B]'
                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>
                                            {isSubmitting
                                                ? 'Procesando Reserva...'
                                                : metodoPago === 'mercadopago'
                                                ? `Pagar con Mercado Pago ($${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')})`
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
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                🟡 Pendiente de Confirmación por Administración
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2825]">
                                ¡Reserva Registrada con Éxito!
                            </h2>
                            <p className="text-xs sm:text-sm text-[#8A7F74] max-w-lg mx-auto">
                                Tu cita ha quedado agendada en el sistema. El Administrador verificará el pago y confirmará el turno formalmente.
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
                                        {reservaExitosa.metodoPago === 'mercadopago' ? '💳 Mercado Pago' : '💵 Efectivo en Recepción'}
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

                {/* MODAL CHECKOUT MERCADO PAGO */}
                {showMercadoPagoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full border border-[#EDE8E1] shadow-2xl overflow-hidden">
                            {/* Header Mercado Pago oficial */}
                            <div className="bg-[#009EE3] p-6 text-white text-center space-y-1">
                                <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Pasarela Mercado Pago Checkout</span>
                                </div>
                                <h3 className="text-xl font-bold">Abonar Reserva de Turno</h3>
                                <p className="text-xs text-white/80">Estética & Bienestar - Cabina Premium</p>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-[#8A7F74] block">Monto a abonar</span>
                                        <span className="text-2xl font-extrabold text-[#2A2825]">
                                            ${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')} ARS
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        Pago Seguro SSL
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <span className="text-xs font-bold text-[#3C3530] block">
                                        Medio de Pago Seleccionado:
                                    </span>
                                    <div className="p-3.5 rounded-xl border border-[#009EE3] bg-[#009EE3]/5 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 font-bold text-[#009EE3]">
                                            {medioMercadoPago === 'qr' ? <QrCode className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                            <span className="capitalize">
                                                {medioMercadoPago === 'tarjeta' && 'Tarjeta Débito / Crédito (Hasta 3 cuotas sin interés)'}
                                                {medioMercadoPago === 'dinero' && 'Dinero en Cuenta de Mercado Pago'}
                                                {medioMercadoPago === 'transferencia' && 'Transferencia bancaria vía CVU'}
                                                {medioMercadoPago === 'qr' && 'Código QR Mercado Pago'}
                                            </span>
                                        </div>
                                    </div>

                                    {medioMercadoPago === 'qr' && (
                                        <div className="text-center p-4 bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1]">
                                            <div className="w-32 h-32 bg-white border border-[#DDD5C8] rounded-xl mx-auto flex items-center justify-center p-2 shadow-2xs">
                                                <QrCode className="w-24 h-24 text-[#009EE3]" />
                                            </div>
                                            <p className="text-[11px] text-[#8A7F74] mt-2">
                                                Escaneá este código QR desde tu app de Mercado Pago
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Recordatorio 24 horas dentro del modal */}
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                                    <span>
                                        Al abonar aceptás la política: <strong>sin reembolso</strong> si cancelás con menos de 24 horas de anticipación.
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowMercadoPagoModal(false)}
                                        disabled={procesandoPagoMP}
                                        className="px-4 py-2.5 rounded-xl border border-[#EDE8E1] text-[#5A524A] hover:bg-[#FAF8F5] text-xs font-semibold"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleConfirmarMercadoPagoModal}
                                        disabled={procesandoPagoMP}
                                        className="flex-1 py-3 rounded-xl bg-[#009EE3] hover:bg-[#0089C7] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        {procesandoPagoMP ? (
                                            <>
                                                <Clock className="w-4 h-4 animate-spin" />
                                                <span>Aprobando Transacción...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>Abonar ${servicioSeleccionadoObj?.precio.toLocaleString('es-AR')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default ReservarTurno;
