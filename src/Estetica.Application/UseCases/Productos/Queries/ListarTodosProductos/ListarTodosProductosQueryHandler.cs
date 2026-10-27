using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Queries.ListarTodosProductos;

public class ListarTodosProductosQueryHandler : IRequestHandler<ListarTodosProductosQuery, IReadOnlyList<ProductoDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ListarTodosProductosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ProductoDto>> Handle(ListarTodosProductosQuery request, CancellationToken cancellationToken)
    {
        var productos = await _unitOfWork.Productos.GetAllWithTiposPielAsync(cancellationToken);

        return productos.Select(p => new ProductoDto
        {
            ProductoId = p.ProductoId,
            Nombre = p.Nombre,
            Marca = p.Marca,
            Descripcion = p.Descripcion,
            ParaQueSirve = p.ParaQueSirve,
            ImagenUrl = p.ImagenUrl,
            Precio = p.Precio,
            StockActual = p.StockActual,
            StockMinimo = p.StockMinimo,
            Activo = p.Activo,
            TiposPielAptos = p.ProductoTiposPiel.Select(pt => pt.TipoPiel.Nombre.ToString()).ToList()
        }).ToList();
    }
}
