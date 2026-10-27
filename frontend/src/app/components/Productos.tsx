import { useState, useEffect, useCallback } from 'react';
import { Search, Package, TrendingUp, AlertCircle, RefreshCw, X, SlidersHorizontal } from 'lucide-react';
import { productosApi, type ProductoDto, type StockAlertaDto } from '../../services/api';

export function Productos() {
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [alertasBajoStock, setAlertasBajoStock] = useState<StockAlertaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBiotipo, setSelectedBiotipo] = useState('todos');

  // Modales
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<ProductoDto | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<number>(0); // 0: Ingreso, 1: AjusteManual, 2: Merma, 3: InventarioTotal
  const [cantidadAjuste, setCantidadAjuste] = useState('10');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Modal Umbral
  const [umbralModalOpen, setUmbralModalOpen] = useState(false);
  const [selectedProductForUmbral, setSelectedProductForUmbral] = useState<ProductoDto | null>(null);
  const [nuevoUmbral, setNuevoUmbral] = useState('10');
  const [submittingUmbral, setSubmittingUmbral] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, alertas] = await Promise.all([
        productosApi.getProductos(),
        productosApi.getBajoStock().catch(() => []),
      ]);
      setProductos(prods || []);
      setAlertasBajoStock(alertas || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el inventario de productos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleOpenAdjust = (producto: ProductoDto) => {
    setSelectedProductForAdjust(producto);
    setTipoAjuste(0);
    setCantidadAjuste('10');
    setMotivoAjuste('');
    setAdjustError(null);
    setAdjustModalOpen(true);
  };

  const handleOpenUmbral = (producto: ProductoDto) => {
    setSelectedProductForUmbral(producto);
    setNuevoUmbral(producto.stockMinimo.toString());
    setUmbralModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;
    const cant = parseInt(cantidadAjuste, 10);
    if (isNaN(cant) || cant <= 0) {
      setAdjustError('La cantidad debe ser un número entero mayor a 0.');
      return;
    }

    setSubmittingAdjust(true);
    setAdjustError(null);
    try {
      await productosApi.ajustarStock(
        selectedProductForAdjust.productoId,
        tipoAjuste,
        cant,
        motivoAjuste.trim() || undefined
      );
      setAdjustModalOpen(false);
      await cargarDatos();
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : 'Error al registrar el movimiento de stock.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleSaveUmbral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForUmbral) return;
    const u = parseInt(nuevoUmbral, 10);
    if (isNaN(u) || u < 0) return;

    setSubmittingUmbral(true);
    try {
      await productosApi.configurarStockMinimo(selectedProductForUmbral.productoId, u);
      setUmbralModalOpen(false);
      await cargarDatos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al configurar stock mínimo.');
    } finally {
      setSubmittingUmbral(false);
    }
  };

  const filteredProductos = productos.filter(p => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBiotipo =
      selectedBiotipo === 'todos' ||
      (p.tiposPiel && p.tiposPiel.some(tp => tp.toLowerCase().includes(selectedBiotipo.toLowerCase())));

    return matchesSearch && matchesBiotipo;
  });

  const totalValor = productos.reduce((acc, p) => acc + (p.precio * p.stockActual), 0);
  const cantidadBajoStock = alertasBajoStock.length > 0 ? alertasBajoStock.length : productos.filter(p => p.stockActual <= p.stockMinimo).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Productos & Inventario</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Control de stock, alertas y umbrales de reabastecimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="p-2 border border-border rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={cargarDatos} className="underline text-xs font-semibold">Reintentar</button>
        </div>
      )}

      {/* Alerta Stock Bajo Automática */}
      {cantidadBajoStock > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-900 text-sm">Alerta de Umbral Mínimo de Stock</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Se detectaron <strong>{cantidadBajoStock} producto(s)</strong> que alcanzaron o están por debajo del umbral mínimo de seguridad.
            </p>
          </div>
        </div>
      )}

      {/* Métricas de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Productos Totales</p>
              <p className="text-2xl font-bold mt-1">{productos.length}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Valor en Inventario</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700">${totalValor.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ARS</span></p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Stock Crítico</p>
              <p className={`text-2xl font-bold mt-1 ${cantidadBajoStock > 0 ? 'text-amber-600' : 'text-foreground'}`}>
                {cantidadBajoStock}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${cantidadBajoStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o características..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={selectedBiotipo}
          onChange={(e) => setSelectedBiotipo(e.target.value)}
          className="px-3.5 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="todos">Todos los Tipos de Piel</option>
          <option value="seca">Piel Seca</option>
          <option value="grasa">Piel Grasa</option>
          <option value="mixta">Piel Mixta</option>
          <option value="sensible">Piel Sensible</option>
        </select>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <tr>
                <th className="px-5 py-3.5">Producto & Marca</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5">Stock Actual</th>
                <th className="px-4 py-3.5">Stock Mínimo</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones Gerenciales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredProductos.map((producto) => {
                const esBajo = producto.stockActual <= producto.stockMinimo;

                return (
                  <tr key={producto.productoId} className="hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-foreground">{producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">{producto.marca}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">
                      ${producto.precio.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-bold ${esBajo ? 'text-amber-600' : 'text-foreground'}`}>
                        {producto.stockActual} u.
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {producto.stockMinimo} u.
                    </td>
                    <td className="px-4 py-3.5">
                      {esBajo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3" /> Reabastecer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          En Stock
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenAdjust(producto)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1 shadow-2xs"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Ajustar Stock</span>
                        </button>
                        <button
                          onClick={() => handleOpenUmbral(producto)}
                          className="px-2.5 py-1.5 border border-border text-xs font-medium rounded-lg hover:bg-accent text-foreground transition-colors"
                          title="Configurar umbral mínimo"
                        >
                          Umbral ({producto.stockMinimo})
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProductos.length === 0 && !loading && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No se encontraron productos con los criterios especificados.</p>
        </div>
      )}

      {/* Modal Ajustar Stock */}
      {adjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-bold text-base text-foreground">Ajuste de Stock</h3>
                <p className="text-xs text-muted-foreground truncate">{selectedProductForAdjust.nombre}</p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="p-6 space-y-4">
              {adjustError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{adjustError}</span>
                </div>
              )}

              <div className="p-3 bg-muted/30 rounded-xl flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Stock actual registrado:</span>
                <span className="font-bold text-sm text-foreground">{selectedProductForAdjust.stockActual} unidades</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Tipo de Movimiento *
                </label>
                <select
                  value={tipoAjuste}
                  onChange={(e) => setTipoAjuste(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={0}>+ Ingreso de Mercadería (Recepción de compra)</option>
                  <option value={1}>± Ajuste Manual / Corrección</option>
                  <option value={2}>- Merma / Rotura / Vencimiento</option>
                  <option value={3}>= Inventario Físico Total (Reemplazo exacto)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cantidadAjuste}
                  onChange={(e) => setCantidadAjuste(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Motivo / Justificación
                </label>
                <input
                  type="text"
                  placeholder="ej. Factura proveedor A-1024 o rotura en depósito"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-accent rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-sm font-semibold transition-opacity flex items-center gap-2"
                >
                  {submittingAdjust && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Aplicar Ajuste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Umbral Mínimo */}
      {umbralModalOpen && selectedProductForUmbral && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <h3 className="font-bold text-base text-foreground">Stock Mínimo</h3>
              <button
                onClick={() => setUmbralModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUmbral} className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Configurá el umbral mínimo para <strong>{selectedProductForUmbral.nombre}</strong>. El sistema emitirá alertas preventivas si el stock desciende por debajo de este valor.
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Nuevo Umbral Mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={nuevoUmbral}
                  onChange={(e) => setNuevoUmbral(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setUmbralModalOpen(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-accent rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingUmbral}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-sm font-semibold transition-opacity flex items-center gap-2"
                >
                  {submittingUmbral && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}