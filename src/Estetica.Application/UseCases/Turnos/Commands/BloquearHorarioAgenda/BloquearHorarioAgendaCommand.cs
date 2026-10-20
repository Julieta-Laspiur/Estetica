using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.BloquearHorarioAgenda;

public record BloquearHorarioAgendaCommand(
    int ProfesionalId,
    int CabinaId,
    DateTime FechaHoraInicio,
    DateTime FechaHoraFin,
    string Motivo
) : IRequest<TurnoDto>;
