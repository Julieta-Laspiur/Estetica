using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.CambiarEstadoTurno;

public record CambiarEstadoTurnoCommand(
    int TurnoId,
    EstadoTurno NuevoEstado
) : IRequest<bool>;
