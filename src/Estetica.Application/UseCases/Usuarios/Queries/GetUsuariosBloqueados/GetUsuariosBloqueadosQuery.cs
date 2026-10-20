using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Queries.GetUsuariosBloqueados;

public record GetUsuariosBloqueadosQuery() : IRequest<IReadOnlyList<UsuarioDto>>;
