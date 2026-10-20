using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Queries.ListarProductosBajoStock;

public class ListarProductosBajoStockQueryHandler : IRequestHandler<ListarProductosBajoStockQuery, IReadOnlyList<StockAlertaDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ListarProductosBajoStockQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<StockAlertaDto>> Handle(ListarProductosBajoStockQuery request, CancellationToken cancellationToken)
    {
        var productos = await _unitOfWork.Productos.GetConBajoStockAsync(cancellationToken);

        return productos.Select(p => new StockAlertaDto
        {
            ProductoId = p.ProductoId,
            NombreProducto = p.Nombre,
            StockActual = p.StockActual,
            StockMinimo = p.StockMinimo,
            EsBajoStock = true,
            MensajeAlerta = $"Stock actual ({p.StockActual}) inferior o igual al mínimo ({p.StockMinimo})."
        }).ToList();
    }
}
