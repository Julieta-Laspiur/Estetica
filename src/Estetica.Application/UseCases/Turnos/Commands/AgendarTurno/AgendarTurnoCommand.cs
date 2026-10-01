using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.AgendarTurno;

public record AgendarTurnoCommand(
    int UsuarioId,
    int ProfesionalId,
    int CabinaId,
    DateTime FechaHoraInicio,
    List<int> ServicioIds
) : IRequest<TurnoDto>;
