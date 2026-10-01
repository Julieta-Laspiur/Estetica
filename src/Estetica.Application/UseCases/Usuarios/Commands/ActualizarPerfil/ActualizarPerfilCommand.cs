using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.ActualizarPerfil;

public record ActualizarPerfilCommand(
    int UsuarioId,
    string Nombre,
    string Apellido,
    string? Telefono
) : IRequest<UsuarioDto>;
