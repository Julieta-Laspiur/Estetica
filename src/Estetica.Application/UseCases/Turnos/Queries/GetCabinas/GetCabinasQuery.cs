using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetCabinas;

public record GetCabinasQuery : IRequest<IReadOnlyList<CabinaDto>>;
