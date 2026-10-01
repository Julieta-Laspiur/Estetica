using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetTurnosPorProfesional;

public record GetTurnosPorProfesionalQuery(
    int ProfesionalId,
    DateTime? Fecha = null
) : IRequest<IReadOnlyList<TurnoDto>>;
