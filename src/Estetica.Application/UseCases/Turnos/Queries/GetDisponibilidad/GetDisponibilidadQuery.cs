using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetDisponibilidad;

public record GetDisponibilidadQuery(
    int ProfesionalId,
    int CabinaId,
    DateTime FechaHoraInicio,
    int DuracionMin
) : IRequest<DisponibilidadDto>;
