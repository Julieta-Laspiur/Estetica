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

function normalizeUserRole(user: any): AuthUser {
  let rolName: 'Cliente' | 'Profesional' | 'Administrador' | 'Recepcionista' = 'Cliente';
  if (typeof user?.rol === 'number') {
    switch (user.rol) {
      case 1:
        rolName = 'Profesional';
        break;
      case 2:
        rolName = 'Administrador';
        break;
      case 3:
        rolName = 'Recepcionista';
        break;
      default:
        rolName = 'Cliente';
        break;
    }
  } else if (typeof user?.rol === 'string') {
    rolName = user.rol as any;
  }
  return { ...user, rol: rolName };
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    data.usuario = normalizeUserRole(data.usuario);
    localStorage.setItem('estetica_token', data.token);
    localStorage.setItem('estetica_user', JSON.stringify(data.usuario));
    return data;
  },

  register: async (nombre: string, apellido: string, email: string, telefono: string, password: string, rol = 0): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, apellido, email, telefono, password, rol }),
    });
    data.usuario = normalizeUserRole(data.usuario);
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
  paraQueSirve?: string;
  imagenUrl?: string;
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

  cambiarEstado: (id: number, activo: boolean): Promise<ServicioDto> => {
    return request<ServicioDto>(`/servicios/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ activo }),
    });
  },

  eliminar: (id: number): Promise<{ message: string; desactivadoLogico: boolean }> => {
    return request<{ message: string; desactivadoLogico: boolean }>(`/servicios/${id}`, {
      method: 'DELETE',
    });
  },

  uploadImagen: async (archivo: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const token = localStorage.getItem('estetica_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('/api/v1/servicios/upload-imagen', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      let msg = 'Error al subir la imagen del servicio';
      try {
        const errJson = await response.json();
        msg = errJson.message || msg;
      } catch {}
      throw new Error(msg);
    }
    return response.json();
  },
};

// 3. Módulo de Productos y Stock
export interface ProductoDto {
  productoId: number;
  nombre: string;
  marca: string;
  descripcion?: string;
  paraQueSirve?: string;
  imagenUrl?: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  tiposPiel?: string[];
  tiposPielAptos?: string[];
}

export interface StockAlertaDto {
  productoId: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  alertaStockBajo: boolean;
}

export const productosApi = {
  getProductos: (tipoPiel?: string): Promise<ProductoDto[]> => {
    const query = tipoPiel ? `?tipoPiel=${encodeURIComponent(tipoPiel)}` : '';
    return request<ProductoDto[]>(`/productos${query}`);
  },

  getTodos: (): Promise<ProductoDto[]> => {
    return request<ProductoDto[]>('/productos/todos');
  },

  crear: (producto: Omit<ProductoDto, 'productoId'> & { tiposPiel?: string[] }): Promise<ProductoDto> => {
    return request<ProductoDto>('/productos', {
      method: 'POST',
      body: JSON.stringify(producto),
    });
  },

  actualizar: (id: number, producto: Partial<ProductoDto> & { tiposPiel?: string[] }): Promise<ProductoDto> => {
    return request<ProductoDto>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(producto),
    });
  },

  eliminar: (id: number): Promise<{ message: string; desactivadoLogico: boolean }> => {
    return request<{ message: string; desactivadoLogico: boolean }>(`/productos/${id}`, {
      method: 'DELETE',
    });
  },

  uploadImagen: async (archivo: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const token = localStorage.getItem('estetica_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('/api/v1/productos/upload-imagen', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      let msg = 'Error al subir la imagen';
      try {
        const errJson = await response.json();
        msg = errJson.message || msg;
      } catch {}
      throw new Error(msg);
    }
    return response.json();
  },

  getBajoStock: (): Promise<StockAlertaDto[]> => {
    return request<StockAlertaDto[]>('/productos/bajo-stock');
  },

  ajustarStock: (id: number, tipoAjuste: number, cantidad: number, motivo?: string): Promise<any> => {
    return request<any>(`/productos/${id}/ajustar-stock`, {
      method: 'POST',
      body: JSON.stringify({ tipoAjuste, cantidad, motivo }),
    });
  },

  configurarStockMinimo: (id: number, nuevoStockMinimo: number): Promise<StockAlertaDto> => {
    return request<StockAlertaDto>(`/productos/${id}/stock-minimo`, {
      method: 'PUT',
      body: JSON.stringify({ nuevoStockMinimo }),
    });
  },
};

// 4. Módulo de Turnos y Agenda
export interface TurnoServicioItemDto {
  servicioId: number;
  nombre: string;
  duracionMin: number;
  precio: number;
}

export interface TurnoDto {
  turnoId: number;
  usuarioId: number;
  clienteNombreCompleto?: string;
  profesionalId: number;
  profesionalNombreCompleto?: string;
  cabinaId: number;
  cabinaNombre?: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string | number;
  total: number;
  fechaCreacion?: string;
  motivo?: string;
  metodoPago?: 'mercadopago' | 'efectivo' | string;
  estaExpirado?: boolean;
  servicios?: TurnoServicioItemDto[];
}

export interface CabinaDto {
  cabinaId: number;
  nombre: string;
  descripcion?: string;
  estado: string;
}

export interface DisponibilidadResponse {
  disponible: boolean;
  mensaje?: string;
}

export const turnosApi = {
  getTurnos: (params?: { fechaInicio?: string; fechaFin?: string; estado?: number }): Promise<TurnoDto[]> => {
    const searchParams = new URLSearchParams();
    if (params?.fechaInicio) searchParams.append('fechaInicio', params.fechaInicio);
    if (params?.fechaFin) searchParams.append('fechaFin', params.fechaFin);
    if (params?.estado !== undefined) searchParams.append('estado', params.estado.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<TurnoDto[]>(`/turnos${query}`);
  },

  getCabinas: (): Promise<CabinaDto[]> => {
    return request<CabinaDto[]>('/turnos/cabinas');
  },

  consultarDisponibilidad: (profesionalId: number, cabinaId: number, fechaHoraInicio: string, duracionMin: number): Promise<DisponibilidadResponse> => {
    const params = new URLSearchParams({
      profesionalId: profesionalId.toString(),
      cabinaId: cabinaId.toString(),
      fechaHoraInicio,
      duracionMin: duracionMin.toString(),
    });
    return request<DisponibilidadResponse>(`/turnos/disponibilidad?${params.toString()}`);
  },

  reservar: (turno: { usuarioId?: number; profesionalId: number; cabinaId: number; fechaHoraInicio: string; servicioIds?: number[]; serviciosIds?: number[] }): Promise<TurnoDto> => {
    const ids = turno.servicioIds || turno.serviciosIds || [];
    return request<TurnoDto>('/turnos/reservar', {
      method: 'POST',
      body: JSON.stringify({
        usuarioId: turno.usuarioId,
        profesionalId: turno.profesionalId,
        cabinaId: turno.cabinaId,
        fechaHoraInicio: turno.fechaHoraInicio,
        servicioIds: ids,
      }),
    });
  },

  getMisTurnos: (): Promise<TurnoDto[]> => {
    return request<TurnoDto[]>('/turnos/mis-turnos');
  },

  confirmar: (id: number): Promise<{ message: string }> => {
    return request<{ message: string }>(`/turnos/${id}/confirmar`, { method: 'PUT' });
  },

  cancelar: (turnoId: number, motivo?: string): Promise<void> => {
    return request<void>(`/turnos/${turnoId}/cancelar`, {
      method: 'PUT',
      body: JSON.stringify({ motivo: motivo || 'Cancelación administrativa' }),
    });
  },

  reprogramar: (id: number, data: { nuevaFechaHoraInicio: string; nuevaCabinaId?: number; nuevoProfesionalId?: number; motivo?: string }): Promise<TurnoDto> => {
    return request<TurnoDto>(`/turnos/${id}/reprogramar`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  bloquearHorario: (data: { profesionalId: number; cabinaId: number; fechaHoraInicio: string; fechaHoraFin: string; motivo?: string }): Promise<TurnoDto> => {
    return request<TurnoDto>('/turnos/bloquear', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  expirarPendientes: (): Promise<{ turnosLiberados: number; message: string }> => {
    return request<{ turnosLiberados: number; message: string }>('/turnos/expirar-pendientes', { method: 'POST' });
  },

  getPorUsuario: (usuarioId: number): Promise<TurnoDto[]> => {
    return request<TurnoDto[]>(`/turnos/usuario/${usuarioId}`);
  },

  getPorProfesional: (profesionalId: number, fecha?: string): Promise<TurnoDto[]> => {
    const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
    return request<TurnoDto[]>(`/turnos/profesional/${profesionalId}${query}`);
  },
};

// 5. Módulo de Gestión de Usuarios y Clientes
export interface UsuarioDetalleDto {
  usuarioId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: string | number;
  fechaRegistro: string;
  activo: boolean;
  bloqueado: boolean;
  intentosFallidos: number;
}

export const usuariosApi = {
  getClientes: (): Promise<UsuarioDetalleDto[]> => {
    return request<UsuarioDetalleDto[]>('/usuarios/rol/Cliente');
  },

  getProfesionales: (): Promise<UsuarioDetalleDto[]> => {
    return request<UsuarioDetalleDto[]>('/usuarios/rol/Profesional');
  },

  getBloqueados: (): Promise<UsuarioDetalleDto[]> => {
    return request<UsuarioDetalleDto[]>('/usuarios/bloqueados');
  },

  desbloquear: (id: number): Promise<UsuarioDetalleDto> => {
    return request<UsuarioDetalleDto>(`/usuarios/${id}/desbloquear`, { method: 'PUT' });
  },

  cambiarEstado: (id: number, activo: boolean, motivo?: string): Promise<UsuarioDetalleDto> => {
    return request<UsuarioDetalleDto>(`/usuarios/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ activo, motivo: motivo || 'Actualización administrativa' }),
    });
  },

  getPerfil: (id: number): Promise<any> => {
    return request<any>(`/usuarios/perfil/${id}`);
  },

  resetPassword: (id: number, nuevaPassword: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/usuarios/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ nuevaPassword }),
    });
  },
};

// 6. Módulo de Fidelización & QR
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

  getTarjetaPorUsuario: (usuarioId: number): Promise<TarjetaFidelizacionDto> => {
    return request<TarjetaFidelizacionDto>(`/fidelizacion/usuario/${usuarioId}`);
  },

  acumularEstampitas: (usuarioId: number, cantidadEstampitas: number, motivo?: string): Promise<any> => {
    return request<any>('/fidelizacion/estampitas', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, cantidadEstampitas, motivo }),
    });
  },

  generarQr: (): Promise<{ qrToken: string; expiraEnMinutos: number }> => {
    return request<{ qrToken: string; expiraEnMinutos: number }>('/fidelizacion/generar-qr', {
      method: 'POST',
    });
  },

  escanearQr: (token: string): Promise<{ mensaje: string; estampitasActuales: number; cuponGenerado?: boolean }> => {
    return request<any>('/fidelizacion/escanear-qr', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};

// 6. Asistente Dermatológico IA (Arquitectura RAG - HU-11 y HU-12)
export interface ConversacionIADto {
  conversacionId: number;
  usuarioId: number;
  pregunta: string;
  respuesta: string;
  fecha: string;
  esAclaracionMedicaOExterna: boolean;
  productosRelacionados: ProductoDto[];
  serviciosRelacionados: ServicioDto[];
}

export interface RecomendacionPersonalizadaDto {
  usuarioId: number;
  clienteNombre: string;
  tipoPiel: string;
  alergiasRegistradas?: string;
  observacionDiagnostico: string;
  historialComprasResumen: string[];
  tratamientosPreviosResumen: string[];
  productosRecomendados: ProductoDto[];
  rutinaSugerida: string;
  fechaGeneracion: string;
}

export interface DiagnosticoPielDto {
  diagnosticoId: number;
  usuarioId: number;
  tipoPielId: number;
  tipoPielNombre: string;
  resultado: string;
  alergias?: string;
  fecha: string;
}

export const chatIAApi = {
  consultar: (pregunta: string, usuarioId?: number): Promise<ConversacionIADto> => {
    return request<ConversacionIADto>('/diagnosticoia/consultar-asistente', {
      method: 'POST',
      body: JSON.stringify({ pregunta, usuarioId }),
    });
  },

  getHistorial: (limite: number = 50): Promise<ConversacionIADto[]> => {
    return request<ConversacionIADto[]>(`/diagnosticoia/conversaciones?limite=${limite}`);
  },

  getRecomendacion: (): Promise<RecomendacionPersonalizadaDto> => {
    return request<RecomendacionPersonalizadaDto>('/diagnosticoia/recomendacion');
  },

  registrarDiagnostico: (tipoPiel: string, resultado: string, alergias?: string, usuarioId?: number): Promise<DiagnosticoPielDto> => {
    return request<DiagnosticoPielDto>('/diagnosticoia/diagnostico', {
      method: 'POST',
      body: JSON.stringify({ tipoPiel, resultado, alergias, usuarioId }),
    });
  },
};

// 7. Módulo de Pagos y Pasarelas (Mercado Pago y Efectivo)
export interface PreferenciaPagoDto {
  pagoId: number;
  referenciaExterna: string;
  initPointUrl: string;
}

export interface PagoPresencialResultadoDto {
  pagoId: number;
  turnoId?: number;
  ordenId?: number;
  monto: number;
  mensaje: string;
  qrToken?: string;
}

export const pagosApi = {
  procesar: (data: { turnoId?: number; ordenId?: number; proveedor?: number }): Promise<PreferenciaPagoDto> => {
    return request<PreferenciaPagoDto>('/pagos/procesar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  registrarPresencial: (data: {
    turnoId?: number;
    ordenId?: number;
    metodoPago?: number;
    monto?: number;
    notasComprobante?: string;
    acreditarEstampitaDirectamente?: boolean;
  }): Promise<PagoPresencialResultadoDto> => {
    return request<PagoPresencialResultadoDto>('/pagos/presencial', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generarQrToken: (pagoId: number): Promise<{ qrToken: string; expiraEnMinutos: number }> => {
    return request<{ qrToken: string; expiraEnMinutos: number }>(`/pagos/${pagoId}/qr`, {
      method: 'POST',
    });
  },
};

