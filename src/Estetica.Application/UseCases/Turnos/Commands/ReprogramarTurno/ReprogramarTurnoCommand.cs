using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.ReprogramarTurno;

public record ReprogramarTurnoCommand(
    int TurnoId,
    DateTime NuevaFechaHoraInicio,
    int? NuevaCabinaId = null,
    int? NuevoProfesionalId = null
) : IRequest<TurnoDto>;
