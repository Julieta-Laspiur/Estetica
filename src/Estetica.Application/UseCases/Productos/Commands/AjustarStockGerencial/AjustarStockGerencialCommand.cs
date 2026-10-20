using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.AjustarStockGerencial;

public record AjustarStockGerencialCommand(
    int ProductoId,
    TipoAjusteStock TipoAjuste,
    int Cantidad,
    string? Motivo = null
) : IRequest<StockMovimientoResultadoDto>;
