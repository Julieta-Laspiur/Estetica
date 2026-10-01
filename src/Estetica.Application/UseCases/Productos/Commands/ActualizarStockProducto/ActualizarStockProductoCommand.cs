using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.ActualizarStockProducto;

public record ActualizarStockProductoCommand(
    int ProductoId,
    int CantidadADescontar
) : IRequest<StockAlertaDto>;
