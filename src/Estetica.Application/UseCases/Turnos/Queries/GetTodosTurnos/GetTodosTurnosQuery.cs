using Estetica.Application.UseCases.Turnos.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetTodosTurnos;

public record GetTodosTurnosQuery(
    DateTime? FechaInicio = null,
    DateTime? FechaFin = null,
    EstadoTurno? Estado = null
) : IRequest<IReadOnlyList<TurnoDto>>;
