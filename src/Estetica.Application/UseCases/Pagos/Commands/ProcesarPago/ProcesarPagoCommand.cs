using Estetica.Application.UseCases.Pagos.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Pagos.Commands.ProcesarPago;

public record ProcesarPagoCommand(
    int? OrdenId,
    int? TurnoId,
    ProveedorPago Proveedor = ProveedorPago.MercadoPago
) : IRequest<PreferenciaPagoDto>;
