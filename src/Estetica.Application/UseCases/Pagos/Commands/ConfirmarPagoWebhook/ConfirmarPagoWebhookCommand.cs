using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Pagos.Commands.ConfirmarPagoWebhook;

public record ConfirmarPagoWebhookCommand(
    string ReferenciaExterna,
    EstadoPago EstadoPago,
    string? TransaccionIdPasarela = null
) : IRequest<bool>;
