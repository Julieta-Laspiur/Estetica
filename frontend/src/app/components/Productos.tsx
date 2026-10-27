import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Package,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  X,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { productosApi, type ProductoDto, type StockAlertaDto } from '../../services/api';

const TIPOS_PIEL_DISPONIBLES = ['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible'];

export function Productos() {
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [alertasBajoStock, setAlertasBajoStock] = useState<StockAlertaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBiotipo, setSelectedBiotipo] = useState('todos');

  // Modal Crear / Editar Producto
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<ProductoDto | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formStockActual, setFormStockActual] = useState('10');
  const [formStockMinimo, setFormStockMinimo] = useState('5');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formParaQueSirve, setFormParaQueSirve] = useState('');
  const [formImagenUrl, setFormImagenUrl] = useState('');
  const [formTiposPiel, setFormTiposPiel] = useState<string[]>([]);
  const [formActivo, setFormActivo] = useState(true);

  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Ajustar Stock
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<ProductoDto | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<number>(0);
  const [cantidadAjuste, setCantidadAjuste] = useState('10');
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Modal Umbral
  const [umbralModalOpen, setUmbralModalOpen] = useState(false);
  const [selectedProductForUmbral, setSelectedProductForUmbral] = useState<ProductoDto | null>(null);
  const [nuevoUmbral, setNuevoUmbral] = useState('10');
  const [submittingUmbral, setSubmittingUmbral] = useState(false);

  // Feedback toast / alert
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const mostrarExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, alertas] = await Promise.all([
        productosApi.getTodos().catch(() => productosApi.getProductos()),
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

  // Manejo de Modal Crear / Editar
  const handleOpenCrear = () => {
    setSelectedProductForEdit(null);
    setFormNombre('');
    setFormMarca('');
    setFormPrecio('');
    setFormStockActual('10');
    setFormStockMinimo('5');
    setFormDescripcion('');
    setFormParaQueSirve('');
    setFormImagenUrl('');
    setFormTiposPiel(['Normal', 'Mixta']);
    setFormActivo(true);
    setProductFormError(null);
    setUploadError(null);
    setEditModalOpen(true);
  };

  const handleOpenEditar = (producto: ProductoDto) => {
    setSelectedProductForEdit(producto);
    setFormNombre(producto.nombre);
    setFormMarca(producto.marca);
    setFormPrecio(producto.precio.toString());
    setFormStockActual(producto.stockActual.toString());
    setFormStockMinimo(producto.stockMinimo.toString());
    setFormDescripcion(producto.descripcion || '');
    setFormParaQueSirve(producto.paraQueSirve || '');
    setFormImagenUrl(producto.imagenUrl || '');
    setFormTiposPiel(producto.tiposPiel || producto.tiposPielAptos || []);
    setFormActivo(producto.activo !== false);
    setProductFormError(null);
    setUploadError(null);
    setEditModalOpen(true);
  };

  const toggleTipoPiel = (tipo: string) => {
    setFormTiposPiel(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('El archivo seleccionado debe ser una imagen (JPG, PNG, WebP, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar los 5MB.');
      return;
    }

    setSubiendoImagen(true);
    setUploadError(null);
    try {
      const res = await productosApi.uploadImagen(file);
      setFormImagenUrl(res.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir la imagen.');
    } finally {
      setSubiendoImagen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formMarca.trim()) {
      setProductFormError('El nombre y la marca del producto son obligatorios.');
      return;
    }

    const precio = parseFloat(formPrecio);
    if (isNaN(precio) || precio < 0) {
      setProductFormError('El precio debe ser un número válido mayor o igual a 0.');
      return;
    }

    const stockActual = parseInt(formStockActual, 10);
    const stockMinimo = parseInt(formStockMinimo, 10);
    if (isNaN(stockActual) || stockActual < 0 || isNaN(stockMinimo) || stockMinimo < 0) {
      setProductFormError('El stock actual y el stock mínimo deben ser números enteros no negativos.');
      return;
    }

    setSubmittingProduct(true);
    setProductFormError(null);

    const payload = {
      nombre: formNombre.trim(),
      marca: formMarca.trim(),
      precio,
      stockActual,
      stockMinimo,
      descripcion: formDescripcion.trim() || undefined,
      paraQueSirve: formParaQueSirve.trim() || undefined,
      imagenUrl: formImagenUrl.trim() || undefined,
      tiposPiel: formTiposPiel,
      activo: formActivo,
    };

    try {
      if (selectedProductForEdit) {
        await productosApi.actualizar(selectedProductForEdit.productoId, payload);
        mostrarExito(`Producto "${payload.nombre}" actualizado con éxito.`);
      } else {
        await productosApi.crear(payload);
        mostrarExito(`Producto "${payload.nombre}" creado exitosamente.`);
      }
      setEditModalOpen(false);
      await cargarDatos();
    } catch (err: unknown) {
      setProductFormError(err instanceof Error ? err.message : 'Error al guardar el producto.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleEliminarProducto = async (producto: ProductoDto) => {
    const confirmacion = window.confirm(
      `¿Confirmás que querés eliminar el producto "${producto.nombre}"?\n\nSi posee movimientos o ventas históricas, pasará a estado inactivo para preservar los registros.`
    );
    if (!confirmacion) return;

    try {
      const res = await productosApi.eliminar(producto.productoId);
      mostrarExito(res.message || 'Producto eliminado correctamente.');
      await cargarDatos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el producto.');
    }
  };

  // Ajuste de stock rápido
  const handleOpenAdjust = (producto: ProductoDto) => {
    setSelectedProductForAdjust(producto);
    setTipoAjuste(0);
    setCantidadAjuste('10');
    setMotivoAjuste('');
    setAdjustError(null);
    setAdjustModalOpen(true);
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
      mostrarExito(`Stock ajustado exitosamente para "${selectedProductForAdjust.nombre}".`);
      await cargarDatos();
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : 'Error al registrar el movimiento de stock.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Umbral mínimo rápido
  const handleOpenUmbral = (producto: ProductoDto) => {
    setSelectedProductForUmbral(producto);
    setNuevoUmbral(producto.stockMinimo.toString());
    setUmbralModalOpen(true);
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
      mostrarExito(`Umbral mínimo configurado en ${u} unidades.`);
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
      (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.paraQueSirve && p.paraQueSirve.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBiotipo =
      selectedBiotipo === 'todos' ||
      (p.tiposPiel && p.tiposPiel.some(tp => tp.toLowerCase().includes(selectedBiotipo.toLowerCase()))) ||
      (p.tiposPielAptos && p.tiposPielAptos.some(tp => tp.toLowerCase().includes(selectedBiotipo.toLowerCase())));

    return matchesSearch && matchesBiotipo;
  });

  const totalValor = productos.reduce((acc, p) => acc + (p.precio * p.stockActual), 0);
  const cantidadBajoStock = alertasBajoStock.length > 0 ? alertasBajoStock.length : productos.filter(p => p.stockActual <= p.stockMinimo).length;

  return (
    <div className="space-y-6">
      {/* Toast de Éxito */}
      {mensajeExito && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3C3530] text-white px-4 py-3 rounded-xl shadow-lg border border-[#EDE8E1]/20 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{mensajeExito}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2A2825]">Gestión de Productos & Catálogo</h2>
          <p className="text-sm text-[#8A7F74] mt-0.5">Control de inventario, edición completa, usos, beneficios e imágenes</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="p-2.5 border border-[#EDE8E1] rounded-xl hover:bg-[#FAF8F5] text-[#8A7F74] transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCrear}
            className="px-4 py-2.5 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
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

      {/* Alerta Stock Bajo */}
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
        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8A7F74] font-semibold uppercase tracking-wider">Productos en Catálogo</p>
              <p className="text-2xl font-bold text-[#2A2825] mt-1">{productos.length}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8A7F74] font-semibold uppercase tracking-wider">Valor en Inventario</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700">${totalValor.toLocaleString()} <span className="text-xs font-normal text-[#8A7F74]">ARS</span></p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EDE8E1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8A7F74] font-semibold uppercase tracking-wider">Stock Crítico</p>
              <p className={`text-2xl font-bold mt-1 ${cantidadBajoStock > 0 ? 'text-amber-600' : 'text-[#2A2825]'}`}>
                {cantidadBajoStock}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${cantidadBajoStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A7F74]" />
          <input
            type="text"
            placeholder="Buscar por nombre, marca, para qué sirve o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3B3B] text-[#2A2825]"
          />
        </div>
        <select
          value={selectedBiotipo}
          onChange={(e) => setSelectedBiotipo(e.target.value)}
          className="px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3B3B] text-[#2A2825]"
        >
          <option value="todos">Todos los Tipos de Piel</option>
          <option value="seca">Piel Seca</option>
          <option value="grasa">Piel Grasa</option>
          <option value="mixta">Piel Mixta</option>
          <option value="sensible">Piel Sensible</option>
          <option value="normal">Piel Normal</option>
        </select>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white border border-[#EDE8E1] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAF8F5] border-b border-[#EDE8E1] text-xs uppercase tracking-wider text-[#8A7F74] font-semibold">
              <tr>
                <th className="px-5 py-3.5">Producto & Marca</th>
                <th className="px-4 py-3.5">Para qué sirve / Beneficios</th>
                <th className="px-4 py-3.5">Tipos de Piel</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE8E1] text-sm">
              {filteredProductos.map((producto) => {
                const esBajo = producto.stockActual <= producto.stockMinimo;
                const tipos = producto.tiposPiel || producto.tiposPielAptos || [];

                return (
                  <tr key={producto.productoId} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    {/* Imagen y Nombre */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] overflow-hidden shrink-0 flex items-center justify-center">
                          {producto.imagenUrl ? (
                            <img
                              src={producto.imagenUrl}
                              alt={producto.nombre}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xl">🧴</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#2A2825] leading-snug">{producto.nombre}</p>
                          <p className="text-xs text-[#8A7F74] font-medium">{producto.marca}</p>
                        </div>
                      </div>
                    </td>

                    {/* Para qué sirve y descripción */}
                    <td className="px-4 py-3.5 max-w-xs">
                      {producto.paraQueSirve ? (
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FAF8F5] text-[#7A3B3B] border border-[#EDE8E1] mb-1">
                            Uso & Beneficios
                          </span>
                          <p className="text-xs text-[#3C3530] line-clamp-2 leading-relaxed" title={producto.paraQueSirve}>
                            {producto.paraQueSirve}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#8A7F74] italic line-clamp-2">
                          {producto.descripcion || 'Sin descripción cargada'}
                        </p>
                      )}
                    </td>

                    {/* Tipos de piel */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {tipos.length > 0 ? (
                          tipos.map((tipo, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EDE8E1] text-[#3C3530]"
                            >
                              {tipo}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#8A7F74]">-</span>
                        )}
                      </div>
                    </td>

                    {/* Precio */}
                    <td className="px-4 py-3.5 font-bold text-emerald-700 whitespace-nowrap">
                      ${producto.precio.toLocaleString()} <span className="text-[11px] font-normal text-[#8A7F74]">ARS</span>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`font-bold ${esBajo ? 'text-amber-600' : 'text-[#2A2825]'}`}>
                          {producto.stockActual} u.
                        </span>
                        <span className="text-[11px] text-[#8A7F74]">
                          Mín: {producto.stockMinimo} u.
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {producto.activo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Editar Producto Completo */}
                        <button
                          onClick={() => handleOpenEditar(producto)}
                          className="p-1.5 text-[#3C3530] hover:text-[#7A3B3B] hover:bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl transition-colors"
                          title="Editar producto completo (descripción, usos, imágenes)"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Ajustar Stock Rápido */}
                        <button
                          onClick={() => handleOpenAdjust(producto)}
                          className="p-1.5 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-colors"
                          title="Ajustar stock e inventario"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>

                        {/* Configurar Umbral */}
                        <button
                          onClick={() => handleOpenUmbral(producto)}
                          className="px-2 py-1 border border-[#EDE8E1] text-[11px] font-semibold rounded-xl hover:bg-[#FAF8F5] text-[#8A7F74]"
                          title="Modificar stock mínimo preventivo"
                        >
                          Umbral
                        </button>

                        {/* Eliminar Producto */}
                        <button
                          onClick={() => handleEliminarProducto(producto)}
                          className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="text-center py-16 bg-white border border-[#EDE8E1] rounded-2xl">
          <p className="text-[#8A7F74] text-sm">No se encontraron productos con los criterios especificados.</p>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO COMPLETO */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#EDE8E1] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#EDE8E1] bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#7A3B3B] text-white rounded-xl">
                  {selectedProductForEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#2A2825]">
                    {selectedProductForEdit ? 'Editar Producto Completo' : 'Crear Nuevo Producto'}
                  </h3>
                  <p className="text-xs text-[#8A7F74]">
                    {selectedProductForEdit ? `Actualizando datos de "${selectedProductForEdit.nombre}"` : 'Agregá un nuevo ítem al catálogo de estética'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-[#8A7F74] hover:text-[#2A2825] hover:bg-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProducto} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {productFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{productFormError}</span>
                </div>
              )}

              {/* Fila 1: Nombre y Marca */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Crema Hidratante con Ácido Hialurónico"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Marca / Laboratorio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. La Roche-Posay, Dermaglós, Lidherma"
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
              </div>

              {/* Fila 2: Precio, Stock y Stock Mínimo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Precio (ARS) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] font-semibold focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStockActual}
                    onChange={(e) => setFormStockActual(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                    Stock Mínimo (Alerta) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStockMinimo}
                    onChange={(e) => setFormStockMinimo(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
              </div>

              {/* Tipos de Piel Aptos */}
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1.5">
                  Tipos de Piel Aptos
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_PIEL_DISPONIBLES.map((tipo) => {
                    const isSelected = formTiposPiel.includes(tipo);
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => toggleTipoPiel(tipo)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-[#7A3B3B] text-white border-[#7A3B3B]'
                            : 'bg-[#FAF8F5] text-[#3C3530] border-[#EDE8E1] hover:bg-[#EDE8E1]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>Piel {tipo}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fila 3: Para qué sirve / Beneficios & Indicaciones (CLAVE REQUERIDA) */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7A3B3B]" />
                  <label className="text-xs font-bold text-[#2A2825]">
                    ¿Para qué sirve? / Beneficios & Indicaciones
                  </label>
                </div>
                <p className="text-[11px] text-[#8A7F74]">
                  Explicá de forma clara para qué se utiliza, qué resultados ofrece y cómo beneficia a la piel del cliente.
                </p>
                <textarea
                  rows={3}
                  placeholder="Ej. Hidrata profundamente en capas celulares, calma irritaciones, atenúa líneas de expresión y regenera la barrera cutánea tras exfoliaciones."
                  value={formParaQueSirve}
                  onChange={(e) => setFormParaQueSirve(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B] leading-relaxed"
                />
              </div>

              {/* Fila 4: Descripción General */}
              <div>
                <label className="block text-xs font-semibold text-[#3C3530] mb-1">
                  Descripción General / Detalles del Producto
                </label>
                <textarea
                  rows={2}
                  placeholder="Información sobre la fórmula, textura, presentación de 50ml, modo de conservación..."
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B] leading-relaxed"
                />
              </div>

              {/* Fila 5: Carga de Imagen del Producto (CLAVE REQUERIDA) */}
              <div className="border border-[#EDE8E1] rounded-2xl p-4 bg-[#FAF8F5] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2A2825] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#7A3B3B]" />
                    Imagen del Producto
                  </label>
                  {formImagenUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImagenUrl('')}
                      className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Quitar imagen
                    </button>
                  )}
                </div>

                {uploadError && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {uploadError}
                  </div>
                )}

                {/* Previsualización si existe imagen */}
                {formImagenUrl ? (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#EDE8E1]">
                    <div className="w-20 h-20 rounded-xl border border-[#EDE8E1] overflow-hidden bg-[#FAF8F5] shrink-0">
                      <img
                        src={formImagenUrl}
                        alt="Previsualización"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#2A2825] truncate">Imagen cargada</p>
                      <p className="text-[11px] text-[#8A7F74] truncate">{formImagenUrl}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoImagen}
                        className="mt-2 text-xs text-[#7A3B3B] font-semibold hover:underline flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Reemplazar imagen desde archivo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#EDE8E1] rounded-xl bg-white hover:border-[#7A3B3B]/50 transition-colors text-center">
                    <ImageIcon className="w-8 h-8 text-[#8A7F74] mb-2" />
                    <p className="text-xs font-bold text-[#2A2825]">Cargá la imagen del producto</p>
                    <p className="text-[11px] text-[#8A7F74] mt-0.5 mb-3">
                      Podés subir un archivo desde tu dispositivo o ingresar una URL directa
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={subiendoImagen}
                      className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#EDE8E1] text-[#3C3530] text-xs font-semibold rounded-xl border border-[#EDE8E1] flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {subiendoImagen ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#7A3B3B]" />
                          <span>Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#7A3B3B]" />
                          <span>Seleccionar archivo (JPG, PNG, WebP)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Input file oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* URL directa opcional */}
                <div>
                  <label className="block text-[11px] font-medium text-[#8A7F74] mb-1">
                    O pegá directamente una URL de imagen:
                  </label>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg o /uploads/productos/..."
                    value={formImagenUrl}
                    onChange={(e) => setFormImagenUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:ring-2 focus:ring-[#7A3B3B]"
                  />
                </div>
              </div>

              {/* Fila 6: Estado Activo */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="formActivo"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="w-4 h-4 text-[#7A3B3B] rounded border-[#EDE8E1] focus:ring-[#7A3B3B]"
                />
                <label htmlFor="formActivo" className="text-xs font-semibold text-[#3C3530] cursor-pointer">
                  Producto activo y disponible para la venta en el catálogo
                </label>
              </div>

              {/* Botones del Modal */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EDE8E1] mt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct || subiendoImagen}
                  className="px-5 py-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submittingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{selectedProductForEdit ? 'Guardar Cambios' : 'Crear Producto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajustar Stock */}
      {adjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE8E1] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-[#EDE8E1] bg-[#FAF8F5]">
              <div>
                <h3 className="font-bold text-base text-[#2A2825]">Ajuste de Stock</h3>
                <p className="text-xs text-[#8A7F74] truncate">{selectedProductForAdjust.nombre}</p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 text-[#8A7F74] hover:text-[#2A2825] rounded-lg"
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

              <div className="p-3 bg-[#FAF8F5] rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#8A7F74]">Stock actual registrado:</span>
                <span className="font-bold text-sm text-[#2A2825]">{selectedProductForAdjust.stockActual} unidades</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] uppercase tracking-wider mb-1">
                  Tipo de Movimiento *
                </label>
                <select
                  value={tipoAjuste}
                  onChange={(e) => setTipoAjuste(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]"
                >
                  <option value={0}>+ Ingreso de Mercadería (Recepción de compra)</option>
                  <option value={1}>± Ajuste Manual / Corrección</option>
                  <option value={2}>- Merma / Rotura / Vencimiento</option>
                  <option value={3}>= Inventario Físico Total (Reemplazo exacto)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] uppercase tracking-wider mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cantidadAjuste}
                  onChange={(e) => setCantidadAjuste(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] uppercase tracking-wider mb-1">
                  Motivo / Justificación
                </label>
                <input
                  type="text"
                  placeholder="ej. Factura proveedor A-1024 o rotura en depósito"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EDE8E1] mt-4">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  {submittingAdjust && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Aplicar Ajuste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Umbral Mínimo */}
      {umbralModalOpen && selectedProductForUmbral && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EDE8E1] rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-[#EDE8E1] bg-[#FAF8F5]">
              <h3 className="font-bold text-base text-[#2A2825]">Stock Mínimo Preventivo</h3>
              <button
                onClick={() => setUmbralModalOpen(false)}
                className="p-1 text-[#8A7F74] hover:text-[#2A2825] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUmbral} className="p-6 space-y-4">
              <p className="text-xs text-[#8A7F74] leading-relaxed">
                Configurá el umbral mínimo para <strong className="text-[#2A2825]">{selectedProductForUmbral.nombre}</strong>. El sistema emitirá alertas automáticas si el stock desciende por debajo de este valor.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#3C3530] uppercase tracking-wider mb-1">
                  Nuevo Umbral Mínimo (u.)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={nuevoUmbral}
                  onChange={(e) => setNuevoUmbral(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#2A2825] focus:outline-none focus:ring-2 focus:ring-[#7A3B3B]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EDE8E1] mt-4">
                <button
                  type="button"
                  onClick={() => setUmbralModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE8E1] text-[#8A7F74] hover:bg-[#FAF8F5] rounded-xl text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingUmbral}
                  className="px-5 py-2 bg-[#7A3B3B] hover:bg-[#5C2B2B] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  {submittingUmbral && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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