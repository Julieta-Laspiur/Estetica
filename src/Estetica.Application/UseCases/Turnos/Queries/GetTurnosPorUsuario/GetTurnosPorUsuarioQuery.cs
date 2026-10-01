using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetTurnosPorUsuario;

public record GetTurnosPorUsuarioQuery(int UsuarioId) : IRequest<IReadOnlyList<TurnoDto>>;
