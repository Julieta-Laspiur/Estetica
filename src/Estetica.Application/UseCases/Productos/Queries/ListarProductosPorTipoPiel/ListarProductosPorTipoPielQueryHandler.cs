using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Entities;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Queries.ListarProductosPorTipoPiel;

public class ListarProductosPorTipoPielQueryHandler : IRequestHandler<ListarProductosPorTipoPielQuery, IReadOnlyList<ProductoDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ListarProductosPorTipoPielQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ProductoDto>> Handle(ListarProductosPorTipoPielQuery request, CancellationToken cancellationToken)
    {
        IReadOnlyList<Producto> productos;

        if (request.TipoPiel.HasValue)
        {
            var tipoPielEntity = await _unitOfWork.TiposPiel.GetByNombreAsync(request.TipoPiel.Value, cancellationToken);
            if (tipoPielEntity != null)
            {
                productos = await _unitOfWork.Productos.GetByTipoPielAsync(tipoPielEntity.TipoPielId, cancellationToken);
            }
            else
            {
                productos = new List<Producto>();
            }
        }
        else
        {
            productos = await _unitOfWork.Productos.GetActivosAsync(cancellationToken);
        }

        var result = new List<ProductoDto>();

        foreach (var p in productos)
        {
            var prodWithTipos = await _unitOfWork.Productos.GetWithTiposPielAsync(p.ProductoId, cancellationToken) ?? p;
            result.Add(new ProductoDto
            {
                ProductoId = prodWithTipos.ProductoId,
                Nombre = prodWithTipos.Nombre,
                Marca = prodWithTipos.Marca,
                Descripcion = prodWithTipos.Descripcion,
                Precio = prodWithTipos.Precio,
                StockActual = prodWithTipos.StockActual,
                StockMinimo = prodWithTipos.StockMinimo,
                Activo = prodWithTipos.Activo,
                TiposPielAptos = prodWithTipos.ProductoTiposPiel.Select(pt => pt.TipoPiel.Nombre.ToString()).ToList()
            });
        }

        return result;
    }
}
