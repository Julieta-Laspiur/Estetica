using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetTurnoById;

public record GetTurnoByIdQuery(int TurnoId) : IRequest<TurnoDto>;
