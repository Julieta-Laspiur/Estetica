using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.CancelarTurno;

public record CancelarTurnoCommand(
    int TurnoId,
    int? SolicitanteUsuarioId = null,
    string? Motivo = null
) : IRequest<bool>;
