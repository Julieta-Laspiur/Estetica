using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.CambiarEstadoActivo;

public record CambiarEstadoActivoUsuarioCommand(
    int UsuarioId,
    bool Activo,
    string? Motivo = null
) : IRequest<UsuarioDto>;
