using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.ConfirmarTurno;

public record ConfirmarTurnoCommand(int TurnoId) : IRequest<bool>;
