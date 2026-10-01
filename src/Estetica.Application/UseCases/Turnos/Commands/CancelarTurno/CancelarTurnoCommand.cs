using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.CancelarTurno;

public record CancelarTurnoCommand(
    int TurnoId,
    int SolicitanteUsuarioId,
    string? Motivo = null
) : IRequest<bool>;
