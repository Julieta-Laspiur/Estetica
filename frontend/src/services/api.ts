/**
 * API Service Layer para conectar el Frontend React con el Backend .NET 10 y PostgreSQL
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Manejador centralizado de peticiones HTTP con inyección automática de JWT
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('estetica_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      // Ignorar fallo de parseo
    }
    throw new Error(errorMessage);
  }

  // Si la respuesta no tiene contenido (204 No Content), devolver null
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// 1. Módulo de Autenticación
export interface AuthUser {
  usuarioId: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'Cliente' | 'Profesional' | 'Administrador' | 'Recepcionista';
}

export interface AuthResponse {
  token: string;
  usuario: AuthUser;
}

export const authApi = {
  login: async (email: string, password: string):Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('estetica_token', data.token);
    localStorage.setItem('estetica_user', JSON.stringify(data.usuario));
    return data;
  },

  register: async (nombre: string, apellido: string, email: string, telefono: string, password: string, rol = 'Cliente'): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, apellido, email, telefono, password, rol }),
    });
    localStorage.setItem('estetica_token', data.token);
    localStorage.setItem('estetica_user', JSON.stringify(data.usuario));
    return data;
  },

  getMe: async (): Promise<AuthUser> => {
    return request<AuthUser>('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('estetica_token');
    localStorage.removeItem('estetica_user');
  },

  getCurrentUser: (): AuthUser | null => {
    const userStr = localStorage.getItem('estetica_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('estetica_token');
  },
};

// 2. Módulo de Servicios Estéticos
export interface ServicioDto {
  servicioId: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracionMin: number;
  activo: boolean;
}

export const serviciosApi = {
  getActivos: (): Promise<ServicioDto[]> => {
    return request<ServicioDto[]>('/servicios');
  },

  getTodos: (): Promise<ServicioDto[]> => {
    return request<ServicioDto[]>('/servicios/todos');
  },

  getPorId: (id: number): Promise<ServicioDto> => {
    return request<ServicioDto>(`/servicios/${id}`);
  },

  crear: (servicio: Omit<ServicioDto, 'servicioId'>): Promise<ServicioDto> => {
    return request<ServicioDto>('/servicios', {
      method: 'POST',
      body: JSON.stringify(servicio),
    });
  },

  actualizar: (id: number, servicio: Partial<ServicioDto>): Promise<ServicioDto> => {
    return request<ServicioDto>(`/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(servicio),
    });
  },

  cambiarEstado: (id: number, activo: boolean): Promise<void> => {
    return request<void>(`/servicios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },
};

// 3. Módulo de Productos y Stock
export interface ProductoDto {
  productoId: number;
  nombre: string;
  marca: string;
  descripcion?: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  tiposPiel?: string[];
}

export const productosApi = {
  getProductos: (tipoPiel?: string): Promise<ProductoDto[]> => {
    const query = tipoPiel ? `?tipoPiel=${encodeURIComponent(tipoPiel)}` : '';
    return request<ProductoDto[]>(`/productos${query}`);
  },

  getBajoStock: (): Promise<ProductoDto[]> => {
    return request<ProductoDto[]>('/productos/bajo-stock');
  },

  ajustarStock: (productoId: number, cantidad: number, motivo: string): Promise<void> => {
    return request<void>('/productos/ajuste-stock', {
      method: 'POST',
      body: JSON.stringify({ productoId, cantidad, motivo }),
    });
  },
};

// 4. Módulo de Turnos y Agenda
export interface TurnoDto {
  turnoId: number;
  usuarioId: number;
  profesionalId: number;
  cabinaId: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string;
  total: number;
  serviciosIds: number[];
}

export interface DisponibilidadResponse {
  disponible: boolean;
  mensaje?: string;
}

export const turnosApi = {
  consultarDisponibilidad: (profesionalId: number, cabinaId: number, fechaHoraInicio: string, duracionMin: number): Promise<DisponibilidadResponse> => {
    const params = new URLSearchParams({
      profesionalId: profesionalId.toString(),
      cabinaId: cabinaId.toString(),
      fechaHoraInicio,
      duracionMin: duracionMin.toString(),
    });
    return request<DisponibilidadResponse>(`/turnos/disponibilidad?${params.toString()}`);
  },

  reservar: (turno: { profesionalId: number; cabinaId: number; fechaHoraInicio: string; serviciosIds: number[] }): Promise<TurnoDto> => {
    return request<TurnoDto>('/turnos/reservar', {
      method: 'POST',
      body: JSON.stringify(turno),
    });
  },

  getMisTurnos: (): Promise<TurnoDto[]> => {
    return request<TurnoDto[]>('/turnos/mis-turnos');
  },

  cancelar: (turnoId: number, motivo: string): Promise<void> => {
    return request<void>(`/turnos/${turnoId}/cancelar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo }),
    });
  },
};

// 5. Módulo de Fidelización & QR
export interface TarjetaFidelizacionDto {
  fidelizacionId: number;
  usuarioId: number;
  estampitasActuales: number;
  cuponesDisponibles: number;
  estampitasParaPremio: number;
}

export const fidelizacionApi = {
  getMiTarjeta: (): Promise<TarjetaFidelizacionDto> => {
    return request<TarjetaFidelizacionDto>('/fidelizacion/mi-tarjeta');
  },

  generarQr: (): Promise<{ qrToken: string; expiraEnMinutos: number }> => {
    return request<{ qrToken: string; expiraEnMinutos: number }>('/fidelizacion/generar-qr', {
      method: 'POST',
    });
  },

  escanearQr: (codigoQr: string): Promise<{ mensaje: string; estampitasActuales: number }> => {
    return request<{ mensaje: string; estampitasActuales: number }>('/fidelizacion/escanear-qr', {
      method: 'POST',
      body: JSON.stringify({ codigoQr }),
    });
  },
};

// 6. Asistente Dermatológico IA (Arquitectura RAG)
export interface ConsultaIAResponse {
  conversacionId: number;
  respuesta: string;
  productosRecomendados?: ProductoDto[];
  serviciosRecomendados?: ServicioDto[];
}

export const chatIAApi = {
  consultar: (mensaje: string, tipoPiel?: string): Promise<ConsultaIAResponse> => {
    return request<ConsultaIAResponse>('/diagnosticoia/consultar-asistente', {
      method: 'POST',
      body: JSON.stringify({ mensaje, tipoPiel }),
    });
  },
};
