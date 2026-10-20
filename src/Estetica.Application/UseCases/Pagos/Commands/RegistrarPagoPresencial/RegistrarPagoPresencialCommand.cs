using Estetica.Application.UseCases.Pagos.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Pagos.Commands.RegistrarPagoPresencial;

public record RegistrarPagoPresencialCommand(
    int? TurnoId = null,
    int? OrdenId = null,
    ProveedorPago MetodoPago = ProveedorPago.Efectivo,
    decimal? Monto = null,
    string? NotasComprobante = null,
    bool AcreditarEstampitaDirectamente = false
) : IRequest<PagoPresencialResultadoDto>;
