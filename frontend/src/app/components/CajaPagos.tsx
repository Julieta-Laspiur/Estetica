import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  Banknote,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Scissors,
  ShoppingBag,
  User,
  Check,
  X,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { turnosApi, ordenesApi, pagosApi, type TurnoDto, type OrdenCompraDto } from '../../services/api';

export interface TransaccionCobro {
  id: string;
  codigoOperacion: string;
  tipo: 'servicio' | 'producto' | 'presencial';
  concepto: string;
  detalleAdicional?: string;
  clienteNombre: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  fecha: string; // ISO string
  monto: number;
  medioPago: 'mercadopago' | 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'otro';
  medioDetalle?: string;
  estado: 'Aprobado' | 'Pendiente' | 'Cancelado';
  turnoId?: number;
  ordenId?: number;
  pagoId?: number;
}

export interface CierreCajaRegistro {
  id: string;
  fechaHora: string;
  responsable: string;
  totalEfectivoEsperado: number;
  totalEfectivoReal: number;
  diferenciaEfectivo: number;
  totalMercadoPago: number;
  totalTransferencias: number;
  totalGeneral: number;
  totalServicios: number;
  totalProductos: number;
  cantidadTransacciones: number;
  observaciones?: string;
}

export function CajaPagos() {
  const [transacciones, setTransacciones] = useState<TransaccionCobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoy' | 'semana' | 'mes' | 'personalizado'>('hoy');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [filtroMedio, setFiltroMedio] = useState<'todos' | 'mercadopago' | 'efectivo' | 'transferencia'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'servicio' | 'producto'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Aprobado' | 'Pendiente'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showCobroManualModal, setShowCobroManualModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState<TransaccionCobro | null>(null);

  // Form Cierre de Caja
  const [efectivoContado, setEfectivoContado] = useState<string>('');
  const [observacionesCierre, setObservacionesCierre] = useState<string>('');
  const [historialCierres, setHistorialCierres] = useState<CierreCajaRegistro[]>([]);
  const [verHistorialCierres, setVerHistorialCierres] = useState(false);

  // Form Cobro Manual Mostrador
  const [cobroManualTipo, setCobroManualTipo] = useState<'servicio' | 'producto'>('servicio');
  const [cobroManualConcepto, setCobroManualConcepto] = useState('');
  const [cobroManualCliente, setCobroManualCliente] = useState('');
  const [cobroManualMonto, setCobroManualMonto] = useState('');
  const [cobroManualMedio, setCobroManualMedio] = useState<'efectivo' | 'mercadopago' | 'transferencia'>('efectivo');
  const [cobroManualAcreditarEstampita, setCobroManualAcreditarEstampita] = useState(true);
  const [guardandoCobroManual, setGuardandoCobroManual] = useState(false);

  const notificar = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Cargar datos consolidados
  const cargarTransacciones = useCallback(async () => {
    setLoading(true);
    try {
      const itemsConsolidados: TransaccionCobro[] = [];

      // 1. Cargar Turnos desde API y localStorage
      try {
        const turnosApiRes: TurnoDto[] = await turnosApi.getTurnos();
        if (turnosApiRes && Array.isArray(turnosApiRes)) {
          turnosApiRes.forEach((t) => {
            const servicioNombre = t.servicios && t.servicios.length > 0
              ? t.servicios.map(s => s.nombre).join(', ')
              : 'Tratamiento Estético';

            // Mapear medio de pago si existe
            let medio: TransaccionCobro['medioPago'] = 'efectivo';
            if (t.motivo && t.motivo.toLowerCase().includes('mercadopago')) {
              medio = 'mercadopago';
            }

            const estadoStr: TransaccionCobro['estado'] =
              t.estado === 1 || t.estado === 'Confirmado' || t.estado === 'Completado'
                ? 'Aprobado'
                : 'Pendiente';

            itemsConsolidados.push({
              id: `TRN-${t.turnoId}`,
              codigoOperacion: `TRN-${t.turnoId}`,
              tipo: 'servicio',
              concepto: `Turno: ${servicioNombre}`,
              detalleAdicional: `Profesional: ${t.profesionalNombreCompleto} • ${t.cabinaNombre || 'Cabina'}`,
              clienteNombre: t.clienteNombreCompleto || 'Cliente Registrado',
              fecha: t.fechaHoraInicio || new Date().toISOString(),
              monto: t.total || 0,
              medioPago: medio,
              medioDetalle: medio === 'mercadopago' ? 'Mercado Pago' : 'Efectivo en mostrador',
              estado: estadoStr,
              turnoId: t.turnoId,
            });
          });
        }
      } catch (err) {
        console.warn('Turnos API no disponible para caja, usando almacenamiento local:', err);
      }

      // Turnos locales de cliente
      try {
        const turnosLocales = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
        turnosLocales.forEach((tl: any) => {
          // Evitar duplicados si ya vino por API
          const existe = itemsConsolidados.some(i => i.id === `TRN-${tl.turnoId}`);
          if (!existe) {
            const servNombre = tl.servicios && tl.servicios[0]?.nombre
              ? tl.servicios[0].nombre
              : (tl.servicio?.nombre || 'Tratamiento');

            const medio = tl.metodoPago === 'mercadopago' ? 'mercadopago' : 'efectivo';
            itemsConsolidados.push({
              id: `TRN-${tl.turnoId}`,
              codigoOperacion: tl.codigoOperacion || `MP-${Math.floor(100000000 + Math.random() * 900000000)}`,
              tipo: 'servicio',
              concepto: `Turno: ${servNombre}`,
              detalleAdicional: `Profesional: ${tl.profesionalNombreCompleto || tl.profesional?.nombre || 'Especialista'}`,
              clienteNombre: tl.clienteNombreCompleto || 'Cliente Web',
              fecha: tl.fechaHoraInicio || (tl.fecha ? `${tl.fecha}T${tl.hora || '12:00'}:00` : new Date().toISOString()),
              monto: tl.total || 0,
              medioPago: medio,
              medioDetalle: tl.detallePagoGuardado || tl.medioDetalle || (medio === 'mercadopago' ? 'Mercado Pago Checkout' : 'Efectivo en mostrador'),
              estado: tl.estado === 'Confirmado' || tl.estado === 'Completado' ? 'Aprobado' : 'Pendiente',
              turnoId: typeof tl.turnoId === 'number' ? tl.turnoId : undefined,
            });
          }
        });
      } catch (e) {
        console.error('Error parseando turnos locales:', e);
      }

      // 2. Cargar Órdenes de Compra (Productos)
      try {
        const ordenesApiRes: OrdenCompraDto[] = await ordenesApi.getOrdenesAdmin();
        if (ordenesApiRes && Array.isArray(ordenesApiRes)) {
          ordenesApiRes.forEach((o) => {
            const prodsNombre = o.detalles && o.detalles.length > 0
              ? o.detalles.map(d => `${d.nombreProducto} (x${d.cantidad})`).join(', ')
              : 'Productos cosméticos';

            const estNorm = String(o.estado).toLowerCase();
            const esPagado = o.estado === 1 || o.estado === '1' || estNorm.includes('pag') || estNorm.includes('entreg') || estNorm.includes('env') || estNorm.includes('aprob');
            const esCancelado = o.estado === 5 || o.estado === '5' || estNorm.includes('canc');

            itemsConsolidados.push({
              id: `ORD-${o.ordenId}`,
              codigoOperacion: `ORD-${o.ordenId}`,
              tipo: 'producto',
              concepto: `Venta: ${prodsNombre}`,
              detalleAdicional: `${o.detalles?.length || 1} producto(s) entregado(s)`,
              clienteNombre: o.clienteNombre || 'Cliente Tienda',
              clienteEmail: o.clienteEmail,
              fecha: o.fecha || new Date().toISOString(),
              monto: o.total || 0,
              medioPago: 'mercadopago',
              medioDetalle: 'Mercado Pago Tienda',
              estado: esPagado ? 'Aprobado' : (esCancelado ? 'Cancelado' : 'Pendiente'),
              ordenId: o.ordenId,
            });
          });
        }
      } catch {
        // Fallback local
      }

      // Órdenes locales de productos
      try {
        const ordenesLocales = JSON.parse(localStorage.getItem('estetica_ordenes_productos') || '[]');
        ordenesLocales.forEach((ol: any) => {
          const existe = itemsConsolidados.some(i => i.id === `ORD-${ol.ordenId}`);
          if (!existe) {
            const prodsNombre = ol.detalles && ol.detalles.length > 0
              ? ol.detalles.map((d: any) => `${d.nombreProducto} (x${d.cantidad})`).join(', ')
              : 'Productos cosméticos';

            const estNorm = String(ol.estado).toLowerCase();
            const esPagado = ol.estado === 1 || ol.estado === '1' || estNorm.includes('pag') || estNorm.includes('entreg') || estNorm.includes('env') || estNorm.includes('aprob');
            const esCancelado = ol.estado === 5 || ol.estado === '5' || estNorm.includes('canc');

            itemsConsolidados.push({
              id: `ORD-${ol.ordenId}`,
              codigoOperacion: ol.codigoOperacion || `ORD-${ol.ordenId}`,
              tipo: 'producto',
              concepto: `Venta: ${prodsNombre}`,
              detalleAdicional: `${ol.detalles?.length || 1} ítem(s) en pedido`,
              clienteNombre: ol.clienteNombre || 'Cliente Web',
              fecha: ol.fecha || new Date().toISOString(),
              monto: ol.total || 0,
              medioPago: ol.medioPago || 'mercadopago',
              medioDetalle: ol.medioDetalle || 'Mercado Pago',
              estado: esPagado ? 'Aprobado' : (esCancelado ? 'Cancelado' : 'Pendiente'),
              ordenId: typeof ol.ordenId === 'number' ? ol.ordenId : undefined,
            });
          }
        });
      } catch (e) {
        console.error('Error parseando órdenes locales:', e);
      }

      // 3. Pagos registrados manualmente / presenciales en mostrador
      try {
        const pagosManuales = JSON.parse(localStorage.getItem('estetica_pagos_manuales') || '[]');
        pagosManuales.forEach((pm: any) => {
          itemsConsolidados.push(pm);
        });
      } catch (e) {
        console.error('Error parseando pagos manuales:', e);
      }

      // Ordenar de más reciente a más antiguo
      itemsConsolidados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setTransacciones(itemsConsolidados);
    } catch (err) {
      console.error('Error cargando transacciones de caja:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarTransacciones();
    // Cargar historial de cierres
    try {
      const historicos = JSON.parse(localStorage.getItem('estetica_cierres_caja') || '[]');
      setHistorialCierres(historicos);
    } catch {}
  }, [cargarTransacciones]);

  // Filtrado de transacciones
  const transaccionesFiltradas = useMemo(() => {
    const ahora = new Date();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
    const hoyFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);

    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - ahora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);

    return transacciones.filter(t => {
      const fechaT = new Date(t.fecha);

      // Filtro de fecha / período
      if (filtroPeriodo === 'hoy') {
        if (fechaT < hoyInicio || fechaT > hoyFin) return false;
      } else if (filtroPeriodo === 'semana') {
        if (fechaT < inicioSemana) return false;
      } else if (filtroPeriodo === 'mes') {
        if (fechaT < inicioMes) return false;
      } else if (filtroPeriodo === 'personalizado') {
        if (fechaDesde) {
          const dDesde = new Date(fechaDesde + 'T00:00:00');
          if (fechaT < dDesde) return false;
        }
        if (fechaHasta) {
          const dHasta = new Date(fechaHasta + 'T23:59:59');
          if (fechaT > dHasta) return false;
        }
      }

      // Filtro de medio de pago
      if (filtroMedio !== 'todos') {
        if (filtroMedio === 'mercadopago' && t.medioPago !== 'mercadopago') return false;
        if (filtroMedio === 'efectivo' && t.medioPago !== 'efectivo') return false;
        if (filtroMedio === 'transferencia' && t.medioPago !== 'transferencia') return false;
      }

      // Filtro de concepto / tipo
      if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) {
        return false;
      }

      // Filtro de estado
      if (filtroEstado !== 'todos' && t.estado !== filtroEstado) {
        return false;
      }

      // Filtro de búsqueda por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const coincide =
          t.concepto.toLowerCase().includes(query) ||
          t.clienteNombre.toLowerCase().includes(query) ||
          t.codigoOperacion.toLowerCase().includes(query) ||
          (t.detalleAdicional && t.detalleAdicional.toLowerCase().includes(query));
        if (!coincide) return false;
      }

      return true;
    });
  }, [transacciones, filtroPeriodo, fechaDesde, fechaHasta, filtroMedio, filtroTipo, filtroEstado, searchTerm]);

  // Cálculos de métricas consolidadas
  const metricas = useMemo(() => {
    const ahora = new Date();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
    const hoyFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);

    // Métricas del Día de Hoy
    const hoyItems = transacciones.filter(t => {
      const f = new Date(t.fecha);
      return f >= hoyInicio && f <= hoyFin && t.estado === 'Aprobado';
    });

    const totalHoy = hoyItems.reduce((acc, t) => acc + t.monto, 0);
    const efectivoHoy = hoyItems.filter(t => t.medioPago === 'efectivo').reduce((acc, t) => acc + t.monto, 0);
    const mercadoPagoHoy = hoyItems.filter(t => t.medioPago === 'mercadopago').reduce((acc, t) => acc + t.monto, 0);
    const transferenciasHoy = hoyItems.filter(t => t.medioPago === 'transferencia').reduce((acc, t) => acc + t.monto, 0);
    const serviciosHoy = hoyItems.filter(t => t.tipo === 'servicio').reduce((acc, t) => acc + t.monto, 0);
    const productosHoy = hoyItems.filter(t => t.tipo === 'producto').reduce((acc, t) => acc + t.monto, 0);

    // Métricas del Mes en Curso
    const mesItems = transacciones.filter(t => {
      const f = new Date(t.fecha);
      return f >= inicioMes && t.estado === 'Aprobado';
    });
    const totalMes = mesItems.reduce((acc, t) => acc + t.monto, 0);
    const serviciosMes = mesItems.filter(t => t.tipo === 'servicio').reduce((acc, t) => acc + t.monto, 0);
    const productosMes = mesItems.filter(t => t.tipo === 'producto').reduce((acc, t) => acc + t.monto, 0);

    // Métricas sobre la vista filtrada actualmente
    const totalFiltrado = transaccionesFiltradas
      .filter(t => t.estado === 'Aprobado')
      .reduce((acc, t) => acc + t.monto, 0);

    const pendientesFiltradas = transaccionesFiltradas.filter(t => t.estado === 'Pendiente');
    const montoPendiente = pendientesFiltradas.reduce((acc, t) => acc + t.monto, 0);

    return {
      totalHoy,
      efectivoHoy,
      mercadoPagoHoy,
      transferenciasHoy,
      serviciosHoy,
      productosHoy,
      transaccionesHoyCount: hoyItems.length,
      ticketPromedioHoy: hoyItems.length > 0 ? Math.round(totalHoy / hoyItems.length) : 0,
      totalMes,
      serviciosMes,
      productosMes,
      totalFiltrado,
      montoPendiente,
      cantidadPendientes: pendientesFiltradas.length,
    };
  }, [transacciones, transaccionesFiltradas]);

  // Acción: Confirmar cobro pendiente (ej: turno pagado por MP o en mostrador)
  const handleConfirmarCobro = async (transaccion: TransaccionCobro) => {
    try {
      if (transaccion.turnoId) {
        await turnosApi.confirmar(transaccion.turnoId);
      }

      // Actualizar estado local
      setTransacciones(prev =>
        prev.map(t => (t.id === transaccion.id ? { ...t, estado: 'Aprobado' } : t))
      );

      // Actualizar en localStorage si corresponde
      try {
        const turnosLocales = JSON.parse(localStorage.getItem('estetica_reservas_cliente') || '[]');
        const actualizados = turnosLocales.map((tl: any) =>
          `TRN-${tl.turnoId}` === transaccion.id ? { ...tl, estado: 'Confirmado' } : tl
        );
        localStorage.setItem('estetica_reservas_cliente', JSON.stringify(actualizados));
      } catch {}

      notificar(`Cobro de ${transaccion.concepto} confirmado exitosamente.`);
    } catch {
      // Fallback local
      setTransacciones(prev =>
        prev.map(t => (t.id === transaccion.id ? { ...t, estado: 'Aprobado' } : t))
      );
      notificar(`Cobro marcado como Aprobado en caja.`);
    }
  };

  // Guardar Cierre de Caja Diario
  const handleGuardarCierreCaja = () => {
    const contadoNum = parseFloat(efectivoContado) || 0;
    const diferencia = contadoNum - metricas.efectivoHoy;

    const nuevoCierre: CierreCajaRegistro = {
      id: `CIERRE-${Date.now()}`,
      fechaHora: new Date().toISOString(),
      responsable: 'Administradora de Turno',
      totalEfectivoEsperado: metricas.efectivoHoy,
      totalEfectivoReal: contadoNum,
      diferenciaEfectivo: diferencia,
      totalMercadoPago: metricas.mercadoPagoHoy,
      totalTransferencias: metricas.transferenciasHoy,
      totalGeneral: metricas.totalHoy,
      totalServicios: metricas.serviciosHoy,
      totalProductos: metricas.productosHoy,
      cantidadTransacciones: metricas.transaccionesHoyCount,
      observaciones: observacionesCierre.trim() || undefined,
    };

    const nuevosHistoricos = [nuevoCierre, ...historialCierres];
    setHistorialCierres(nuevosHistoricos);
    localStorage.setItem('estetica_cierres_caja', JSON.stringify(nuevosHistoricos));

    setShowCierreModal(false);
    setEfectivoContado('');
    setObservacionesCierre('');
    notificar('Cierre de caja registrado exitosamente con arqueo completo.');
  };

  // Guardar Cobro Manual en Mostrador
  const handleGuardarCobroManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cobroManualConcepto || !cobroManualMonto) {
      alert('Por favor completá concepto y monto.');
      return;
    }

    setGuardandoCobroManual(true);
    const montoNum = parseFloat(cobroManualMonto);
    const nuevoId = `COB-${Date.now()}`;

    try {
      if (cobroManualAcreditarEstampita) {
        // Conectar con backend presencial
        try {
          await pagosApi.registrarPresencial({
            monto: montoNum,
            notasComprobante: `${cobroManualConcepto} (${cobroManualCliente})`,
            metodoPago: cobroManualMedio === 'efectivo' ? 1 : 0,
            acreditarEstampitaDirectamente: true,
          });
        } catch {
          // Fallback offline
        }
      }

      const nuevaTransaccion: TransaccionCobro = {
        id: nuevoId,
        codigoOperacion: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        tipo: cobroManualTipo,
        concepto: cobroManualConcepto,
        detalleAdicional: `Cobro manual en mostrador • ${cobroManualAcreditarEstampita ? 'Estampita acreditada' : 'Sin estampita'}`,
        clienteNombre: cobroManualCliente || 'Cliente Mostrador',
        fecha: new Date().toISOString(),
        monto: montoNum,
        medioPago: cobroManualMedio,
        medioDetalle: cobroManualMedio === 'mercadopago' ? 'Mercado Pago QR' : (cobroManualMedio === 'transferencia' ? 'Transferencia Bancaria' : 'Efectivo en Caja'),
        estado: 'Aprobado',
      };

      const existentes = JSON.parse(localStorage.getItem('estetica_pagos_manuales') || '[]');
      localStorage.setItem('estetica_pagos_manuales', JSON.stringify([nuevaTransaccion, ...existentes]));

      setTransacciones(prev => [nuevaTransaccion, ...prev]);
      setShowCobroManualModal(false);
      setCobroManualConcepto('');
      setCobroManualCliente('');
      setCobroManualMonto('');
      notificar('Cobro registrado en caja exitosamente.');
    } finally {
      setGuardandoCobroManual(false);
    }
  };

  // Exportar / Imprimir
  const handleImprimirReporte = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast de Éxito */}
      {mensajeExito && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3C3530] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-[#EDE8E1]/20 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{mensajeExito}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-[#7A3B3B] text-white rounded-xl shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A2825]">Caja & Gestión de Pagos</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#8A7F74]">
            Consolidación unificada de cobros (turnos + productos), filtros por fecha y medio de pago, arqueo y cierre de caja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setRefreshing(true);
              cargarTransacciones();
            }}
            disabled={loading || refreshing}
            className="p-2.5 bg-white border border-[#EDE8E1] rounded-xl hover:bg-[#FAF8F5] text-[#8A7F74] transition-colors"
            title="Refrescar movimientos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#7A3B3B]' : ''}`} />
          </button>

          <button
            onClick={() => setShowCobroManualModal(true)}
            className="flex items-center gap-2 bg-[#3C3530] hover:bg-[#2A2825] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#EDE8E1]" />
            <span>Cobro en Mostrador</span>
          </button>

          <button
            onClick={() => setShowCierreModal(true)}
            className="flex items-center gap-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Cierre de Caja Diario</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE CIERRE DE CAJA & MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Total Recaudado Hoy */}
        <div className="bg-white border border-[#EDE8E1] rounded-3xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#8A7F74] font-bold uppercase tracking-wider mb-2">
            <span>Recaudación de Hoy</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-[#2A2825] mb-2">
            ${metricas.totalHoy.toLocaleString('es-AR')}
            <span className="text-xs font-semibold text-[#8A7F74] ml-1">ARS</span>
          </div>

          <div className="pt-2 border-t border-[#F5F2EB] space-y-1 text-xs">
            <div className="flex justify-between items-center text-[#5A524A]">
              <span className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Efectivo:
              </span>
              <span className="font-bold text-[#2A2825]">${metricas.efectivoHoy.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-[#5A524A]">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#009EE3]" /> Mercado Pago:
              </span>
              <span className="font-bold text-[#009EE3]">${metricas.mercadoPagoHoy.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Total Recaudado del Mes */}
        <div className="bg-white border border-[#EDE8E1] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8A7F74] font-bold uppercase tracking-wider mb-2">
            <span>Recaudación del Mes</span>
            <TrendingUp className="w-4 h-4 text-[#7A3B3B]" />
          </div>
          <div className="text-3xl font-black text-[#7A3B3B] mb-2">
            ${metricas.totalMes.toLocaleString('es-AR')}
            <span className="text-xs font-semibold text-[#8A7F74] ml-1">ARS</span>
          </div>

          <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between text-xs text-[#5A524A]">
            <span>Mes en curso</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Activo
            </span>
          </div>
        </div>

        {/* Tarjeta 3: Desglose Servicios vs Productos */}
        <div className="bg-white border border-[#EDE8E1] rounded-3xl p-5 shadow-xs">
          <div className="text-xs text-[#8A7F74] font-bold uppercase tracking-wider mb-2">
            Servicios vs Productos
          </div>
          <div className="space-y-2 mt-1">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1 text-[#3C3530]">
                  <Scissors className="w-3 h-3 text-[#7A3B3B]" /> Turnos/Servicios:
                </span>
                <span className="font-bold text-[#7A3B3B]">
                  ${metricas.serviciosHoy.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="w-full bg-[#EDE8E1] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#7A3B3B] h-full"
                  style={{
                    width: `${metricas.totalHoy > 0 ? (metricas.serviciosHoy / metricas.totalHoy) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1 text-[#3C3530]">
                  <ShoppingBag className="w-3 h-3 text-[#009EE3]" /> Productos:
                </span>
                <span className="font-bold text-[#009EE3]">
                  ${metricas.productosHoy.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="w-full bg-[#EDE8E1] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#009EE3] h-full"
                  style={{
                    width: `${metricas.totalHoy > 0 ? (metricas.productosHoy / metricas.totalHoy) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 4: Transacciones & Pendientes */}
        <div className="bg-white border border-[#EDE8E1] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8A7F74] font-bold uppercase tracking-wider mb-2">
            <span>Operaciones del Día</span>
            <Clock className="w-4 h-4 text-[#8A7F74]" />
          </div>
          <div className="text-3xl font-black text-[#2A2825] mb-2">
            {metricas.transaccionesHoyCount}
            <span className="text-xs font-semibold text-[#8A7F74] ml-1.5">cobros</span>
          </div>

          <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between text-xs">
            <span className="text-[#8A7F74]">Ticket Promedio:</span>
            <span className="font-bold text-[#3C3530]">${metricas.ticketPromedioHoy.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS DINÁMICOS */}
      <div className="bg-white border border-[#EDE8E1] rounded-3xl p-5 shadow-xs space-y-4">
        {/* Fila 1: Pestañas de Período y Buscador */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Selector de Período */}
          <div className="inline-flex bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#EDE8E1] self-start">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Esta Semana' },
              { id: 'mes', label: 'Este Mes' },
              { id: 'personalizado', label: 'Personalizado' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setFiltroPeriodo(p.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filtroPeriodo === p.id
                    ? 'bg-[#7A3B3B] text-white shadow-xs'
                    : 'text-[#8A7F74] hover:text-[#2A2825]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
            <input
              type="text"
              placeholder="Buscar por cliente, código, tratamiento o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3B3B] text-[#2A2825]"
            />
          </div>
        </div>

        {/* Fila 2: Rango personalizado si aplica */}
        {filtroPeriodo === 'personalizado' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#EDE8E1] text-xs">
            <span className="font-bold text-[#3C3530] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7A3B3B]" /> Rango de Fechas:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[#8A7F74]">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#EDE8E1] rounded-xl text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[#8A7F74]">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#EDE8E1] rounded-xl text-xs"
              />
            </div>
          </div>
        )}

        {/* Fila 3: Filtros por Medio de Pago, Tipo y Estado */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F5F2EB] text-xs">
          {/* Medio de Pago */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#8A7F74]">Medio:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'mercadopago', label: 'Mercado Pago', color: 'text-[#009EE3]' },
              { id: 'efectivo', label: 'Efectivo', color: 'text-emerald-700' },
              { id: 'transferencia', label: 'Transferencia', color: 'text-purple-700' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setFiltroMedio(m.id as any)}
                className={`px-3 py-1 rounded-xl font-medium transition-all ${
                  filtroMedio === m.id
                    ? 'bg-[#3C3530] text-white font-bold shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#5A524A] hover:bg-[#EDE8E1]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Tipo / Concepto */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#8A7F74]">Concepto:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'servicio', label: 'Servicios/Turnos' },
              { id: 'producto', label: 'Productos' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFiltroTipo(t.id as any)}
                className={`px-3 py-1 rounded-xl font-medium transition-all ${
                  filtroTipo === t.id
                    ? 'bg-[#7A3B3B] text-white font-bold shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#5A524A] hover:bg-[#EDE8E1]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#8A7F74]">Estado:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'Aprobado', label: 'Aprobados' },
              { id: 'Pendiente', label: 'Pendientes' },
            ].map(e => (
              <button
                key={e.id}
                onClick={() => setFiltroEstado(e.id as any)}
                className={`px-3 py-1 rounded-xl font-medium transition-all ${
                  filtroEstado === e.id
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#5A524A] hover:bg-[#EDE8E1]'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>

          {/* Botones de Historial y Exportar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVerHistorialCierres(!verHistorialCierres)}
              className="px-3 py-1.5 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] font-semibold flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-[#7A3B3B]" />
              <span>{verHistorialCierres ? 'Ver Transacciones' : 'Historial de Cierres'}</span>
            </button>

            <button
              onClick={handleImprimirReporte}
              className="px-3 py-1.5 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-[#3C3530] font-semibold flex items-center gap-1.5"
              title="Imprimir resumen o reporte de caja"
            >
              <Printer className="w-3.5 h-3.5 text-[#7A3B3B]" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* VISTA DE HISTORIAL DE CIERRES DE CAJA GUARDADOS */}
      {verHistorialCierres ? (
        <div className="bg-white border border-[#EDE8E1] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
            <div>
              <h3 className="font-bold text-lg text-[#2A2825]">Historial de Cierres de Caja Guardados</h3>
              <p className="text-xs text-[#8A7F74]">Registro de arqueos de caja efectuados con fecha, efectivo real y discrepancias</p>
            </div>
            <button
              onClick={() => setVerHistorialCierres(false)}
              className="text-xs text-[#7A3B3B] font-bold hover:underline"
            >
              ← Volver a Libro de Cobros
            </button>
          </div>

          {historialCierres.length === 0 ? (
            <div className="py-12 text-center text-[#8A7F74] text-xs">
              No hay cierres de caja guardados aún. Hacé clic en "Cierre de Caja Diario" para generar el primero.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDE8E1] bg-[#FAF8F5] text-[#8A7F74] uppercase font-bold">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4 text-right">Efectivo Sistema</th>
                    <th className="py-3 px-4 text-right">Efectivo Real</th>
                    <th className="py-3 px-4 text-right">Diferencia</th>
                    <th className="py-3 px-4 text-right">Mercado Pago</th>
                    <th className="py-3 px-4 text-right">Total General</th>
                    <th className="py-3 px-4 text-center">Transacciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE8E1]">
                  {historialCierres.map(cierre => (
                    <tr key={cierre.id} className="hover:bg-[#FAF8F5]/80">
                      <td className="py-3.5 px-4 font-semibold text-[#2A2825]">
                        {new Date(cierre.fechaHora).toLocaleString('es-AR')}
                      </td>
                      <td className="py-3.5 px-4 text-[#5A524A]">{cierre.responsable}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#3C3530]">
                        ${cierre.totalEfectivoEsperado.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-800">
                        ${cierre.totalEfectivoReal.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        {cierre.diferenciaEfectivo === 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Exacto</span>
                        ) : cierre.diferenciaEfectivo > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +${cierre.diferenciaEfectivo.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                            -${Math.abs(cierre.diferenciaEfectivo).toLocaleString('es-AR')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#009EE3]">
                        ${cierre.totalMercadoPago.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-base text-[#7A3B3B]">
                        ${cierre.totalGeneral.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-[#FAF8F5] border border-[#EDE8E1] px-2.5 py-1 rounded-full font-bold text-[#3C3530]">
                          {cierre.cantidadTransacciones}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TABLA CONSOLIDADA DE MOVIMIENTOS Y COBROS */
        <div className="bg-white border border-[#EDE8E1] rounded-3xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#EDE8E1] flex items-center justify-between bg-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#7A3B3B]" />
              <h3 className="font-bold text-base text-[#2A2825]">Libro Diario de Cobros Consolidados</h3>
              <span className="text-xs bg-[#EDE8E1] text-[#3C3530] font-bold px-2 py-0.5 rounded-full">
                {transaccionesFiltradas.length} movimientos
              </span>
            </div>

            <div className="text-xs font-semibold text-[#8A7F74]">
              Total Filtrado: <strong className="text-[#7A3B3B] text-sm">${metricas.totalFiltrado.toLocaleString('es-AR')} ARS</strong>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#8A7F74]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7A3B3B]" />
              Cargando movimientos de caja...
            </div>
          ) : transaccionesFiltradas.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8A7F74]">
              No se encontraron cobros registrados con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDE8E1] bg-white text-[#8A7F74] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Código / ID</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Concepto / Detalle</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Medio de Pago</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE8E1]">
                  {transaccionesFiltradas.map((t) => {
                    const isMercadoPago = t.medioPago === 'mercadopago';
                    const isEfectivo = t.medioPago === 'efectivo';
                    const isAprobado = t.estado === 'Aprobado';

                    return (
                      <tr key={t.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        {/* ID / Código Operación */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[#3C3530]">
                          {t.codigoOperacion || t.id}
                        </td>

                        {/* Fecha y Hora */}
                        <td className="py-3.5 px-4 text-[#5A524A] whitespace-nowrap">
                          {new Date(t.fecha).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                          <span className="block text-[11px] text-[#8A7F74]">
                            {new Date(t.fecha).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} hs
                          </span>
                        </td>

                        {/* Concepto */}
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="flex items-center gap-1.5 font-bold text-[#2A2825]">
                            {t.tipo === 'servicio' ? (
                              <Scissors className="w-3.5 h-3.5 text-[#7A3B3B] shrink-0" />
                            ) : (
                              <ShoppingBag className="w-3.5 h-3.5 text-[#009EE3] shrink-0" />
                            )}
                            <span>{t.concepto}</span>
                          </div>
                          {t.detalleAdicional && (
                            <span className="block text-[11px] text-[#8A7F74] mt-0.5 truncate max-w-xs">
                              {t.detalleAdicional}
                            </span>
                          )}
                        </td>

                        {/* Cliente */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#3C3530]">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[#8A7F74]" />
                            <span>{t.clienteNombre}</span>
                          </div>
                        </td>

                        {/* Medio de Pago */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isMercadoPago ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#009EE3]/10 text-[#009EE3] border border-[#009EE3]/20">
                              <CreditCard className="w-3 h-3" />
                              <span>Mercado Pago</span>
                            </span>
                          ) : isEfectivo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Banknote className="w-3 h-3" />
                              <span>Efectivo Mostrador</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Transferencia</span>
                            </span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isAprobado ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3" /> Aprobado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>

                        {/* Monto */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-extrabold text-sm text-[#2A2825]">
                            ${t.monto.toLocaleString('es-AR')}
                          </span>
                          <span className="block text-[10px] text-[#8A7F74]">ARS</span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isAprobado && (
                              <button
                                onClick={() => handleConfirmarCobro(t)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-colors shadow-2xs"
                                title="Confirmar cobro y acreditar en caja"
                              >
                                Confirmar Cobro
                              </button>
                            )}

                            <button
                              onClick={() => setShowDetalleModal(t)}
                              className="p-1.5 text-[#5A524A] hover:text-[#7A3B3B] hover:bg-white rounded-lg border border-[#EDE8E1] transition-colors"
                              title="Ver detalle de transacción"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CIERRE DE CAJA DIARIO (ARQUEO) */}
      {showCierreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#EDE8E1] shadow-2xl overflow-hidden">
            <div className="bg-[#7A3B3B] p-6 text-white text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold">
                <Receipt className="w-3.5 h-3.5" />
                <span>Acta de Cierre de Caja</span>
              </div>
              <h3 className="text-xl font-bold">Arqueo y Cierre Diario</h3>
              <p className="text-xs text-white/80">
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Resumen del Sistema */}
              <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-4 space-y-2 text-xs">
                <span className="font-bold text-[#2A2825] uppercase tracking-wider block mb-1">
                  Totales Registrados por el Sistema:
                </span>
                <div className="flex justify-between text-[#5A524A]">
                  <span className="flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-700" /> Efectivo Esperado en Mostrador:
                  </span>
                  <strong className="text-emerald-900 font-bold">${metricas.efectivoHoy.toLocaleString('es-AR')}</strong>
                </div>
                <div className="flex justify-between text-[#5A524A]">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#009EE3]" /> Mercado Pago (Digital):
                  </span>
                  <strong className="text-[#009EE3] font-bold">${metricas.mercadoPagoHoy.toLocaleString('es-AR')}</strong>
                </div>
                <div className="flex justify-between text-[#5A524A]">
                  <span>Transferencias Bancarias:</span>
                  <strong className="font-bold">${metricas.transferenciasHoy.toLocaleString('es-AR')}</strong>
                </div>
                <div className="pt-2 border-t border-[#EDE8E1] flex justify-between font-black text-sm text-[#2A2825]">
                  <span>Total Recaudado Hoy:</span>
                  <span className="text-[#7A3B3B]">${metricas.totalHoy.toLocaleString('es-AR')} ARS</span>
                </div>
              </div>

              {/* Campo para ingresar Efectivo Real Contado */}
              <div>
                <label className="block text-xs font-bold text-[#3C3530] mb-1">
                  Efectivo Físico Contado en Caja ($ ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Ej: ${metricas.efectivoHoy}`}
                  value={efectivoContado}
                  onChange={(e) => setEfectivoContado(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-sm font-bold text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                />
                {efectivoContado && (
                  <div className="mt-2 text-xs">
                    {parseFloat(efectivoContado) === metricas.efectivoHoy ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ¡Caja cuadrada perfectamente! Sin diferencias.
                      </span>
                    ) : parseFloat(efectivoContado) > metricas.efectivoHoy ? (
                      <span className="text-emerald-700 font-semibold">
                        Sobrante de caja: +${(parseFloat(efectivoContado) - metricas.efectivoHoy).toLocaleString('es-AR')} ARS
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold">
                        Faltante en caja: -${(metricas.efectivoHoy - parseFloat(efectivoContado)).toLocaleString('es-AR')} ARS
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Notas del cierre */}
              <div>
                <label className="block text-xs font-bold text-[#3C3530] mb-1">
                  Observaciones / Notas del Cierre
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Se retiró efectivo para compras menores, fondo de cambio inicial $5.000..."
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCierreModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE8E1] text-[#5A524A] hover:bg-[#FAF8F5] text-xs font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleGuardarCierreCaja}
                  className="flex-1 py-3 rounded-xl bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar & Guardar Cierre de Caja</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRO DE COBRO MANUAL EN MOSTRADOR */}
      {showCobroManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#EDE8E1] shadow-2xl overflow-hidden">
            <div className="bg-[#3C3530] p-6 text-white text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Cobro Presencial</span>
              </div>
              <h3 className="text-xl font-bold">Registrar Cobro en Mostrador</h3>
              <p className="text-xs text-white/80">Ingreso directo para turno o producto en caja</p>
            </div>

            <form onSubmit={handleGuardarCobroManual} className="p-6 space-y-4">
              {/* Selector de Tipo */}
              <div>
                <label className="block text-xs font-bold text-[#3C3530] mb-1">Tipo de Ingreso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCobroManualTipo('servicio')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      cobroManualTipo === 'servicio'
                        ? 'border-[#7A3B3B] bg-[#7A3B3B]/10 text-[#7A3B3B]'
                        : 'border-[#EDE8E1] text-[#5A524A]'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Turno / Servicio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCobroManualTipo('producto')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      cobroManualTipo === 'producto'
                        ? 'border-[#009EE3] bg-[#009EE3]/10 text-[#009EE3]'
                        : 'border-[#EDE8E1] text-[#5A524A]'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Venta Producto</span>
                  </button>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-xs font-bold text-[#3C3530] mb-1">Concepto / Detalle *</label>
                <input
                  type="text"
                  required
                  placeholder={cobroManualTipo === 'servicio' ? 'Ej: Limpieza Facial Profunda' : 'Ej: Sérum Vitamina C x1'}
                  value={cobroManualConcepto}
                  onChange={(e) => setCobroManualConcepto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                />
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-bold text-[#3C3530] mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  placeholder="Ej: Lucía Benítez"
                  value={cobroManualCliente}
                  onChange={(e) => setCobroManualCliente(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825]"
                />
              </div>

              {/* Monto y Medio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3C3530] mb-1">Monto ($ ARS) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="4500"
                    value={cobroManualMonto}
                    onChange={(e) => setCobroManualMonto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-bold text-[#2A2825]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3C3530] mb-1">Medio de Pago</label>
                  <select
                    value={cobroManualMedio}
                    onChange={(e) => setCobroManualMedio(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs font-semibold text-[#2A2825]"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="mercadopago">Mercado Pago (QR/Link)</option>
                    <option value="transferencia">Transferencia CVU</option>
                  </select>
                </div>
              </div>

              {/* Acreditar estampita de fidelización */}
              <div className="p-3 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#2A2825] block">Acreditar Estampita Fidelización</span>
                  <span className="text-[11px] text-[#8A7F74]">Suma 1 punto al programa de premios</span>
                </div>
                <input
                  type="checkbox"
                  checked={cobroManualAcreditarEstampita}
                  onChange={(e) => setCobroManualAcreditarEstampita(e.target.checked)}
                  className="w-4 h-4 text-[#7A3B3B] rounded"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCobroManualModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE8E1] text-[#5A524A] hover:bg-[#FAF8F5] text-xs font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoCobroManual}
                  className="flex-1 py-3 rounded-xl bg-[#3C3530] hover:bg-[#2A2825] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{guardandoCobroManual ? 'Guardando...' : 'Acreditar Cobro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DETALLE / RECIBO DE TRANSACCIÓN */}
      {showDetalleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#EDE8E1] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#7A3B3B]" />
                <h3 className="font-bold text-base text-[#2A2825]">Comprobante de Cobro</h3>
              </div>
              <button
                onClick={() => setShowDetalleModal(null)}
                className="p-1 rounded-lg text-[#8A7F74] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE8E1] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8A7F74]">ID Operación:</span>
                <span className="font-mono font-bold text-[#2A2825]">{showDetalleModal.codigoOperacion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7F74]">Fecha y Hora:</span>
                <span className="font-semibold text-[#2A2825]">
                  {new Date(showDetalleModal.fecha).toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7F74]">Cliente:</span>
                <span className="font-bold text-[#2A2825]">{showDetalleModal.clienteNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7F74]">Concepto:</span>
                <span className="font-semibold text-[#7A3B3B]">{showDetalleModal.concepto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7F74]">Medio de Pago:</span>
                <span className="capitalize font-semibold text-[#2A2825]">{showDetalleModal.medioDetalle || showDetalleModal.medioPago}</span>
              </div>
              <div className="pt-2 border-t border-[#EDE8E1] flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#2A2825]">Total Abonado:</span>
                <span className="font-black text-xl text-[#7A3B3B]">
                  ${showDetalleModal.monto.toLocaleString('es-AR')} ARS
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-[#EDE8E1] hover:bg-[#FAF8F5] text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-[#7A3B3B]" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDetalleModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#3C3530] text-white hover:bg-[#2A2825] text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CajaPagos;
