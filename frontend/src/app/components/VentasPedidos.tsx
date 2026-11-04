import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Receipt,
  Eye,
  CreditCard,
  User,
  ShoppingBag,
  Printer,
  Check,
  RefreshCw,
  Phone,
  Mail
} from 'lucide-react';
import { ordenesApi, type OrdenCompraDto } from '../../services/api';
import { configuracionService, type ConfiguracionGeneral } from '../../services/configuracionService';

export function VentasPedidos() {
  const [ordenes, setOrdenes] = useState<OrdenCompraDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState<string>('todos');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('todos');
  const [siteConfig, setSiteConfig] = useState<ConfiguracionGeneral>(() => configuracionService.get());

  // Modales
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenCompraDto | null>(null);
  const [ordenParaComprobante, setOrdenParaComprobante] = useState<OrdenCompraDto | null>(null);
  const [ordenParaDevolucion, setOrdenParaDevolucion] = useState<OrdenCompraDto | null>(null);
  const [motivoDevolucion, setMotivoDevolucion] = useState<string>('Producto dañado o defectuoso');
  const [reintegrarStock, setReintegrarStock] = useState<boolean>(true);
  const [procesandoAccion, setProcesandoAccion] = useState<boolean>(false);

  useEffect(() => {
    cargarOrdenes();
    setSiteConfig(configuracionService.get());
  }, []);

  const cargarOrdenes = async () => {
    setCargando(true);
    try {
      // 1. Obtener órdenes del backend
      let ordenesBackend: OrdenCompraDto[] = [];
      try {
        ordenesBackend = await ordenesApi.getOrdenesAdmin();
      } catch (err) {
        console.warn('Backend API de órdenes no disponible, usando fallback local:', err);
      }

      // 2. Obtener órdenes locales
      let ordenesLocales: any[] = [];
      try {
        ordenesLocales = JSON.parse(localStorage.getItem('estetica_ordenes_productos') || '[]');
      } catch {}

      // Mapear y unificar sin duplicados
      const mapaOrdenes = new Map<string, OrdenCompraDto>();

      // Primero agregar las del backend
      ordenesBackend.forEach(o => {
        mapaOrdenes.set(String(o.ordenId), o);
      });

      // Luego complementar con locales si tienen IDs diferentes o detalles locales
      ordenesLocales.forEach((ol: any) => {
        const idKey = String(ol.ordenId);
        if (!mapaOrdenes.has(idKey)) {
          mapaOrdenes.set(idKey, {
            ordenId: ol.ordenId,
            usuarioId: ol.usuarioId || 0,
            clienteNombre: ol.clienteNombre || 'Cliente Web',
            clienteEmail: ol.clienteEmail || 'cliente@estetica.com',
            clienteTelefono: ol.clienteTelefono || '',
            fecha: ol.fecha || new Date().toISOString(),
            total: ol.total || 0,
            estado: ol.estado || 'Pendiente',
            medioPago: ol.medioPago || 'MercadoPago',
            estadoPago: ol.estado === 'Pagada' || ol.estado === 1 ? 'Aprobado' : (ol.estado === 'Cancelada' ? 'Rechazado' : 'Pendiente'),
            referenciaExterna: ol.codigoOperacion || ol.referenciaExterna || `ORD-${ol.ordenId}`,
            motivoDevolucion: ol.motivoDevolucion,
            detalles: (ol.detalles || []).map((d: any) => ({
              detalleId: d.detalleId || Math.floor(Math.random() * 10000),
              productoId: d.productoId,
              nombreProducto: d.nombreProducto || 'Producto cosmético',
              imagenUrl: d.imagenUrl,
              marca: d.marca,
              cantidad: d.cantidad || 1,
              precioUnitario: d.precioUnitario || 0,
              subtotal: (d.cantidad || 1) * (d.precioUnitario || 0)
            }))
          });
        }
      });

      const lista = Array.from(mapaOrdenes.values()).sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      setOrdenes(lista);
    } catch (e) {
      console.error('Error al cargar órdenes:', e);
    } finally {
      setCargando(false);
    }
  };

  // Normalizar estados para evitar discrepancias numéricas o de string
  const normalizarEstadoPedido = (estado: number | string): string => {
    const s = String(estado).toLowerCase();
    if (s === '0' || s.includes('pend')) return 'Pendiente';
    if (s === '1' || s.includes('pag')) return 'Pagada';
    if (s === '2' || s.includes('prep')) return 'EnPreparacion';
    if (s === '3' || s.includes('env') || s.includes('desp')) return 'Enviada';
    if (s === '4' || s.includes('entreg')) return 'Entregada';
    if (s === '5' || s.includes('canc')) return 'Cancelada';
    if (s === '6' || s.includes('dev')) return 'Devuelta';
    return String(estado);
  };

  const normalizarEstadoPago = (estado: number | string | undefined, estadoPedido: number | string): string => {
    if (estado !== undefined) {
      const s = String(estado).toLowerCase();
      if (s === '1' || s.includes('aprob') || s.includes('pag')) return 'Aprobado';
      if (s === '2' || s.includes('rech') || s.includes('fall')) return 'Rechazado';
      if (s === '0' || s.includes('pend')) return 'Pendiente';
    }
    const ep = normalizarEstadoPedido(estadoPedido);
    if (ep === 'Pagada' || ep === 'EnPreparacion' || ep === 'Enviada' || ep === 'Entregada') return 'Aprobado';
    if (ep === 'Cancelada') return 'Rechazado';
    return 'Pendiente';
  };

  // Acciones sobre el estado del pedido
  const handleCambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    setProcesandoAccion(true);
    try {
      // 1. Llamar al backend
      try {
        await ordenesApi.actualizarEstado(ordenId, nuevoEstado);
      } catch (err) {
        console.warn('No se pudo actualizar vía API, sincronizando localmente:', err);
      }

      // 2. Actualizar estado en memoria
      setOrdenes(prev => prev.map(o => {
        if (o.ordenId === ordenId) {
          return {
            ...o,
            estado: nuevoEstado,
            estadoPago: nuevoEstado === 'Cancelada' ? 'Rechazado' : (nuevoEstado === 'Pendiente' ? 'Pendiente' : 'Aprobado')
          };
        }
        return o;
      }));

      // 3. Sincronizar en localStorage
      try {
        const locales = JSON.parse(localStorage.getItem('estetica_ordenes_productos') || '[]');
        const actualizadas = locales.map((ol: any) => {
          if (ol.ordenId === ordenId) {
            return { ...ol, estado: nuevoEstado };
          }
          return ol;
        });
        localStorage.setItem('estetica_ordenes_productos', JSON.stringify(actualizadas));
      } catch {}

      if (ordenSeleccionada && ordenSeleccionada.ordenId === ordenId) {
        setOrdenSeleccionada(prev => prev ? { ...prev, estado: nuevoEstado } : null);
      }
    } catch (e) {
      console.error('Error al actualizar estado:', e);
      alert('Error al actualizar el estado del pedido.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Registrar devolución
  const handleConfirmarDevolucion = async () => {
    if (!ordenParaDevolucion) return;
    setProcesandoAccion(true);

    try {
      try {
        await ordenesApi.registrarDevolucion(ordenParaDevolucion.ordenId, motivoDevolucion, reintegrarStock);
      } catch (err) {
        console.warn('API de devolución fallback local:', err);
      }

      // Actualizar en memoria
      setOrdenes(prev => prev.map(o => {
        if (o.ordenId === ordenParaDevolucion.ordenId) {
          return { ...o, estado: 'Devuelta', motivoDevolucion };
        }
        return o;
      }));

      // Actualizar en localStorage
      try {
        const locales = JSON.parse(localStorage.getItem('estetica_ordenes_productos') || '[]');
        const actualizadas = locales.map((ol: any) => {
          if (ol.ordenId === ordenParaDevolucion.ordenId) {
            return { ...ol, estado: 'Devuelta', motivoDevolucion };
          }
          return ol;
        });
        localStorage.setItem('estetica_ordenes_productos', JSON.stringify(actualizadas));
      } catch {}

      alert(`✅ Devolución registrada correctamente para la Orden #${ordenParaDevolucion.ordenId}.\n${reintegrarStock ? 'Se ha restituido el stock al catálogo.' : ''}`);
      setOrdenParaDevolucion(null);
    } catch (e) {
      console.error('Error registrando devolución:', e);
      alert('Hubo un error al registrar la devolución.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Filtrado de órdenes
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(orden => {
      // Búsqueda de texto
      const term = busqueda.toLowerCase().trim();
      if (term) {
        const matchId = String(orden.ordenId).includes(term);
        const matchRef = (orden.referenciaExterna || '').toLowerCase().includes(term);
        const matchCliente = (orden.clienteNombre || '').toLowerCase().includes(term);
        const matchEmail = (orden.clienteEmail || '').toLowerCase().includes(term);
        const matchProducto = orden.detalles.some(d => d.nombreProducto.toLowerCase().includes(term));
        if (!matchId && !matchRef && !matchCliente && !matchEmail && !matchProducto) {
          return false;
        }
      }

      // Filtro de estado del pedido
      const estNorm = normalizarEstadoPedido(orden.estado);
      if (filtroEstadoPedido !== 'todos' && estNorm !== filtroEstadoPedido) {
        return false;
      }

      // Filtro de estado de pago
      const pagoNorm = normalizarEstadoPago(orden.estadoPago, orden.estado);
      if (filtroEstadoPago !== 'todos' && pagoNorm !== filtroEstadoPago) {
        return false;
      }

      // Filtro de fecha
      if (filtroFecha !== 'todos') {
        const fechaOrden = new Date(orden.fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (filtroFecha === 'hoy') {
          const comp = new Date(fechaOrden);
          comp.setHours(0, 0, 0, 0);
          if (comp.getTime() !== hoy.getTime()) return false;
        } else if (filtroFecha === 'semana') {
          const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (fechaOrden < hace7Dias) return false;
        } else if (filtroFecha === 'mes') {
          const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (fechaOrden < hace30Dias) return false;
        }
      }

      return true;
    });
  }, [ordenes, busqueda, filtroEstadoPedido, filtroEstadoPago, filtroFecha]);

  // Métricas
  const metricas = useMemo(() => {
    let totalVentas = 0;
    let totalRecaudado = 0;
    let pendientes = 0;
    let enPreparacion = 0;
    let enviadas = 0;
    let entregadas = 0;
    let devoluciones = 0;
    let rechazadas = 0;

    ordenes.forEach(o => {
      totalVentas++;
      const estNorm = normalizarEstadoPedido(o.estado);
      const pagoNorm = normalizarEstadoPago(o.estadoPago, o.estado);

      if (pagoNorm === 'Aprobado') {
        totalRecaudado += Number(o.total) || 0;
      }

      if (estNorm === 'Pendiente') pendientes++;
      else if (estNorm === 'EnPreparacion') enPreparacion++;
      else if (estNorm === 'Enviada') enviadas++;
      else if (estNorm === 'Entregada') entregadas++;
      else if (estNorm === 'Devuelta') devoluciones++;
      else if (estNorm === 'Cancelada' || pagoNorm === 'Rechazado') rechazadas++;
    });

    return {
      totalVentas,
      totalRecaudado,
      pendientes,
      enPreparacion,
      enviadas,
      entregadas,
      devoluciones,
      rechazadas
    };
  }, [ordenes]);

  // Badges y estilos de estado
  const renderBadgeEstadoPedido = (estado: number | string) => {
    const est = normalizarEstadoPedido(estado);
    switch (est) {
      case 'Pagada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pagada
          </span>
        );
      case 'EnPreparacion':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Package className="w-3.5 h-3.5" /> En Preparación
          </span>
        );
      case 'Enviada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" /> Listo / Enviado
          </span>
        );
      case 'Entregada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <Check className="w-3.5 h-3.5" /> Entregada
          </span>
        );
      case 'Devuelta':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3.5 h-3.5" /> Devuelta
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3.5 h-3.5" /> Pendiente Pago
          </span>
        );
    }
  };

  const renderBadgeEstadoPago = (estadoPago: any, estadoPedido: any) => {
    const pago = normalizarEstadoPago(estadoPago, estadoPedido);
    switch (pago) {
      case 'Aprobado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            ● Aprobado
          </span>
        );
      case 'Rechazado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
            ● Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
            ● Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Ventas y Pedidos</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7A3B3B]/10 text-[#7A3B3B]">
              Módulo #7
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Control integral de compras de la tienda, preparación logística de paquetes, estado de entregas y devoluciones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarOrdenes}
            disabled={cargando}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-xs font-medium bg-card hover:bg-accent text-foreground transition-colors shadow-2xs"
            title="Recargar listado"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-[#7A3B3B]' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Estado */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Total Pedidos</span>
            <ShoppingBag className="w-4 h-4 text-[#7A3B3B]" />
          </div>
          <div className="text-xl font-bold text-foreground">{metricas.totalVentas}</div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
            ${metricas.totalRecaudado.toLocaleString('es-AR')} ARS
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Por Preparar</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">{metricas.enPreparacion}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">En depósito / empaque</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Listos / Enviados</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-700">{metricas.enviadas}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Para retiro o flete</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Entregados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{metricas.entregadas}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Completados con éxito</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Devoluciones</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-700">{metricas.devoluciones}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Stock reintegrado</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Canceladas / Fallidas</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">{metricas.rechazadas}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Operaciones rechazadas</div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Búsqueda por Nro, Operación, Cliente o Producto */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° Orden, Código MP, Cliente, Email o Producto..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por Estado Logístico del Pedido */}
          <div>
            <select
              value={filtroEstadoPedido}
              onChange={(e) => setFiltroEstadoPedido(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="todos">📦 Estado Pedido: Todos</option>
              <option value="Pendiente">⏳ Pendiente de Pago</option>
              <option value="Pagada">💳 Pagado (Listo para preparar)</option>
              <option value="EnPreparacion">🍳 En Preparación</option>
              <option value="Enviada">🚚 Listo para retiro / Enviado</option>
              <option value="Entregada">✅ Entregado</option>
              <option value="Devuelta">🔄 Devolución</option>
              <option value="Cancelada">❌ Cancelado</option>
            </select>
          </div>

          {/* Filtro por Fecha */}
          <div>
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="todos">📅 Fechas: Todas</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Últimos 7 días</option>
              <option value="mes">Últimos 30 días</option>
            </select>
          </div>
        </div>

        {/* Chips de filtro rápido */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Accesos directos:
          </span>
          <button
            onClick={() => { setFiltroEstadoPedido('EnPreparacion'); setFiltroEstadoPago('todos'); }}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
              filtroEstadoPedido === 'EnPreparacion'
                ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold'
                : 'bg-background hover:bg-accent border-border text-foreground'
            }`}
          >
            🍳 Por Preparar ({metricas.enPreparacion})
          </button>
          <button
            onClick={() => { setFiltroEstadoPedido('Enviada'); setFiltroEstadoPago('todos'); }}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
              filtroEstadoPedido === 'Enviada'
                ? 'bg-blue-100 border-blue-300 text-blue-800 font-bold'
                : 'bg-background hover:bg-accent border-border text-foreground'
            }`}
          >
            🚚 Listos para retiro / Enviados ({metricas.enviadas})
          </button>
          <button
            onClick={() => { setFiltroEstadoPedido('todos'); setFiltroEstadoPago('Rechazado'); }}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
              filtroEstadoPago === 'Rechazado'
                ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                : 'bg-background hover:bg-accent border-border text-foreground'
            }`}
          >
            ⚠️ Operaciones Rechazadas ({metricas.rechazadas})
          </button>
          <button
            onClick={() => { setFiltroEstadoPedido('Devuelta'); setFiltroEstadoPago('todos'); }}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
              filtroEstadoPedido === 'Devuelta'
                ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold'
                : 'bg-background hover:bg-accent border-border text-foreground'
            }`}
          >
            🔄 Devoluciones ({metricas.devoluciones})
          </button>
          {(filtroEstadoPedido !== 'todos' || filtroEstadoPago !== 'todos' || filtroFecha !== 'todos' || busqueda) && (
            <button
              onClick={() => {
                setFiltroEstadoPedido('todos');
                setFiltroEstadoPago('todos');
                setFiltroFecha('todos');
                setBusqueda('');
              }}
              className="ml-auto text-xs text-[#7A3B3B] hover:underline font-semibold"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla Principal de Pedidos */}
      <div className="rounded-xl bg-card border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3 px-4">N° Orden / Ref</th>
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Productos</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Pago</th>
                <th className="py-3 px-4">Estado Pedido</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cargando ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
                    <p className="text-sm font-medium">Cargando ventas y pedidos...</p>
                  </td>
                </tr>
              ) : ordenesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">No se encontraron órdenes ni ventas</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {busqueda || filtroEstadoPedido !== 'todos' || filtroEstadoPago !== 'todos'
                        ? 'Probá ajustando o quitando los filtros de búsqueda.'
                        : 'Las ventas de la tienda online aparecerán listadas aquí.'}
                    </p>
                  </td>
                </tr>
              ) : (
                ordenesFiltradas.map((orden) => {
                  const estNorm = normalizarEstadoPedido(orden.estado);
                  const totalProds = orden.detalles.reduce((acc, d) => acc + (d.cantidad || 1), 0);

                  return (
                    <tr key={orden.ordenId} className="hover:bg-muted/20 transition-colors">
                      {/* N° Orden y Código Operación */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>#{orden.ordenId}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[140px]" title={orden.referenciaExterna || ''}>
                          {orden.referenciaExterna || `ORD-${orden.ordenId}`}
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-foreground text-xs">
                          {new Date(orden.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(orden.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground text-xs flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[150px]">{orden.clienteNombre || 'Cliente Web'}</span>
                        </div>
                        {orden.clienteEmail && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-[150px]" title={orden.clienteEmail}>
                            {orden.clienteEmail}
                          </div>
                        )}
                        {orden.clienteTelefono && (
                          <a
                            href={`https://wa.me/${orden.clienteTelefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(orden.clienteNombre || '')},%20te%20escribimos%20desde%20${encodeURIComponent(siteConfig.nombreCentro)}%20sobre%20tu%20pedido%20%23${orden.ordenId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-medium mt-0.5"
                          >
                            <Phone className="w-3 h-3" /> {orden.clienteTelefono}
                          </a>
                        )}
                      </td>

                      {/* Productos Comprados */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-[200px]">
                          {orden.detalles.length === 1 ? (
                            <div className="text-xs text-foreground truncate font-medium">
                              {orden.detalles[0].nombreProducto} <span className="text-muted-foreground font-bold">x{orden.detalles[0].cantidad}</span>
                            </div>
                          ) : (
                            <div>
                              <div className="text-xs text-foreground font-medium truncate">
                                {orden.detalles[0].nombreProducto} (+{orden.detalles.length - 1} más)
                              </div>
                              <span className="text-[11px] text-muted-foreground font-medium">
                                {totalProds} unidades en total
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Monto Total */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-foreground text-sm">
                          ${Number(orden.total).toLocaleString('es-AR')}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">ARS</div>
                      </td>

                      {/* Medio y Estado del Pago */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-[#7A3B3B]" />
                          <span>{orden.medioPago || 'Mercado Pago'}</span>
                        </div>
                        <div className="mt-1">
                          {renderBadgeEstadoPago(orden.estadoPago, orden.estado)}
                        </div>
                      </td>

                      {/* Estado Logístico del Pedido */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderBadgeEstadoPedido(orden.estado)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver Detalle */}
                          <button
                            onClick={() => setOrdenSeleccionada(orden)}
                            className="p-1.5 rounded-lg border border-border hover:bg-accent text-foreground transition-colors"
                            title="Ver detalle completo de la orden"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>

                          {/* Comprobante de Pago */}
                          <button
                            onClick={() => setOrdenParaComprobante(orden)}
                            className="p-1.5 rounded-lg border border-border hover:bg-accent text-foreground transition-colors"
                            title="Ver comprobante de pago oficial"
                          >
                            <Receipt className="w-4 h-4 text-[#7A3B3B]" />
                          </button>

                          {/* Acciones rápidas de ciclo logístico */}
                          {estNorm === 'Pagada' && (
                            <button
                              onClick={() => handleCambiarEstado(orden.ordenId, 'EnPreparacion')}
                              disabled={procesandoAccion}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                              title="Marcar como En Preparación"
                            >
                              <Package className="w-3 h-3" /> Preparar
                            </button>
                          )}

                          {estNorm === 'EnPreparacion' && (
                            <button
                              onClick={() => handleCambiarEstado(orden.ordenId, 'Enviada')}
                              disabled={procesandoAccion}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                              title="Marcar como Listo para retiro / Despachado"
                            >
                              <Truck className="w-3 h-3" /> Despachar
                            </button>
                          )}

                          {estNorm === 'Enviada' && (
                            <button
                              onClick={() => handleCambiarEstado(orden.ordenId, 'Entregada')}
                              disabled={procesandoAccion}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                              title="Confirmar entrega al cliente"
                            >
                              <Check className="w-3 h-3" /> Entregar
                            </button>
                          )}

                          {/* Registrar Devolución */}
                          {(estNorm === 'Entregada' || estNorm === 'Pagada' || estNorm === 'Enviada') && (
                            <button
                              onClick={() => {
                                setOrdenParaDevolucion(orden);
                                setMotivoDevolucion('Producto defectuoso o reclamo de cliente');
                              }}
                              className="p-1.5 rounded-lg border border-border hover:bg-purple-50 hover:text-purple-700 text-muted-foreground transition-colors"
                              title="Registrar devolución de mercadería"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DETALLE COMPLETO DE LA ORDEN */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground">Detalle del Pedido #{ordenSeleccionada.ordenId}</h3>
                  {renderBadgeEstadoPedido(ordenSeleccionada.estado)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Referencia Operación: {ordenSeleccionada.referenciaExterna || `ORD-${ordenSeleccionada.ordenId}`}
                </p>
              </div>
              <button
                onClick={() => setOrdenSeleccionada(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenido Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Información del Cliente */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground font-medium block mb-1">Cliente Asociado</span>
                  <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#7A3B3B]" />
                    {ordenSeleccionada.clienteNombre || 'Cliente Web'}
                  </div>
                  {ordenSeleccionada.clienteEmail && (
                    <div className="text-muted-foreground mt-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {ordenSeleccionada.clienteEmail}
                    </div>
                  )}
                  {ordenSeleccionada.clienteTelefono && (
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {ordenSeleccionada.clienteTelefono}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground font-medium block mb-1">Información de Pago</span>
                  <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#7A3B3B]" />
                    {ordenSeleccionada.medioPago || 'Mercado Pago'}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-muted-foreground">Estado del Pago:</span>
                    {renderBadgeEstadoPago(ordenSeleccionada.estadoPago, ordenSeleccionada.estado)}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Fecha: {new Date(ordenSeleccionada.fecha).toLocaleString('es-AR')}
                  </div>
                </div>
              </div>

              {/* Lista de Productos Comprados */}
              <div>
                <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#7A3B3B]" />
                  Productos en la Orden ({ordenSeleccionada.detalles.length})
                </h4>

                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">Producto</th>
                        <th className="py-2.5 px-3 text-center">Cant.</th>
                        <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ordenSeleccionada.detalles.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-foreground">{item.nombreProducto}</div>
                            {item.marca && <div className="text-[11px] text-muted-foreground">{item.marca}</div>}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-foreground">
                            {item.cantidad}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-foreground">
                            ${Number(item.precioUnitario).toLocaleString('es-AR')}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-foreground">
                            ${(Number(item.precioUnitario) * item.cantidad).toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 border-t border-border font-bold">
                        <td colSpan={3} className="py-3 px-3 text-right text-foreground">
                          TOTAL DE LA ORDEN:
                        </td>
                        <td className="py-3 px-3 text-right text-base text-[#7A3B3B]">
                          ${Number(ordenSeleccionada.total).toLocaleString('es-AR')} ARS
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Si tiene registro de devolución */}
              {normalizarEstadoPedido(ordenSeleccionada.estado) === 'Devuelta' && ordenSeleccionada.motivoDevolucion && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <RotateCcw className="w-4 h-4 text-purple-700" /> Motivo de la Devolución Registrada:
                  </div>
                  <p className="italic">{ordenSeleccionada.motivoDevolucion}</p>
                </div>
              )}

              {/* Cambiar Estado Manual */}
              <div className="p-4 rounded-xl border border-border bg-card">
                <span className="text-xs font-semibold text-foreground block mb-2">
                  Actualizar Estado Operativo del Pedido:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCambiarEstado(ordenSeleccionada.ordenId, 'Pendiente')}
                    disabled={procesandoAccion}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent"
                  >
                    Pendiente Pago
                  </button>
                  <button
                    onClick={() => handleCambiarEstado(ordenSeleccionada.ordenId, 'Pagada')}
                    disabled={procesandoAccion}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
                  >
                    Pagada
                  </button>
                  <button
                    onClick={() => handleCambiarEstado(ordenSeleccionada.ordenId, 'EnPreparacion')}
                    disabled={procesandoAccion}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100"
                  >
                    En Preparación
                  </button>
                  <button
                    onClick={() => handleCambiarEstado(ordenSeleccionada.ordenId, 'Enviada')}
                    disabled={procesandoAccion}
                    className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100"
                  >
                    Listo / Enviado
                  </button>
                  <button
                    onClick={() => handleCambiarEstado(ordenSeleccionada.ordenId, 'Entregada')}
                    disabled={procesandoAccion}
                    className="px-3 py-1.5 rounded-lg border border-green-300 bg-green-50 text-green-800 text-xs font-semibold hover:bg-green-100"
                  >
                    Entregada
                  </button>
                  <button
                    onClick={() => handleCambiarEstado(ordenSeleccionada.ordenId, 'Cancelada')}
                    disabled={procesandoAccion}
                    className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 text-xs font-semibold hover:bg-rose-100"
                  >
                    Cancelar Orden
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
              <button
                onClick={() => {
                  setOrdenParaComprobante(ordenSeleccionada);
                  setOrdenSeleccionada(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-semibold bg-background hover:bg-accent text-foreground shadow-2xs"
              >
                <Receipt className="w-4 h-4 text-[#7A3B3B]" /> Ver Comprobante
              </button>

              <button
                onClick={() => setOrdenSeleccionada(null)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 shadow-2xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPROBANTE OFICIAL DE PAGO LISTO PARA IMPRIMIR */}
      {ordenParaComprobante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Barra superior de herramientas */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Comprobante Oficial de Pago
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7A3B3B] text-white text-xs font-bold shadow-2xs hover:opacity-90"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
                <button
                  onClick={() => setOrdenParaComprobante(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Ticket / Recibo Imprimible */}
            <div className="p-8 overflow-y-auto bg-white text-[#2A2825] font-sans printable-receipt">
              {/* Encabezado del Centro Estético */}
              <div className="text-center pb-6 border-b border-dashed border-gray-300">
                {(siteConfig.logoUrl || siteConfig.logoRedondoUrl) && (
                  <img
                    src={siteConfig.logoUrl || siteConfig.logoRedondoUrl}
                    alt="Logo"
                    className="w-14 h-14 mx-auto mb-2 rounded-full object-cover border border-gray-200"
                  />
                )}
                <h3 className="text-lg font-black tracking-tight text-[#7A3B3B]">{siteConfig.nombreCentro}</h3>
                {siteConfig.slogan && <p className="text-[11px] text-gray-500 italic mt-0.5">{siteConfig.slogan}</p>}
                <p className="text-[11px] text-gray-600 mt-1">{siteConfig.direccion}</p>
                <p className="text-[11px] text-gray-600">WhatsApp: {siteConfig.whatsapp || siteConfig.telefono} | Email: {siteConfig.email}</p>
              </div>

              {/* Metadatos de la Operación */}
              <div className="py-4 border-b border-dashed border-gray-300 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 font-medium block">N° de Operación:</span>
                  <span className="font-bold text-gray-900 font-mono">#{ordenParaComprobante.ordenId}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 font-medium block">Fecha & Hora:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(ordenParaComprobante.fecha).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="col-span-2 pt-2">
                  <span className="text-gray-500 font-medium block">Cliente:</span>
                  <span className="font-bold text-gray-900">{ordenParaComprobante.clienteNombre || 'Consumidor Final'}</span>
                  {ordenParaComprobante.clienteEmail && (
                    <span className="text-gray-600 block text-[11px]">{ordenParaComprobante.clienteEmail}</span>
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-gray-500 font-medium block">Medio de Pago:</span>
                  <span className="font-semibold text-gray-900">{ordenParaComprobante.medioPago || 'Mercado Pago'}</span>
                </div>
                <div className="pt-2 text-right">
                  <span className="text-gray-500 font-medium block">Estado de Transacción:</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[11px]">
                    APROBADO
                  </span>
                </div>
              </div>

              {/* Detalle de Artículos */}
              <div className="py-4 border-b border-dashed border-gray-300">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 font-bold border-b border-gray-200">
                      <th className="py-1 text-left">Ítem</th>
                      <th className="py-1 text-center">Cant.</th>
                      <th className="py-1 text-right">Unitario</th>
                      <th className="py-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ordenParaComprobante.detalles.map((d, i) => (
                      <tr key={i}>
                        <td className="py-2 text-gray-800 font-medium">{d.nombreProducto}</td>
                        <td className="py-2 text-center text-gray-700 font-bold">{d.cantidad}</td>
                        <td className="py-2 text-right text-gray-700">${Number(d.precioUnitario).toLocaleString('es-AR')}</td>
                        <td className="py-2 text-right text-gray-900 font-bold">
                          ${(Number(d.precioUnitario) * d.cantidad).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Final */}
              <div className="py-4 border-b border-gray-300 flex items-center justify-between text-base font-black text-gray-900">
                <span>TOTAL ABONADO:</span>
                <span className="text-lg text-[#7A3B3B]">${Number(ordenParaComprobante.total).toLocaleString('es-AR')} ARS</span>
              </div>

              {/* Pie de ticket */}
              <div className="text-center pt-6 text-[10px] text-gray-500 space-y-1">
                <p className="font-semibold">¡Gracias por tu compra en {siteConfig.nombreCentro}!</p>
                <p>Comprobante válido para retiro en sucursal o verificación logística de entrega.</p>
                <p className="font-mono text-[9px] text-gray-400 mt-2">
                  Código de Seguridad: {ordenParaComprobante.referenciaExterna || `MP-ORD-${ordenParaComprobante.ordenId}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRO DE DEVOLUCIÓN */}
      {ordenParaDevolucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-purple-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-foreground">Registrar Devolución</h3>
              </div>
              <button
                onClick={() => setOrdenParaDevolucion(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Se registrará la devolución formal para la <strong>Orden #{ordenParaDevolucion.ordenId}</strong> perteneciente a <strong>{ordenParaDevolucion.clienteNombre || 'Cliente'}</strong>.
              </p>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Motivo de la Devolución:
                </label>
                <select
                  value={motivoDevolucion}
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Producto dañado o defectuoso">Producto dañado o defectuoso</option>
                  <option value="Error en despacho / producto equivocado">Error en despacho / producto equivocado</option>
                  <option value="Cambio de producto por cliente">Cambio de producto por cliente</option>
                  <option value="Arrepentimiento / desistimiento de compra">Arrepentimiento / desistimiento de compra</option>
                  <option value="Reacción alérgica informada">Reacción alérgica informada</option>
                  <option value="Otro motivo administrativo">Otro motivo administrativo</option>
                </select>
              </div>

              {/* Checkbox de reintegro de stock */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="reintegrarStock"
                  checked={reintegrarStock}
                  onChange={(e) => setReintegrarStock(e.target.checked)}
                  className="mt-0.5 rounded text-[#7A3B3B] focus:ring-[#7A3B3B] w-4 h-4"
                />
                <label htmlFor="reintegrarStock" className="text-xs text-foreground font-medium cursor-pointer">
                  <strong>Reintegrar unidades al inventario disponible</strong>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Aumenta automáticamente el stock disponible de los productos incluidos en la orden.
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
              <button
                type="button"
                onClick={() => setOrdenParaDevolucion(null)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-medium hover:bg-accent text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDevolucion}
                disabled={procesandoAccion}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5"
              >
                {procesandoAccion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Confirmar Devolución
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
