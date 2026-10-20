using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.ConfigurarStockMinimo;

public record ConfigurarStockMinimoCommand(
    int ProductoId,
    int NuevoStockMinimo
) : IRequest<StockAlertaDto>;
