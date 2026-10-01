using Estetica.Application.UseCases.Pagos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Pagos.Commands.GenerarQrToken;

public record GenerarQrTokenCommand(int PagoId) : IRequest<QrTokenDto>;
