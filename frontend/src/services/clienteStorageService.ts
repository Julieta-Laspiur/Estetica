/**
 * Servicio de almacenamiento y ciclo de vida de Carrito y Lista de Deseos por cliente.
 * 
 * Reglas de negocio (proyecto.md - HU-08 / RF-08):
 * 1. "Los carritos se eliminan luego de 10 días de inactividad." (línea 195)
 * 2. El carrito y la lista de deseos NO se borran al cerrar sesión; permanecen
 *    almacenados y asociados a la cuenta de cada cliente.
 * 3. Diferentes perfiles de clientes poseen almacenamiento estrictamente aislado
 *    (nunca se mezclan entre sí).
 */

import type { AuthUser } from './api';

// Constantes de expiración (HU-08: 10 días de inactividad)
export const DIAS_EXPIRACION_CARRITO = 10;
export const MS_EXPIRACION_CARRITO = DIAS_EXPIRACION_CARRITO * 24 * 60 * 60 * 1000; // 864.000.000 ms

export interface ProductoCarrito {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  cantidad: number;
  imagen: string;
}

export interface WishlistItem {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  imagenUrl?: string;
  descripcion?: string;
}

export interface CarritoPersistido {
  items: ProductoCarrito[];
  ultimaActividad: number; // Timestamp en milisegundos (Date.now())
}

/**
 * Genera la clave de almacenamiento exclusiva para cada usuario o invitado
 */
export const getStorageUserKey = (prefix: string, user?: AuthUser | null): string => {
  if (user?.usuarioId && user.usuarioId > 0) {
    return `${prefix}_user_${user.usuarioId}`;
  }
  if (user?.email) {
    const safeEmail = user.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    return `${prefix}_email_${safeEmail}`;
  }
  return `${prefix}_guest`;
};

export const clienteStorageService = {
  // ─────────────────────────────────────────────────────────────
  // 1. CARRITO DE COMPRAS (Vigencia: 10 días de inactividad - HU-08)
  // ─────────────────────────────────────────────────────────────

  /**
   * Carga el carrito del cliente activo.
   * Si han transcurrido más de 10 días desde su última actividad, se elimina automáticamente.
   */
  cargarCarrito: (user?: AuthUser | null): ProductoCarrito[] => {
    const key = getStorageUserKey('estetica_cart', user);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];

      const parsed = JSON.parse(raw);

      // Formato estructurado con timestamp de última actividad
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.items)) {
        const ultimaActividad = typeof parsed.ultimaActividad === 'number' ? parsed.ultimaActividad : Date.now();
        const inactividadMs = Date.now() - ultimaActividad;

        // Regla HU-08: eliminar luego de 10 días de inactividad
        if (inactividadMs > MS_EXPIRACION_CARRITO) {
          const diasInactivo = Math.round(inactividadMs / (1000 * 60 * 60 * 24));
          console.info(`[Carrito] El carrito (${key}) superó los 10 días de inactividad (${diasInactivo} días). Se elimina según HU-08.`);
          localStorage.removeItem(key);
          return [];
        }

        // Carrito dentro del plazo de 10 días: se preserva intacto
        return parsed.items;
      }

      // Compatibilidad con formato legado (array directo sin timestamp)
      if (Array.isArray(parsed)) {
        // Migrar al nuevo formato con timestamp
        clienteStorageService.guardarCarrito(parsed, user);
        return parsed;
      }

      return [];
    } catch (e) {
      console.warn('Error al leer carrito:', e);
      return [];
    }
  },

  /**
   * Guarda los productos en el carrito del usuario y renueva la marca de tiempo de actividad.
   */
  guardarCarrito: (items: ProductoCarrito[], user?: AuthUser | null): void => {
    const key = getStorageUserKey('estetica_cart', user);
    try {
      const data: CarritoPersistido = {
        items,
        ultimaActividad: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error al persistir carrito:', e);
    }
  },

  /**
   * Limpia el carrito (utilizado tras completar un checkout exitoso)
   */
  limpiarCarrito: (user?: AuthUser | null): void => {
    const key = getStorageUserKey('estetica_cart', user);
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  // ─────────────────────────────────────────────────────────────
  // 2. LISTA DE DESEOS (No expira y NO se elimina al cerrar sesión)
  // ─────────────────────────────────────────────────────────────

  /**
   * Carga la lista de deseos del cliente activo.
   * La lista de deseos no expira y se conserva indefinidamente en su cuenta.
   */
  cargarWishlist: (user?: AuthUser | null): WishlistItem[] => {
    const key = getStorageUserKey('estetica_wishlist', user);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Error al leer lista de deseos:', e);
      return [];
    }
  },

  /**
   * Guarda la lista de deseos exclusivamente para la cuenta del cliente activo.
   */
  guardarWishlist: (items: WishlistItem[], user?: AuthUser | null): void => {
    const key = getStorageUserKey('estetica_wishlist', user);
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error('Error al persistir lista de deseos:', e);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. FUSIÓN AL INICIAR SESIÓN (De invitado a cliente autenticado)
  // ─────────────────────────────────────────────────────────────

  /**
   * Si un usuario navegó y seleccionó productos en el carrito o en favoritos
   * antes de iniciar sesión, al loguearse se fusionan de forma segura con su cuenta.
   */
  fusionarDatosInvitadoAlIniciarSesion: (user: AuthUser): { carrito: ProductoCarrito[]; wishlist: WishlistItem[] } => {
    const guestCart = clienteStorageService.cargarCarrito(null);
    const guestWish = clienteStorageService.cargarWishlist(null);

    const userCart = clienteStorageService.cargarCarrito(user);
    const userWish = clienteStorageService.cargarWishlist(user);

    // 1. Fusionar Carrito (sumar cantidades si coincide producto)
    const cartMap = new Map<string, ProductoCarrito>();
    userCart.forEach(i => cartMap.set(i.id, { ...i }));
    guestCart.forEach(g => {
      if (cartMap.has(g.id)) {
        cartMap.get(g.id)!.cantidad += g.cantidad;
      } else {
        cartMap.set(g.id, { ...g });
      }
    });
    const carritoFinal = Array.from(cartMap.values());
    clienteStorageService.guardarCarrito(carritoFinal, user);

    // 2. Fusionar Wishlist (sin duplicados)
    const wishMap = new Map<string, WishlistItem>();
    userWish.forEach(w => wishMap.set(w.id, { ...w }));
    guestWish.forEach(g => {
      if (!wishMap.has(g.id)) {
        wishMap.set(g.id, { ...g });
      }
    });
    const wishlistFinal = Array.from(wishMap.values());
    clienteStorageService.guardarWishlist(wishlistFinal, user);

    // Limpiar carrito e wishlist temporales de invitado
    clienteStorageService.limpiarCarrito(null);
    try {
      localStorage.removeItem('estetica_wishlist_guest');
    } catch {}

    return {
      carrito: carritoFinal,
      wishlist: wishlistFinal,
    };
  },
};
