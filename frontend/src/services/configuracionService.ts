// Servicio de Configuración General del Centro Estético
// Persiste en localStorage y emite eventos para sincronización en tiempo real

export interface ConfiguracionGeneral {
  // 1. Identidad y Datos del Centro
  nombreCentro: string;
  slogan: string;
  logoUrl?: string; // Compatibilidad hacia atrás
  logoRectangularUrl?: string; // Logo rectangular / horizontal de la cabecera superior
  logoRedondoUrl?: string; // Logo redondo / circular del costado al comprimirse la barra
  telefono: string;
  whatsapp: string;
  email: string;
  direccion: string;
  ciudad: string;
  googleMapsUrl?: string;
  instagram: string;
  facebook: string;
  tiktok: string;

  // 2. Horarios y Reglas de Turnos
  horarioSemana: string; // ej. "09:00 - 20:00"
  horarioSabados: string; // ej. "09:00 - 18:00"
  atiendeDomingos: boolean;
  horarioDomingos: string; // ej. "10:00 - 15:00" o "Cerrado"
  intervaloLimpiezaMin: number; // Intervalo de sanitización/buffer (ej. 15 min)
  anticipacionMinimaHoras: number; // ej. 2 horas antes
  anticipacionMaximaDias: number; // ej. 30 días a futuro
  toleranciaEsperaMin: number; // ej. 15 min de tolerancia no-show

  // 3. Políticas de Cancelación y Reembolsos
  horasCancelacionSinCargo: number; // ej. 24 hs
  politicaCancelacionTexto: string; // Texto legal visible al cliente
  sinReembolsoPasadas24h: boolean;
  minutosVencimientoReservaPendiente: number; // ej. 30 min para pagar con MP

  // 4. Pasarelas de Pago y Cobranzas
  mercadoPagoHabilitado: boolean;
  mercadoPagoModo: 'sandbox' | 'produccion';
  mercadoPagoPublicKey: string;
  mercadoPagoAccessToken: string;
  cuotasSinInteres: number; // ej. 3, 6
  
  efectivoHabilitado: boolean;
  descuentoEfectivoPorcentaje: number; // ej. 10% OFF en mostrador

  transferenciaHabilitada: boolean;
  transferenciaBanco: string;
  transferenciaTitular: string;
  transferenciaCuit: string;
  transferenciaCbuCvu: string;
  transferenciaAlias: string;
  transferenciaWhatsappComprobante: string;

  // 5. Tienda Online y Envíos
  montoEnvioGratis: number; // ej. 15000
  costoEnvioEstandar: number; // ej. 1500
  retiroEnLocalHabilitado: boolean;
  alertaStockBajoUnidades: number; // ej. 3

  // 6. Programa de Fidelización (Estampitas)
  estampitasParaRecompensa: number; // ej. 6 sellos
  recompensaTitulo: string; // ej. "Tratamiento Facial Express o $5.000 OFF"
  validezCuponDias: number; // ej. 60 días
  estampitaPorCompraMonto: number; // ej. 1 estampita cada $10.000

  // 7. Banner Promocional y Personalización Web
  bannerPromocional: {
    activo: boolean;
    texto: string;
    textoBoton?: string;
    seccionDestino?: string; // 'reservar' | 'productos' | 'servicios'
    colorFondo: string; // '#7A3B3B' | '#3C3530' | '#B45309' | '#047857'
  };
  bannerHero: {
    imagenUrl: string;
    tag: string;
    titulo: string;
    subtitulo: string;
    cta: string;
    ctaTarget: string; // 'reservar' | 'servicios' | 'productos' | 'lealtad'
  };
  mensajeHeroBienvenida: {
    titulo: string;
    subtitulo: string;
  };
  modoMantenimiento: boolean;
  mensajeMantenimiento?: string;

  // 8. Inteligencia Artificial & Chatbot (Google Gemini)
  geminiApiKey?: string;
  geminiModel?: string;
  geminiHabilitado?: boolean;
  geminiTemperatura?: number;

  // Auditoría
  ultimaActualizacion?: string;
  actualizadoPor?: string;
}

export const procesarArchivoAUrl = (archivo: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo procesar la imagen'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(archivo);
  });
};

export const CONFIGURACION_DEFAULT: ConfiguracionGeneral = {
  nombreCentro: 'Centro Estético',
  slogan: 'Tu santuario de belleza, cuidado dérmico y bienestar integral',
  logoUrl: '',
  logoRectangularUrl: '',
  logoRedondoUrl: '',
  telefono: '+54 11 4820-9900',
  whatsapp: '+54 9 11 2345-6789',
  email: 'contacto@centroestetico.com',
  direccion: 'Av. Santa Fe 1840, Piso 2, Recoleta',
  ciudad: 'Ciudad Autónoma de Buenos Aires',
  googleMapsUrl: 'https://maps.google.com/?q=Av.+Santa+Fe+1840',
  instagram: '@estetica.bienestar',
  facebook: 'CentroEsteticoOficial',
  tiktok: '@estetica.tips',

  horarioSemana: '09:00 - 20:00',
  horarioSabados: '09:00 - 18:00',
  atiendeDomingos: false,
  horarioDomingos: 'Cerrado',
  intervaloLimpiezaMin: 15,
  anticipacionMinimaHoras: 2,
  anticipacionMaximaDias: 45,
  toleranciaEsperaMin: 15,

  horasCancelacionSinCargo: 24,
  politicaCancelacionTexto: 'Aviso con más de 24 hs de anticipación para reprogramar o cancelar sin costo. Pasado este plazo no se realizan reembolsos de la reserva.',
  sinReembolsoPasadas24h: true,
  minutosVencimientoReservaPendiente: 30,

  mercadoPagoHabilitado: true,
  mercadoPagoModo: 'sandbox',
  mercadoPagoPublicKey: 'TEST-33924701-a18c-449e-bdf1-030ec6060c1d',
  mercadoPagoAccessToken: 'TEST-4882199042940822-110309-88065fbd7e4ba398246bc6ce1ba395f1-33924701',
  cuotasSinInteres: 3,

  efectivoHabilitado: true,
  descuentoEfectivoPorcentaje: 10,

  transferenciaHabilitada: true,
  transferenciaBanco: 'Banco Santander Río',
  transferenciaTitular: 'Centro Estético S.R.L.',
  transferenciaCuit: '30-71649281-9',
  transferenciaCbuCvu: '0720182620000000948215',
  transferenciaAlias: 'ESTETICA.BIENESTAR.MP',
  transferenciaWhatsappComprobante: '+54 9 11 2345-6789',

  montoEnvioGratis: 15000,
  costoEnvioEstandar: 1200,
  retiroEnLocalHabilitado: true,
  alertaStockBajoUnidades: 3,

  estampitasParaRecompensa: 6,
  recompensaTitulo: 'Tratamiento Facial Express o $5.000 OFF en Tienda',
  validezCuponDias: 60,
  estampitaPorCompraMonto: 10000,

  bannerPromocional: {
    activo: true,
    texto: '✨ 20% OFF en tu primer tratamiento de Peeling Facial de la temporada · ¡Reservá tu turno online!',
    textoBoton: 'Reservar Turno',
    seccionDestino: 'reservar',
    colorFondo: '#7A3B3B',
  },
  bannerHero: {
    imagenUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
    tag: 'Promoción Especial',
    titulo: '30% OFF en Faciales Hidratantes',
    subtitulo: 'Durante todo este mes. Reservá tu turno y aprovechá el cuidado exclusivo de tu piel.',
    cta: 'Reservar Ahora',
    ctaTarget: 'reservar',
  },
  mensajeHeroBienvenida: {
    titulo: 'Cuidado profesional para realzar tu belleza natural',
    subtitulo: 'Tratamientos faciales, corporales y masajes diseñados a tu medida con aparatología de última generación.',
  },
  modoMantenimiento: false,
  mensajeMantenimiento: 'Estamos actualizando nuestro sistema de reservas. Volvemos en unos minutos.',

  // 8. Inteligencia Artificial & Chatbot (Google Gemini)
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  geminiHabilitado: false,
  geminiTemperatura: 0.3,

  ultimaActualizacion: new Date().toISOString(),
  actualizadoPor: 'Administrador General',
};

const STORAGE_KEY = 'estetica_config_general';
export const EVENTO_CONFIG_ACTUALIZADA = 'estetica_config_changed';

export const configuracionService = {
  get: (): ConfiguracionGeneral => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...CONFIGURACION_DEFAULT,
          ...parsed,
          logoRectangularUrl: parsed.logoRectangularUrl || parsed.logoUrl || '',
          logoRedondoUrl: parsed.logoRedondoUrl || parsed.logoUrl || '',
          bannerPromocional: {
            ...CONFIGURACION_DEFAULT.bannerPromocional,
            ...(parsed.bannerPromocional || {}),
          },
          bannerHero: {
            ...CONFIGURACION_DEFAULT.bannerHero,
            ...(parsed.bannerHero || {}),
          },
          mensajeHeroBienvenida: {
            ...CONFIGURACION_DEFAULT.mensajeHeroBienvenida,
            ...(parsed.mensajeHeroBienvenida || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Error leyendo configuración general:', e);
    }
    return { ...CONFIGURACION_DEFAULT };
  },

  save: (nuevaConfig: ConfiguracionGeneral, usuarioNombre: string = 'Administrador'): ConfiguracionGeneral => {
    const configCompleta: ConfiguracionGeneral = {
      ...nuevaConfig,
      ultimaActualizacion: new Date().toISOString(),
      actualizadoPor: usuarioNombre,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configCompleta));
      // Emitir evento global para que la Navbar y otros componentes se actualicen reactivamente
      window.dispatchEvent(
        new CustomEvent(EVENTO_CONFIG_ACTUALIZADA, { detail: configCompleta })
      );
    } catch (e) {
      console.error('Error guardando configuración:', e);
    }
    return configCompleta;
  },

  reset: (usuarioNombre: string = 'Administrador'): ConfiguracionGeneral => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    const configRestaurada = configuracionService.save({ ...CONFIGURACION_DEFAULT }, usuarioNombre);
    return configRestaurada;
  },

  exportarBackupJson: (): void => {
    const data = {
      version: '1.0',
      fechaExportacion: new Date().toISOString(),
      configuracion: configuracionService.get(),
      serviciosMeta: JSON.parse(localStorage.getItem('estetica_servicios_meta') || '{}'),
      pagosManuales: JSON.parse(localStorage.getItem('estetica_pagos_manuales') || '[]'),
      cierresCaja: JSON.parse(localStorage.getItem('estetica_cierres_caja') || '[]'),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_estetica_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
