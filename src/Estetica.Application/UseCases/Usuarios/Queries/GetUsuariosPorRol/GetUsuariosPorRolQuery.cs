using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Queries.GetUsuariosPorRol;

public record GetUsuariosPorRolQuery(RolUsuario Rol) : IRequest<IReadOnlyList<UsuarioDto>>;
