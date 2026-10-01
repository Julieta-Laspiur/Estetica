using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.RegistrarUsuario;

public record RegistrarUsuarioCommand(
    string Nombre,
    string Apellido,
    string Email,
    string? Telefono,
    string Password,
    RolUsuario Rol = RolUsuario.Cliente,
    string? Especialidad = null
) : IRequest<AuthResponseDto>;
