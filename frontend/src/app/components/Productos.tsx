import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Package, TrendingUp, AlertCircle } from 'lucide-react';

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  marca: string;
  descripcion: string;
  imagen?: string;
}

export function Productos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');

  const productos: Producto[] = [
    {
      id: '1',
      nombre: 'Crema Hidratante Premium',
      categoria: 'Cuidado Facial',
      precio: 2500,
      stock: 45,
      stockMinimo: 10,
      marca: 'La Roche-Posay',
      descripcion: 'Crema hidratante para todo tipo de pieles'
    },
    {
      id: '2',
      nombre: 'Sérum Vitamina C',
      categoria: 'Cuidado Facial',
      precio: 3200,
      stock: 28,
      stockMinimo: 15,
      marca: 'Vichy',
      descripcion: 'Sérum antioxidante con vitamina C pura'
    },
    {
      id: '3',
      nombre: 'Protector Solar FPS 50+',
      categoria: 'Protección Solar',
      precio: 1800,
      stock: 62,
      stockMinimo: 20,
      marca: 'Eucerin',
      descripcion: 'Protección solar de amplio espectro'
    },
    {
      id: '4',
      nombre: 'Aceite Esencial Lavanda',
      categoria: 'Aromaterapia',
      precio: 1500,
      stock: 8,
      stockMinimo: 10,
      marca: 'doTERRA',
      descripcion: 'Aceite esencial 100% puro de lavanda'
    },
    {
      id: '5',
      nombre: 'Exfoliante Corporal',
      categoria: 'Cuidado Corporal',
      precio: 2100,
      stock: 33,
      stockMinimo: 12,
      marca: 'The Body Shop',
      descripcion: 'Exfoliante corporal con sales marinas'
    },
    {
      id: '6',
      nombre: 'Máscara Facial Purificante',
      categoria: 'Cuidado Facial',
      precio: 1900,
      stock: 5,
      stockMinimo: 8,
      marca: 'Natura',
      descripcion: 'Máscara de arcilla para pieles grasas'
    },
    {
      id: '7',
      nombre: 'Loción Corporal Nutritiva',
      categoria: 'Cuidado Corporal',
      precio: 1600,
      stock: 52,
      stockMinimo: 15,
      marca: 'Nivea',
      descripcion: 'Loción corporal hidratante de rápida absorción'
    },
    {
      id: '8',
      nombre: 'Tónico Facial Equilibrante',
      categoria: 'Cuidado Facial',
      precio: 1400,
      stock: 38,
      stockMinimo: 10,
      marca: 'Clinique',
      descripcion: 'Tónico equilibrante sin alcohol'
    },
  ];

  const categorias = ['todas', ...Array.from(new Set(productos.map(p => p.categoria)))];

  const filteredProductos = productos.filter(
    producto =>
      (selectedCategoria === 'todas' || producto.categoria === selectedCategoria) &&
      (producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.marca.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stockBajo = productos.filter(p => p.stock <= p.stockMinimo).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Productos</h2>
          <p className="text-muted-foreground mt-1">Administra el inventario de productos</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Alert Stock Bajo */}
      {stockBajo > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Stock bajo detectado</p>
            <p className="text-sm text-yellow-700 mt-1">
              {stockBajo} producto{stockBajo > 1 ? 's' : ''} con stock por debajo del mínimo
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{productos.length}</p>
              <p className="text-sm text-muted-foreground">Total Productos</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${productos.reduce((acc, p) => acc + (p.precio * p.stock), 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Valor Inventario</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stockBajo}</p>
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categorias.length - 1}</p>
              <p className="text-sm text-muted-foreground">Categorías</p>
            </div>
          </div>
        </div>
      </div>

      {/* Productos Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Producto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Categoría</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Marca</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Precio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProductos.map((producto) => {
                const stockCritico = producto.stock <= producto.stockMinimo;

                return (
                  <tr key={producto.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{producto.nombre}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{producto.descripcion}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-secondary text-xs rounded">
                        {producto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{producto.marca}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">${producto.precio}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-medium ${stockCritico ? 'text-red-600' : ''}`}>
                          {producto.stock} unidades
                        </p>
                        <p className="text-xs text-muted-foreground">Mín: {producto.stockMinimo}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {stockCritico ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full border border-red-200 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-destructive" />
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

      {filteredProductos.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}