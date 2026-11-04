// Servicio centralizado para el Programa de Lealtad y el flujo de acreditación de Estampitas QR
// Flujo: Turno Confirmado -> Profesional habilita QR -> Notificación a Admin / QRs por Acreditar -> Admin escanea/acredita -> Estampita reflejada en la tarjeta del cliente

export interface SolicitudEstampitaQr {
  id: string; // ej: "SOL-173068102"
  codigoQr: string; // ej: "ESTETICA-QR-201-9481"
  turnoId: number;
  clienteId: number;
  clienteNombre: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  profesionalId: number;
  profesionalNombre: string;
  servicioNombre: string;
  fechaTurno: string;
  horaTurno: string;
  fechaHoraSolicitud: string;
  estado: 'pendiente' | 'acreditado' | 'cancelado';
  fechaAcreditacion?: string;
  acreditadoPor?: string;
}

export interface TarjetaClienteLocal {
  clienteId: number;
  clienteNombre: string;
  estampitasActuales: number;
  estampitasRequeridas: number;
  totalCanjeadas: number;
  ultimaActualizacion: string;
  historial: {
    fecha: string;
    servicio: string;
    profesional: string;
    estampitasSumadas: number;
  }[];
}

const STORAGE_KEY_SOLICITUDES = 'estetica_qr_solicitudes';
const STORAGE_KEY_TARJETAS = 'estetica_tarjetas_cliente';

export const EVENTO_QR_SOLICITUD_CREADA = 'estetica_qr_solicitud_creada';
export const EVENTO_ESTAMPITA_ACREDITADA = 'estetica_estampita_acreditada';

// Tarjetas iniciales de prueba
const TARJETAS_INICIALES: Record<number, TarjetaClienteLocal> = {
  101: {
    clienteId: 101,
    clienteNombre: 'Carla Gómez',
    estampitasActuales: 7,
    estampitasRequeridas: 10,
    totalCanjeadas: 1,
    ultimaActualizacion: '2026-11-02 11:30',
    historial: [
      { fecha: '2026-10-10', servicio: 'Higiene Facial', profesional: 'María González', estampitasSumadas: 1 },
      { fecha: '2026-10-24', servicio: 'Punta de Diamante', profesional: 'María González', estampitasSumadas: 1 },
      { fecha: '2026-11-02', servicio: 'Limpieza Facial Profunda', profesional: 'María González', estampitasSumadas: 1 },
    ],
  },
  102: {
    clienteId: 102,
    clienteNombre: 'Luciana Martínez',
    estampitasActuales: 5,
    estampitasRequeridas: 10,
    totalCanjeadas: 0,
    ultimaActualizacion: '2026-11-01 16:00',
    historial: [
      { fecha: '2026-11-01', servicio: 'Peeling Químico', profesional: 'María González', estampitasSumadas: 1 },
    ],
  },
  103: {
    clienteId: 103,
    clienteNombre: 'Mariana Benítez',
    estampitasActuales: 3,
    estampitasRequeridas: 10,
    totalCanjeadas: 0,
    ultimaActualizacion: '2026-10-30 14:15',
    historial: [
      { fecha: '2026-10-30', servicio: 'Radiofrecuencia Tripolar', profesional: 'María González', estampitasSumadas: 1 },
    ],
  },
  104: {
    clienteId: 104,
    clienteNombre: 'Sofía Romero',
    estampitasActuales: 1,
    estampitasRequeridas: 10,
    totalCanjeadas: 0,
    ultimaActualizacion: '2026-10-24 17:00',
    historial: [
      { fecha: '2026-10-24', servicio: 'Higiene Dérmica Inicial', profesional: 'María González', estampitasSumadas: 1 },
    ],
  },
};

// Solicitud inicial de demostración (pendiente para que el admin la vea de inmediato si entra)
const SOLICITUD_INICIAL_DEMO: SolicitudEstampitaQr = {
  id: 'SOL-DEMO-01',
  codigoQr: 'ESTETICA-QR-201-CARLA',
  turnoId: 201,
  clienteId: 101,
  clienteNombre: 'Carla Gómez',
  clienteEmail: 'carla.gomez@gmail.com',
  clienteTelefono: '+54 9 11 5566-7788',
  profesionalId: 1,
  profesionalNombre: 'María González',
  servicioNombre: 'Limpieza Facial Profunda',
  fechaTurno: new Date().toISOString().split('T')[0],
  horaTurno: '10:00',
  fechaHoraSolicitud: 'Hace 5 min',
  estado: 'pendiente',
};

export const lealtadService = {
  // Obtener todas las solicitudes registradas
  getSolicitudes: (): SolicitudEstampitaQr[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SOLICITUDES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error leyendo solicitudes de QR de lealtad:', e);
    }
    // Si no hay ninguna aún, sembramos la demo para que el usuario pueda probar el flujo sin fricción
    localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify([SOLICITUD_INICIAL_DEMO]));
    return [SOLICITUD_INICIAL_DEMO];
  },

  // Obtener solo las solicitudes pendientes de acreditación
  getPendientes: (): SolicitudEstampitaQr[] => {
    const list = lealtadService.getSolicitudes();
    return list.filter(s => s.estado === 'pendiente');
  },

  // Flujo Paso 2: El Profesional habilita el QR para escanear
  solicitarQr: (datos: {
    turnoId: number;
    clienteId?: number;
    clienteNombre: string;
    clienteEmail?: string;
    clienteTelefono?: string;
    profesionalId: number;
    profesionalNombre: string;
    servicioNombre: string;
    fechaTurno: string;
    horaTurno: string;
  }): SolicitudEstampitaQr => {
    const solicitudes = lealtadService.getSolicitudes();

    // Comprobar si ya existe una solicitud pendiente para este turno
    const existente = solicitudes.find(
      s => s.turnoId === datos.turnoId && s.estado === 'pendiente'
    );
    if (existente) {
      return existente;
    }

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const codigoQr = `ESTETICA-QR-TURNO-${datos.turnoId}-${randomSuffix}`;
    const nueva: SolicitudEstampitaQr = {
      id: `SOL-${timestamp}`,
      codigoQr,
      turnoId: datos.turnoId,
      clienteId: datos.clienteId || 101,
      clienteNombre: datos.clienteNombre,
      clienteEmail: datos.clienteEmail || 'cliente@estetica.com',
      clienteTelefono: datos.clienteTelefono || '',
      profesionalId: datos.profesionalId,
      profesionalNombre: datos.profesionalNombre,
      servicioNombre: datos.servicioNombre,
      fechaTurno: datos.fechaTurno,
      horaTurno: datos.horaTurno,
      fechaHoraSolicitud: 'En este momento',
      estado: 'pendiente',
    };

    const actualizadas = [nueva, ...solicitudes];
    try {
      localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(actualizadas));
    } catch (e) {
      console.error('Error guardando nueva solicitud de QR:', e);
    }

    // Disparar evento para notificación en vivo en el panel del admin
    window.dispatchEvent(
      new CustomEvent(EVENTO_QR_SOLICITUD_CREADA, { detail: nueva })
    );

    return nueva;
  },

  // Flujo Paso 4 y 5: El Administrador escanea o acredita el QR
  acreditarQr: (
    codigoOId: string,
    adminNombre: string = 'Administrador'
  ): {
    exito: boolean;
    mensaje: string;
    solicitud?: SolicitudEstampitaQr;
    tarjetaActualizada?: TarjetaClienteLocal;
    premioAlcanzado?: boolean;
  } => {
    const solicitudes = lealtadService.getSolicitudes();
    const cleanQuery = codigoOId.trim().toUpperCase();

    const idx = solicitudes.findIndex(
      s =>
        (s.codigoQr.toUpperCase() === cleanQuery ||
          s.id.toUpperCase() === cleanQuery ||
          String(s.turnoId) === cleanQuery) &&
        s.estado === 'pendiente'
    );

    if (idx === -1) {
      // Verificar si ya fue acreditado previamente
      const yaAcreditado = solicitudes.find(
        s =>
          (s.codigoQr.toUpperCase() === cleanQuery || s.id.toUpperCase() === cleanQuery) &&
          s.estado === 'acreditado'
      );
      if (yaAcreditado) {
        return {
          exito: false,
          mensaje: `Este código QR ya fue acreditado anteriormente el ${yaAcreditado.fechaAcreditacion || 'recientemente'}.`,
        };
      }

      return {
        exito: false,
        mensaje: `No se encontró ninguna solicitud QR pendiente con el código "${codigoOId}".`,
      };
    }

    const sol = { ...solicitudes[idx] };
    sol.estado = 'acreditado';
    sol.fechaAcreditacion = new Date().toLocaleString('es-AR');
    sol.acreditadoPor = adminNombre;
    solicitudes[idx] = sol;

    try {
      localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(solicitudes));
    } catch {}

    // Acreditar estampita en la tarjeta del cliente
    const tarjetas = lealtadService.getTarjetas();
    const clienteId = sol.clienteId || 101;
    const tarjeta = tarjetas[clienteId] || {
      clienteId,
      clienteNombre: sol.clienteNombre,
      estampitasActuales: 0,
      estampitasRequeridas: 10,
      totalCanjeadas: 0,
      ultimaActualizacion: new Date().toISOString(),
      historial: [],
    };

    tarjeta.estampitasActuales = (tarjeta.estampitasActuales || 0) + 1;
    tarjeta.ultimaActualizacion = new Date().toLocaleString('es-AR');
    tarjeta.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      servicio: sol.servicioNombre,
      profesional: sol.profesionalNombre,
      estampitasSumadas: 1,
    });

    let premioAlcanzado = false;
    if (tarjeta.estampitasActuales >= tarjeta.estampitasRequeridas) {
      premioAlcanzado = true;
      tarjeta.totalCanjeadas += 1;
    }

    tarjetas[clienteId] = tarjeta;
    try {
      localStorage.setItem(STORAGE_KEY_TARJETAS, JSON.stringify(tarjetas));
    } catch {}

    // Disparar evento para que la tarjeta del cliente y el modal del profesional se actualicen al instante
    window.dispatchEvent(
      new CustomEvent(EVENTO_ESTAMPITA_ACREDITADA, {
        detail: {
          solicitud: sol,
          tarjeta,
          premioAlcanzado,
        },
      })
    );

    return {
      exito: true,
      mensaje: `¡Estampita acreditada exitosamente a ${sol.clienteNombre}! Ahora tiene ${tarjeta.estampitasActuales} de ${tarjeta.estampitasRequeridas} estampitas.`,
      solicitud: sol,
      tarjetaActualizada: tarjeta,
      premioAlcanzado,
    };
  },

  // Obtener tarjetas de clientes
  getTarjetas: (): Record<number, TarjetaClienteLocal> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TARJETAS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    localStorage.setItem(STORAGE_KEY_TARJETAS, JSON.stringify(TARJETAS_INICIALES));
    return TARJETAS_INICIALES;
  },

  // Obtener tarjeta de un cliente específico
  getTarjetaCliente: (clienteId: number | string = 101, fallbackNombre?: string): TarjetaClienteLocal => {
    const numId = Number(clienteId) || 101;
    const tarjetas = lealtadService.getTarjetas();
    if (tarjetas[numId]) {
      return tarjetas[numId];
    }
    const nueva: TarjetaClienteLocal = {
      clienteId: numId,
      clienteNombre: fallbackNombre || 'Cliente Estética',
      estampitasActuales: 0,
      estampitasRequeridas: 10,
      totalCanjeadas: 0,
      ultimaActualizacion: new Date().toLocaleString('es-AR'),
      historial: [],
    };
    tarjetas[numId] = nueva;
    try {
      localStorage.setItem(STORAGE_KEY_TARJETAS, JSON.stringify(tarjetas));
    } catch {}
    return nueva;
  },

  // Cancelar una solicitud pendiente si hubo error
  cancelarSolicitud: (solicitudId: string) => {
    const list = lealtadService.getSolicitudes();
    const act = list.map(s => (s.id === solicitudId ? { ...s, estado: 'cancelado' as const } : s));
    try {
      localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(act));
    } catch {}
    window.dispatchEvent(new CustomEvent('estetica_qr_solicitud_actualizada'));
  },
};
