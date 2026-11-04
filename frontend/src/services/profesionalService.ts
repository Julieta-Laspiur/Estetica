// Servicio para gestionar el Panel del Profesional, su perfil, agenda, atenciones y disponibilidad
import { procesarArchivoAUrl } from './configuracionService';

export interface PerfilProfesional {
  id: number;
  usuarioId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  whatsapp: string;
  especialidad: string;
  descripcion: string;
  fotoUrl: string;
  servicios: string[];
  horariosAtencion: string;
  cabinaHabitual: string;
  disponibilidad: 'Disponible' | 'En atención' | 'Pausado' | 'Ausente';
}

export interface AtencionSeguimiento {
  id: string;
  clienteId: number;
  clienteNombre: string;
  clienteEmail?: string;
  fecha: string;
  servicio: string;
  observaciones: string;
  recomendaciones: string;
  tipoPielTratado?: string;
  estampitaSumada?: boolean;
}

export interface ClienteProfesional {
  id: number;
  nombreCompleto: string;
  email: string;
  telefono: string;
  totalSesiones: number;
  ultimoTratamiento: string;
  ultimaFecha: string;
  notasImportantes?: string;
}

export interface NotificacionProfesional {
  id: string;
  titulo: string;
  mensaje: string;
  fechaHora: string;
  leida: boolean;
  tipo: 'turno_nuevo' | 'turno_cancelado' | 'recordatorio' | 'sistema';
}

const STORAGE_KEY_PERFIL = 'estetica_profesional_perfil';
const STORAGE_KEY_ATENCIONES = 'estetica_profesional_atenciones';
const STORAGE_KEY_NOTIFICACIONES = 'estetica_profesional_notificaciones';

const PERFIL_DEFAULT: PerfilProfesional = {
  id: 1,
  usuarioId: 2,
  nombre: 'María',
  apellido: 'González',
  email: 'maria.gonzalez@estetica.com',
  telefono: '+54 11 4820-9901',
  whatsapp: '+54 9 11 2345-6789',
  especialidad: 'Dermatocosmiatría & Estética Facial Avanzada',
  descripcion: 'Cosmiatra universitaria especializada en higiene cutánea profunda, peelings químicos magistrales, biolifting y rejuvenecimiento dérmico integral con aparatología de última generación. Con más de 8 años de trayectoria brindando armonía, luminosidad y salud dérmica a cada paciente.',
  fotoUrl: 'https://images.unsplash.com/photo-1594824813629-9e85375c3ef2?w=400&auto=format&fit=crop&q=80',
  servicios: [
    'Limpieza Facial Profunda con Punta de Diamante',
    'Peeling Químico Magistral & Ácido Hialurónico',
    'Radiofrecuencia Tripolar Facial y Escote',
    'Lifting de Pestañas y Perfilado de Cejas',
    'Drenaje Linfático Facial & Mascarilla Descongestiva',
    'Tratamiento Antiacné & Shock de Hidratación'
  ],
  horariosAtencion: 'Lunes a Viernes: 09:00 - 18:00 hs | Sábados: 09:00 - 14:00 hs',
  cabinaHabitual: 'Cabina 1 - Dermoestética & Cuidado Facial',
  disponibilidad: 'Disponible',
};

const ATENCIONES_DEFAULT: AtencionSeguimiento[] = [
  {
    id: 'at-1',
    clienteId: 101,
    clienteNombre: 'Carla Gómez',
    clienteEmail: 'carla.gomez@gmail.com',
    fecha: '2026-11-02 11:30',
    servicio: 'Limpieza Facial Profunda',
    observaciones: 'Piel mixta con leve deshidratación en mejillas. Se realizó extracción no invasiva con punta de diamante y alta frecuencia.',
    recomendaciones: 'Aplicar sérum hidratante con niacinamida por la noche y protector solar FPS 50 cada 3 horas.',
    tipoPielTratado: 'Mixta / Sensible',
    estampitaSumada: true,
  },
  {
    id: 'at-2',
    clienteId: 102,
    clienteNombre: 'Luciana Martínez',
    clienteEmail: 'luciana.m@hotmail.com',
    fecha: '2026-11-01 16:00',
    servicio: 'Peeling Químico Magistral',
    observaciones: 'Segunda sesión de ácido mandélico al 30%. Excelente tolerancia cutánea sin eritema residual marcado.',
    recomendaciones: 'Suspender exfoliantes físicos durante 7 días y evitar exposición solar directa.',
    tipoPielTratado: 'Grasa / Secuelas de Acné',
    estampitaSumada: true,
  },
  {
    id: 'at-3',
    clienteId: 103,
    clienteNombre: 'Mariana Benítez',
    clienteEmail: 'mbenitez@yahoo.com',
    fecha: '2026-10-30 14:15',
    servicio: 'Radiofrecuencia Tripolar Facial',
    observaciones: 'Tratamiento de óvalo facial y cuello. Se evidenció aumento de tensión y efecto glow inmediato.',
    recomendaciones: 'Ingerir abundante agua y continuar con crema emoliente nutritiva.',
    tipoPielTratado: 'Madura / Normal',
    estampitaSumada: true,
  },
];

const NOTIFICACIONES_DEFAULT: NotificacionProfesional[] = [
  {
    id: 'notif-1',
    titulo: 'Nuevo turno asignado',
    mensaje: 'Sofía Romero reservó Limpieza Facial Profunda para hoy a las 15:30 hs.',
    fechaHora: 'Hace 25 min',
    leida: false,
    tipo: 'turno_nuevo',
  },
  {
    id: 'notif-2',
    titulo: 'Turno confirmado',
    mensaje: 'Carla Gómez confirmó su asistencia para la sesión de mañana a las 10:00 hs.',
    fechaHora: 'Hace 2 horas',
    leida: false,
    tipo: 'recordatorio',
  },
  {
    id: 'notif-3',
    titulo: 'Mantenimiento de cabina finalizado',
    mensaje: 'Cabina 1 sanitizada y con recambio de sábanas descartables lista.',
    fechaHora: 'Hoy 08:30 hs',
    leida: true,
    tipo: 'sistema',
  },
];

export const profesionalService = {
  getPerfil: (usuario?: { nombre?: string; apellido?: string; email?: string } | null): PerfilProfesional => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PERFIL);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...PERFIL_DEFAULT, ...parsed };
      }
    } catch (e) {
      console.warn('Error leyendo perfil profesional de storage:', e);
    }

    if (usuario && (usuario.nombre || usuario.email)) {
      return {
        ...PERFIL_DEFAULT,
        nombre: usuario.nombre || PERFIL_DEFAULT.nombre,
        apellido: usuario.apellido || PERFIL_DEFAULT.apellido,
        email: usuario.email || PERFIL_DEFAULT.email,
      };
    }

    return { ...PERFIL_DEFAULT };
  },

  updatePerfil: (datos: Partial<PerfilProfesional>): PerfilProfesional => {
    const actual = profesionalService.getPerfil();
    const actualizado: PerfilProfesional = {
      ...actual,
      ...datos,
    };
    try {
      localStorage.setItem(STORAGE_KEY_PERFIL, JSON.stringify(actualizado));
      // Sincronizar también con usuario en sesión si aplica
      const userStr = localStorage.getItem('estetica_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (datos.nombre) u.nombre = datos.nombre;
        if (datos.apellido) u.apellido = datos.apellido;
        localStorage.setItem('estetica_user', JSON.stringify(u));
      }
    } catch (e) {
      console.error('Error guardando perfil profesional:', e);
    }
    return actualizado;
  },

  setDisponibilidad: (estado: 'Disponible' | 'En atención' | 'Pausado' | 'Ausente'): PerfilProfesional => {
    return profesionalService.updatePerfil({ disponibilidad: estado });
  },

  getAtenciones: (): AtencionSeguimiento[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ATENCIONES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return ATENCIONES_DEFAULT;
  },

  agregarAtencion: (nueva: Omit<AtencionSeguimiento, 'id'>): AtencionSeguimiento => {
    const atenciones = profesionalService.getAtenciones();
    const creada: AtencionSeguimiento = {
      ...nueva,
      id: `at-${Date.now()}`,
    };
    const listaActualizada = [creada, ...atenciones];
    try {
      localStorage.setItem(STORAGE_KEY_ATENCIONES, JSON.stringify(listaActualizada));
    } catch {}
    return creada;
  },

  getClientes: (): ClienteProfesional[] => {
    return [
      {
        id: 101,
        nombreCompleto: 'Carla Gómez',
        email: 'carla.gomez@gmail.com',
        telefono: '+54 9 11 5566-7788',
        totalSesiones: 4,
        ultimoTratamiento: 'Limpieza Facial Profunda',
        ultimaFecha: '2026-11-02',
        notasImportantes: 'Sensibilidad a fragancias intensas. Prefiere cremas descongestivas de manzanilla.',
      },
      {
        id: 102,
        nombreCompleto: 'Luciana Martínez',
        email: 'luciana.m@hotmail.com',
        telefono: '+54 9 11 4433-2211',
        totalSesiones: 6,
        ultimoTratamiento: 'Peeling Químico Magistral',
        ultimaFecha: '2026-11-01',
        notasImportantes: 'Tratamiento despigmentante activo. Siempre aplicar FPS 50 al finalizar.',
      },
      {
        id: 103,
        nombreCompleto: 'Mariana Benítez',
        email: 'mbenitez@yahoo.com',
        telefono: '+54 9 11 3322-1100',
        totalSesiones: 3,
        ultimoTratamiento: 'Radiofrecuencia Tripolar Facial',
        ultimaFecha: '2026-10-30',
        notasImportantes: 'Muy buena evolución cutánea. Busca mantener tono y elasticidad.',
      },
      {
        id: 104,
        nombreCompleto: 'Sofía Romero',
        email: 'sofia.romero@gmail.com',
        telefono: '+54 9 11 9988-7766',
        totalSesiones: 1,
        ultimoTratamiento: 'Higiene Dérmica Inicial',
        ultimaFecha: '2026-10-24',
        notasImportantes: 'Primera consulta. Piel mixta con tendencia a puntos negros en zona T.',
      },
    ];
  },

  getNotificaciones: (): NotificacionProfesional[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFICACIONES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return NOTIFICACIONES_DEFAULT;
  },

  marcarTodasNotificacionesLeidas: (): NotificacionProfesional[] => {
    const list = profesionalService.getNotificaciones().map(n => ({ ...n, leida: true }));
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICACIONES, JSON.stringify(list));
    } catch {}
    return list;
  },

  procesarFotoPerfil: procesarArchivoAUrl,
};
