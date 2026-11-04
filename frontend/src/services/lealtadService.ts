// Servicio centralizado para el Programa de Lealtad y el flujo de acreditación de Estampitas QR
// Soporta MÚLTIPLES TIPOS DE TARJETAS DE MEMBRESÍA (ej. Uñas = 5 estampitas, Facial = 8 estampitas, Spa = 6 estampitas, VIP = 10 estampitas)

export type CategoriaTarjeta = 'Uñas' | 'Facial' | 'Corporal' | 'Masajes' | 'Pestañas/Cejas' | 'Todas';
export type TipoPremioTarjeta = 'servicio_gratis' | 'porcentaje' | 'monto_fijo';
export type ColorTemaTarjeta = 'rose' | 'wine' | 'emerald' | 'dark' | 'gold' | 'violet';

export interface TipoTarjetaMembresia {
  id: string; // ej: "card-unas", "card-facial", "card-masajes", "card-vip"
  nombre: string;
  categoria: CategoriaTarjeta;
  descripcion: string;
  estampitasRequeridas: number; // e.g. 5 para uñas, 8 para facial, etc.
  recompensaTitulo: string;
  tipoPremio: TipoPremioTarjeta;
  valorPremio: number; // ej: 100 (% o gratis), 30 (% off), 25000 ($)
  validezDias: number; // ej: 45, 60
  colorTema: ColorTemaTarjeta;
  icono: string; // '💅', '✨', '🌿', '👑', '💆‍♀️', '🌸', '🧴', '💎'
  activa: boolean;
  fechaCreacion: string;
}

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
  tarjetaTipoIdAsignada?: string;
}

export interface ProgresoTarjetaCliente {
  tipoId: string;
  estampitasActuales: number;
  totalCanjeadas: number;
  ultimaAcreditacion?: string;
}

export interface TarjetaClienteLocal {
  clienteId: number;
  clienteNombre: string;
  estampitasActuales: number; // General de compatibilidad
  estampitasRequeridas: number; // General de compatibilidad
  totalCanjeadas: number;
  ultimaActualizacion: string;
  progresosPorTipo: Record<string, ProgresoTarjetaCliente>;
  historial: {
    fecha: string;
    servicio: string;
    profesional: string;
    estampitasSumadas: number;
    tarjetaId?: string;
    tarjetaNombre?: string;
  }[];
}

const STORAGE_KEY_SOLICITUDES = 'estetica_qr_solicitudes';
const STORAGE_KEY_TARJETAS = 'estetica_tarjetas_cliente';
const STORAGE_KEY_TIPOS_TARJETAS = 'estetica_tipos_tarjetas_membresia';

export const EVENTO_QR_SOLICITUD_CREADA = 'estetica_qr_solicitud_creada';
export const EVENTO_ESTAMPITA_ACREDITADA = 'estetica_estampita_acreditada';
export const EVENTO_TIPOS_TARJETAS_ACTUALIZADOS = 'estetica_tipos_tarjetas_actualizados';

// Tipos de tarjetas predeterminados
export const TIPOS_TARJETAS_PREDETERMINADOS: TipoTarjetaMembresia[] = [
  {
    id: 'card-unas',
    nombre: 'Membresía Uñas & Manicuría',
    categoria: 'Uñas',
    descripcion: 'Diseñada para manicuría, pedicuría, kapping y esmaltado semi. Con solo 5 visitas completás tu ciclo y ganás tu premio.',
    estampitasRequeridas: 5,
    recompensaTitulo: 'Esmaltado Semipermanente 100% Bonificado',
    tipoPremio: 'servicio_gratis',
    valorPremio: 100,
    validezDias: 45,
    colorTema: 'rose',
    icono: '💅',
    activa: true,
    fechaCreacion: '2026-01-15',
  },
  {
    id: 'card-facial',
    nombre: 'Membresía Facial & Dermoestética',
    categoria: 'Facial',
    descripcion: 'Para sesiones de higiene cutánea profunda, punta de diamante, dermaplaning, peelings y nutrición celular.',
    estampitasRequeridas: 8,
    recompensaTitulo: 'Limpieza Facial Profunda con Punta de Diamante (30% OFF)',
    tipoPremio: 'porcentaje',
    valorPremio: 30,
    validezDias: 60,
    colorTema: 'wine',
    icono: '✨',
    activa: true,
    fechaCreacion: '2026-01-15',
  },
  {
    id: 'card-masajes',
    nombre: 'Membresía Spa & Masajes Corporales',
    categoria: 'Masajes',
    descripcion: 'Sesiones de masajes descontracturantes, piedras calientes, drenaje linfático manual y aromaterapia.',
    estampitasRequeridas: 6,
    recompensaTitulo: '1 Sesión Masaje Descontracturante & Aromaterapia Gratis',
    tipoPremio: 'servicio_gratis',
    valorPremio: 100,
    validezDias: 60,
    colorTema: 'emerald',
    icono: '🌿',
    activa: true,
    fechaCreacion: '2026-02-01',
  },
  {
    id: 'card-vip',
    nombre: 'Club VIP Platino Multiespecialidad',
    categoria: 'Todas',
    descripcion: 'Membresía integral de alta gama aplicable a cualquier especialidad médica/estética o compras cosmecéuticas.',
    estampitasRequeridas: 10,
    recompensaTitulo: '$25.000 de Crédito en Cualquier Tratamiento o Tienda',
    tipoPremio: 'monto_fijo',
    valorPremio: 25000,
    validezDias: 90,
    colorTema: 'dark',
    icono: '👑',
    activa: true,
    fechaCreacion: '2026-01-01',
  },
];

// Tarjetas iniciales de prueba con progreso por especialidad
const TARJETAS_INICIALES: Record<number, TarjetaClienteLocal> = {
  101: {
    clienteId: 101,
    clienteNombre: 'Carla Gómez',
    estampitasActuales: 7,
    estampitasRequeridas: 10,
    totalCanjeadas: 2,
    ultimaActualizacion: '2026-11-02 11:30',
    progresosPorTipo: {
      'card-unas': { tipoId: 'card-unas', estampitasActuales: 4, totalCanjeadas: 1 }, // 4/5 para esmaltado gratis!
      'card-facial': { tipoId: 'card-facial', estampitasActuales: 6, totalCanjeadas: 1 }, // 6/8
      'card-masajes': { tipoId: 'card-masajes', estampitasActuales: 2, totalCanjeadas: 0 }, // 2/6
      'card-vip': { tipoId: 'card-vip', estampitasActuales: 3, totalCanjeadas: 0 }, // 3/10
    },
    historial: [
      { fecha: '2026-10-10', servicio: 'Higiene Facial', profesional: 'María González', estampitasSumadas: 1, tarjetaId: 'card-facial', tarjetaNombre: 'Membresía Facial & Dermoestética' },
      { fecha: '2026-10-24', servicio: 'Esmaltado Semipermanente', profesional: 'Luciana Gómez', estampitasSumadas: 1, tarjetaId: 'card-unas', tarjetaNombre: 'Membresía Uñas & Manicuría' },
      { fecha: '2026-11-02', servicio: 'Limpieza Facial Profunda', profesional: 'María González', estampitasSumadas: 1, tarjetaId: 'card-facial', tarjetaNombre: 'Membresía Facial & Dermoestética' },
    ],
  },
  102: {
    clienteId: 102,
    clienteNombre: 'Luciana Martínez',
    estampitasActuales: 5,
    estampitasRequeridas: 10,
    totalCanjeadas: 0,
    ultimaActualizacion: '2026-11-01 16:00',
    progresosPorTipo: {
      'card-unas': { tipoId: 'card-unas', estampitasActuales: 2, totalCanjeadas: 0 },
      'card-facial': { tipoId: 'card-facial', estampitasActuales: 5, totalCanjeadas: 0 },
      'card-masajes': { tipoId: 'card-masajes', estampitasActuales: 1, totalCanjeadas: 0 },
      'card-vip': { tipoId: 'card-vip', estampitasActuales: 2, totalCanjeadas: 0 },
    },
    historial: [
      { fecha: '2026-11-01', servicio: 'Peeling Químico', profesional: 'María González', estampitasSumadas: 1, tarjetaId: 'card-facial', tarjetaNombre: 'Membresía Facial & Dermoestética' },
    ],
  },
  103: {
    clienteId: 103,
    clienteNombre: 'Mariana Benítez',
    estampitasActuales: 3,
    estampitasRequeridas: 10,
    totalCanjeadas: 0,
    ultimaActualizacion: '2026-10-30 14:15',
    progresosPorTipo: {
      'card-unas': { tipoId: 'card-unas', estampitasActuales: 1, totalCanjeadas: 0 },
      'card-facial': { tipoId: 'card-facial', estampitasActuales: 3, totalCanjeadas: 0 },
      'card-masajes': { tipoId: 'card-masajes', estampitasActuales: 4, totalCanjeadas: 0 }, // 4/6
      'card-vip': { tipoId: 'card-vip', estampitasActuales: 1, totalCanjeadas: 0 },
    },
    historial: [
      { fecha: '2026-10-30', servicio: 'Radiofrecuencia Tripolar', profesional: 'María González', estampitasSumadas: 1, tarjetaId: 'card-facial', tarjetaNombre: 'Membresía Facial & Dermoestética' },
    ],
  },
  104: {
    clienteId: 104,
    clienteNombre: 'Sofía Romero',
    estampitasActuales: 1,
    estampitasRequeridas: 10,
    totalCanjeadas: 0,
    ultimaActualizacion: '2026-10-24 17:00',
    progresosPorTipo: {
      'card-unas': { tipoId: 'card-unas', estampitasActuales: 0, totalCanjeadas: 0 },
      'card-facial': { tipoId: 'card-facial', estampitasActuales: 1, totalCanjeadas: 0 },
      'card-masajes': { tipoId: 'card-masajes', estampitasActuales: 0, totalCanjeadas: 0 },
      'card-vip': { tipoId: 'card-vip', estampitasActuales: 0, totalCanjeadas: 0 },
    },
    historial: [
      { fecha: '2026-10-24', servicio: 'Higiene Dérmica Inicial', profesional: 'María González', estampitasSumadas: 1, tarjetaId: 'card-facial', tarjetaNombre: 'Membresía Facial & Dermoestética' },
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
  tarjetaTipoIdAsignada: 'card-facial',
};

export const lealtadService = {
  // ── 1. GESTIÓN DE TIPOS DE TARJETAS DE MEMBRESÍA ──

  getTiposTarjetas: (): TipoTarjetaMembresia[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TIPOS_TARJETAS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo tipos de tarjetas:', e);
    }
    // Guardar predeterminados
    try {
      localStorage.setItem(STORAGE_KEY_TIPOS_TARJETAS, JSON.stringify(TIPOS_TARJETAS_PREDETERMINADOS));
    } catch {}
    return TIPOS_TARJETAS_PREDETERMINADOS;
  },

  getTipoTarjeta: (id: string): TipoTarjetaMembresia | undefined => {
    const tipos = lealtadService.getTiposTarjetas();
    return tipos.find(t => t.id === id);
  },

  guardarTipoTarjeta: (tipo: Partial<TipoTarjetaMembresia>): TipoTarjetaMembresia => {
    const tipos = lealtadService.getTiposTarjetas();
    const id = tipo.id || `card-${Date.now()}`;
    const existenteIdx = tipos.findIndex(t => t.id === id);

    const tarjetaGuardada: TipoTarjetaMembresia = {
      id,
      nombre: tipo.nombre?.trim() || 'Nueva Membresía',
      categoria: tipo.categoria || 'Facial',
      descripcion: tipo.descripcion?.trim() || 'Acumulá visitas y disfrutá beneficios exclusivos.',
      estampitasRequeridas: Math.max(3, Math.min(20, tipo.estampitasRequeridas || 6)),
      recompensaTitulo: tipo.recompensaTitulo?.trim() || 'Descuento Especial',
      tipoPremio: tipo.tipoPremio || 'porcentaje',
      valorPremio: tipo.valorPremio || 20,
      validezDias: tipo.validezDias || 45,
      colorTema: tipo.colorTema || 'wine',
      icono: tipo.icono || '✨',
      activa: tipo.activa ?? true,
      fechaCreacion: tipo.fechaCreacion || new Date().toISOString().split('T')[0],
    };

    let actualizadas: TipoTarjetaMembresia[];
    if (existenteIdx >= 0) {
      actualizadas = [...tipos];
      actualizadas[existenteIdx] = tarjetaGuardada;
    } else {
      actualizadas = [...tipos, tarjetaGuardada];
    }

    try {
      localStorage.setItem(STORAGE_KEY_TIPOS_TARJETAS, JSON.stringify(actualizadas));
    } catch (e) {
      console.error('Error guardando tipo de tarjeta:', e);
    }

    window.dispatchEvent(new CustomEvent(EVENTO_TIPOS_TARJETAS_ACTUALIZADOS, { detail: tarjetaGuardada }));
    return tarjetaGuardada;
  },

  eliminarTipoTarjeta: (id: string): boolean => {
    const tipos = lealtadService.getTiposTarjetas();
    const filtradas = tipos.filter(t => t.id !== id);
    if (filtradas.length === tipos.length) return false;

    try {
      localStorage.setItem(STORAGE_KEY_TIPOS_TARJETAS, JSON.stringify(filtradas));
    } catch {}

    window.dispatchEvent(new CustomEvent(EVENTO_TIPOS_TARJETAS_ACTUALIZADOS, { detail: { id, deleted: true } }));
    return true;
  },

  toggleActivarTipoTarjeta: (id: string): boolean => {
    const tipos = lealtadService.getTiposTarjetas();
    const idx = tipos.findIndex(t => t.id === id);
    if (idx === -1) return false;

    tipos[idx].activa = !tipos[idx].activa;
    try {
      localStorage.setItem(STORAGE_KEY_TIPOS_TARJETAS, JSON.stringify(tipos));
    } catch {}

    window.dispatchEvent(new CustomEvent(EVENTO_TIPOS_TARJETAS_ACTUALIZADOS, { detail: tipos[idx] }));
    return tipos[idx].activa;
  },

  restablecerTiposTarjetas: (): TipoTarjetaMembresia[] => {
    try {
      localStorage.setItem(STORAGE_KEY_TIPOS_TARJETAS, JSON.stringify(TIPOS_TARJETAS_PREDETERMINADOS));
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENTO_TIPOS_TARJETAS_ACTUALIZADOS));
    return TIPOS_TARJETAS_PREDETERMINADOS;
  },

  // Deduce automáticamente la tarjeta de membresía adecuada según el nombre o categoría del servicio
  determinarTipoTarjetaParaServicio: (servicioNombre: string): TipoTarjetaMembresia => {
    const tipos = lealtadService.getTiposTarjetas().filter(t => t.activa);
    const s = servicioNombre.toLowerCase();

    // 1. Uñas / Manicuría / Pedicuría / Kapping
    if (
      s.includes('uña') ||
      s.includes('manic') ||
      s.includes('pedic') ||
      s.includes('semi') ||
      s.includes('kapping') ||
      s.includes('esmalte') ||
      s.includes('soft gel')
    ) {
      const match = tipos.find(t => t.categoria === 'Uñas');
      if (match) return match;
    }

    // 2. Facial / Limpiezas / Dermo
    if (
      s.includes('facial') ||
      s.includes('cut') ||
      s.includes('peeling') ||
      s.includes('derm') ||
      s.includes('diamante') ||
      s.includes('higiene') ||
      s.includes('limpieza') ||
      s.includes('glow')
    ) {
      const match = tipos.find(t => t.categoria === 'Facial');
      if (match) return match;
    }

    // 3. Masajes & Spa
    if (
      s.includes('masaje') ||
      s.includes('spa') ||
      s.includes('piedras') ||
      s.includes('relaj') ||
      s.includes('descontracturante') ||
      s.includes('aromaterapia')
    ) {
      const match = tipos.find(t => t.categoria === 'Masajes');
      if (match) return match;
    }

    // 4. Corporal
    if (s.includes('corporal') || s.includes('reductor') || s.includes('drenaje') || s.includes('modelador')) {
      const match = tipos.find(t => t.categoria === 'Corporal' || t.categoria === 'Masajes');
      if (match) return match;
    }

    // 5. Pestañas / Cejas
    if (s.includes('pestaña') || s.includes('ceja') || s.includes('lash') || s.includes('lifting')) {
      const match = tipos.find(t => t.categoria === 'Pestañas/Cejas');
      if (match) return match;
    }

    // 6. VIP o Primera activa
    return tipos.find(t => t.categoria === 'Todas') || tipos[0] || TIPOS_TARJETAS_PREDETERMINADOS[0];
  },

  // ── 2. SOLICITUDES Y FLUJO DE ESTAMPITAS QR ──

  getSolicitudes: (): SolicitudEstampitaQr[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SOLICITUDES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error leyendo solicitudes de QR de lealtad:', e);
    }
    localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify([SOLICITUD_INICIAL_DEMO]));
    return [SOLICITUD_INICIAL_DEMO];
  },

  getPendientes: (): SolicitudEstampitaQr[] => {
    const list = lealtadService.getSolicitudes();
    return list.filter(s => s.estado === 'pendiente');
  },

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
    tarjetaTipoId?: string;
  }): SolicitudEstampitaQr => {
    const solicitudes = lealtadService.getSolicitudes();

    const existente = solicitudes.find(
      s => s.turnoId === datos.turnoId && s.estado === 'pendiente'
    );
    if (existente) {
      return existente;
    }

    const tipoTarjeta = datos.tarjetaTipoId
      ? lealtadService.getTipoTarjeta(datos.tarjetaTipoId)
      : lealtadService.determinarTipoTarjetaParaServicio(datos.servicioNombre);

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
      tarjetaTipoIdAsignada: tipoTarjeta?.id || 'card-facial',
    };

    const actualizadas = [nueva, ...solicitudes];
    try {
      localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(actualizadas));
    } catch (e) {
      console.error('Error guardando nueva solicitud de QR:', e);
    }

    window.dispatchEvent(
      new CustomEvent(EVENTO_QR_SOLICITUD_CREADA, { detail: nueva })
    );

    return nueva;
  },

  acreditarQr: (
    codigoOId: string,
    adminNombre: string = 'Administrador',
    tipoTarjetaIdOverride?: string
  ): {
    exito: boolean;
    mensaje: string;
    solicitud?: SolicitudEstampitaQr;
    tarjetaActualizada?: TarjetaClienteLocal;
    premioAlcanzado?: boolean;
    tipoTarjeta?: TipoTarjetaMembresia;
    estampitasActualesTarjeta?: number;
    estampitasRequeridasTarjeta?: number;
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

    // Acreditar estampita en la tarjeta correspondiente
    const tarjetas = lealtadService.getTarjetas();
    const clienteId = sol.clienteId || 101;
    const tarjeta = tarjetas[clienteId] || lealtadService.getTarjetaCliente(clienteId, sol.clienteNombre);

    // Determinar qué tipo de tarjeta recibe la estampita
    const tipoId = tipoTarjetaIdOverride || sol.tarjetaTipoIdAsignada || lealtadService.determinarTipoTarjetaParaServicio(sol.servicioNombre).id;
    const tipoTarjeta = lealtadService.getTipoTarjeta(tipoId) || lealtadService.determinarTipoTarjetaParaServicio(sol.servicioNombre);

    // Inicializar mapa de progresos si falta
    if (!tarjeta.progresosPorTipo) {
      tarjeta.progresosPorTipo = {};
    }
    if (!tarjeta.progresosPorTipo[tipoTarjeta.id]) {
      tarjeta.progresosPorTipo[tipoTarjeta.id] = {
        tipoId: tipoTarjeta.id,
        estampitasActuales: 0,
        totalCanjeadas: 0,
      };
    }

    // Sumar estampita en la tarjeta específica
    const progreso = tarjeta.progresosPorTipo[tipoTarjeta.id];
    progreso.estampitasActuales += 1;
    progreso.ultimaAcreditacion = new Date().toLocaleString('es-AR');

    // Sumar en total general
    tarjeta.estampitasActuales = (tarjeta.estampitasActuales || 0) + 1;
    tarjeta.ultimaActualizacion = new Date().toLocaleString('es-AR');
    tarjeta.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      servicio: sol.servicioNombre,
      profesional: sol.profesionalNombre,
      estampitasSumadas: 1,
      tarjetaId: tipoTarjeta.id,
      tarjetaNombre: tipoTarjeta.nombre,
    });

    let premioAlcanzado = false;
    if (progreso.estampitasActuales >= tipoTarjeta.estampitasRequeridas) {
      premioAlcanzado = true;
      progreso.totalCanjeadas += 1;
      tarjeta.totalCanjeadas = (tarjeta.totalCanjeadas || 0) + 1;
    }

    tarjetas[clienteId] = tarjeta;
    try {
      localStorage.setItem(STORAGE_KEY_TARJETAS, JSON.stringify(tarjetas));
    } catch {}

    window.dispatchEvent(
      new CustomEvent(EVENTO_ESTAMPITA_ACREDITADA, {
        detail: {
          solicitud: sol,
          tarjeta,
          premioAlcanzado,
          tipoTarjeta,
          progreso,
        },
      })
    );

    return {
      exito: true,
      mensaje: `¡Estampita acreditada a ${sol.clienteNombre}! Progreso en ${tipoTarjeta.nombre}: ${progreso.estampitasActuales} de ${tipoTarjeta.estampitasRequeridas} sellos.`,
      solicitud: sol,
      tarjetaActualizada: tarjeta,
      premioAlcanzado,
      tipoTarjeta,
      estampitasActualesTarjeta: progreso.estampitasActuales,
      estampitasRequeridasTarjeta: tipoTarjeta.estampitasRequeridas,
    };
  },

  // Acreditación directa desde mostrador / modal administrativo
  acreditarEstampitaDirecta: (
    clienteId: number,
    tipoTarjetaId: string,
    servicioNombre: string = 'Servicio Presencial',
    profesionalNombre: string = 'Recepción',
    adminNombre: string = 'Administrador'
  ): {
    exito: boolean;
    mensaje: string;
    tarjetaActualizada: TarjetaClienteLocal;
    premioAlcanzado: boolean;
    tipoTarjeta: TipoTarjetaMembresia;
  } => {
    const tarjetas = lealtadService.getTarjetas();
    const tarjeta = tarjetas[clienteId] || lealtadService.getTarjetaCliente(clienteId);
    const tipoTarjeta = lealtadService.getTipoTarjeta(tipoTarjetaId) || lealtadService.getTiposTarjetas()[0];

    if (!tarjeta.progresosPorTipo) tarjeta.progresosPorTipo = {};
    if (!tarjeta.progresosPorTipo[tipoTarjeta.id]) {
      tarjeta.progresosPorTipo[tipoTarjeta.id] = {
        tipoId: tipoTarjeta.id,
        estampitasActuales: 0,
        totalCanjeadas: 0,
      };
    }

    const progreso = tarjeta.progresosPorTipo[tipoTarjeta.id];
    progreso.estampitasActuales += 1;
    progreso.ultimaAcreditacion = new Date().toLocaleString('es-AR');

    tarjeta.estampitasActuales = (tarjeta.estampitasActuales || 0) + 1;
    tarjeta.ultimaActualizacion = new Date().toLocaleString('es-AR');
    tarjeta.historial.unshift({
      fecha: new Date().toISOString().split('T')[0],
      servicio: `${servicioNombre} (${adminNombre})`,
      profesional: profesionalNombre,
      estampitasSumadas: 1,
      tarjetaId: tipoTarjeta.id,
      tarjetaNombre: tipoTarjeta.nombre,
    });

    let premioAlcanzado = false;
    if (progreso.estampitasActuales >= tipoTarjeta.estampitasRequeridas) {
      premioAlcanzado = true;
      progreso.totalCanjeadas += 1;
      tarjeta.totalCanjeadas = (tarjeta.totalCanjeadas || 0) + 1;
    }

    tarjetas[clienteId] = tarjeta;
    try {
      localStorage.setItem(STORAGE_KEY_TARJETAS, JSON.stringify(tarjetas));
    } catch {}

    window.dispatchEvent(
      new CustomEvent(EVENTO_ESTAMPITA_ACREDITADA, {
        detail: {
          tarjeta,
          premioAlcanzado,
          tipoTarjeta,
          progreso,
        },
      })
    );

    return {
      exito: true,
      mensaje: `¡Estampita acreditada a ${tarjeta.clienteNombre}! Ahora tiene ${progreso.estampitasActuales}/${tipoTarjeta.estampitasRequeridas} en "${tipoTarjeta.nombre}".`,
      tarjetaActualizada: tarjeta,
      premioAlcanzado,
      tipoTarjeta,
    };
  },

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

  getTarjetaCliente: (clienteId: number | string = 101, fallbackNombre?: string): TarjetaClienteLocal => {
    const numId = Number(clienteId) || 101;
    const tarjetas = lealtadService.getTarjetas();
    if (tarjetas[numId]) {
      // Asegurar que tenga progresosPorTipo inicializados
      const t = tarjetas[numId];
      if (!t.progresosPorTipo) {
        t.progresosPorTipo = {
          'card-unas': { tipoId: 'card-unas', estampitasActuales: Math.min(3, t.estampitasActuales || 0), totalCanjeadas: 0 },
          'card-facial': { tipoId: 'card-facial', estampitasActuales: t.estampitasActuales || 0, totalCanjeadas: t.totalCanjeadas || 0 },
        };
      }
      return t;
    }

    const nueva: TarjetaClienteLocal = {
      clienteId: numId,
      clienteNombre: fallbackNombre || 'Cliente Estética',
      estampitasActuales: 0,
      estampitasRequeridas: 10,
      totalCanjeadas: 0,
      ultimaActualizacion: new Date().toLocaleString('es-AR'),
      progresosPorTipo: {
        'card-unas': { tipoId: 'card-unas', estampitasActuales: 0, totalCanjeadas: 0 },
        'card-facial': { tipoId: 'card-facial', estampitasActuales: 0, totalCanjeadas: 0 },
        'card-masajes': { tipoId: 'card-masajes', estampitasActuales: 0, totalCanjeadas: 0 },
        'card-vip': { tipoId: 'card-vip', estampitasActuales: 0, totalCanjeadas: 0 },
      },
      historial: [],
    };
    tarjetas[numId] = nueva;
    try {
      localStorage.setItem(STORAGE_KEY_TARJETAS, JSON.stringify(tarjetas));
    } catch {}
    return nueva;
  },

  cancelarSolicitud: (solicitudId: string) => {
    const list = lealtadService.getSolicitudes();
    const act = list.map(s => (s.id === solicitudId ? { ...s, estado: 'cancelado' as const } : s));
    try {
      localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(act));
    } catch {}
    window.dispatchEvent(new CustomEvent('estetica_qr_solicitud_actualizada'));
  },
};
