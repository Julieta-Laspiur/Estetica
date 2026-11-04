/**
 * Servicio para gestionar el Perfil del Cliente, edición de datos personales,
 * foto de perfil, ficha estética, preferencias y notas de salud.
 */
import { authApi, type AuthUser, usuariosApi } from './api';

export interface PerfilClienteCompleto {
  usuarioId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fotoUrl?: string;
  fechaNacimiento?: string;
  dni?: string;
  direccion?: string;
  ciudad?: string;
  // Ficha estética y preferencias
  tipoPiel: 'Normal' | 'Seca' | 'Grasa' | 'Mixta' | 'Sensible' | 'Madura' | '';
  alergias: string;
  interesesTratamientos: string[];
  notasEspeciales: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
}

const STORAGE_PREFIX = 'estetica_perfil_cliente_';

export const TRATAMIENTOS_DISPONIBLES = [
  'Limpieza Facial & Dermoestética',
  'Manicuría & Pedicuría Spa',
  'Masajes Descontracturantes',
  'Drenaje Linfático Manual',
  'Lifting de Pestañas & Cejas',
  'Peeling Químico & Nutrición',
  'Tratamientos Corporales Reductores',
  'Depilación & Cuidado de la Piel',
];

export const clientePerfilService = {
  getPerfil: (usuario?: AuthUser | null): PerfilClienteCompleto => {
    const id = usuario?.usuarioId || 101;
    const storageKey = `${STORAGE_PREFIX}${id}`;
    
    // Valores base con datos de la sesión actual
    const defaultData: PerfilClienteCompleto = {
      usuarioId: id,
      nombre: usuario?.nombre || 'Carla',
      apellido: usuario?.apellido || 'Gómez',
      email: usuario?.email || 'carla.gomez@gmail.com',
      telefono: usuario?.telefono || '+54 9 11 5824-9120',
      fotoUrl: usuario?.fotoUrl || '',
      fechaNacimiento: usuario?.fechaNacimiento || '1994-06-18',
      dni: '38.452.918',
      direccion: usuario?.direccion || 'Av. Santa Fe 2480, Piso 4 B',
      ciudad: 'Palermo, CABA',
      tipoPiel: 'Mixta',
      alergias: 'Sensibilidad a fragancias fuertes artificiales y alfahidroxiácidos de alta concentración.',
      interesesTratamientos: [
        'Limpieza Facial & Dermoestética',
        'Manicuría & Pedicuría Spa',
        'Masajes Descontracturantes',
      ],
      notasEspeciales: 'Uso protector solar FPS 50 diario. Preferencia por turnos por la tarde después de las 16hs.',
      contactoEmergenciaNombre: 'Esteban Gómez',
      contactoEmergenciaTelefono: '+54 9 11 4410-2399',
    };

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultData,
          ...parsed,
          // Mantener sincronizados nombre y email si vienen en usuario activo
          nombre: usuario?.nombre || parsed.nombre || defaultData.nombre,
          apellido: usuario?.apellido || parsed.apellido || defaultData.apellido,
          email: usuario?.email || parsed.email || defaultData.email,
        };
      }
    } catch (e) {
      console.warn('Error leyendo perfil de cliente:', e);
    }

    return defaultData;
  },

  guardarPerfil: async (perfil: PerfilClienteCompleto): Promise<PerfilClienteCompleto> => {
    const storageKey = `${STORAGE_PREFIX}${perfil.usuarioId}`;

    // 1. Guardar en localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(perfil));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }

    // 2. Actualizar sesión global (AuthUser) para que el navbar y headers reflejen el cambio
    authApi.updateCurrentUser({
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      telefono: perfil.telefono,
      fotoUrl: perfil.fotoUrl,
      direccion: perfil.direccion,
      fechaNacimiento: perfil.fechaNacimiento,
    });

    // 3. Notificar a backend si está conectado
    try {
      if (perfil.usuarioId && authApi.isAuthenticated()) {
        await usuariosApi.actualizarPerfil({
          usuarioId: perfil.usuarioId,
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          telefono: perfil.telefono,
        });
      }
    } catch (err) {
      console.warn('Backend API no disponible para persistencia de perfil, guardado localmente:', err);
    }

    // Disparar evento personalizado para actualizar componentes escuchando
    window.dispatchEvent(new CustomEvent('estetica_perfil_cliente_actualizado', { detail: perfil }));

    return perfil;
  },

  procesarArchivoADataUrl: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('El archivo debe ser una imagen'));
        return;
      }

      // Validar tamaño máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('La imagen no debe superar los 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
      reader.readAsDataURL(file);
    });
  },
};
