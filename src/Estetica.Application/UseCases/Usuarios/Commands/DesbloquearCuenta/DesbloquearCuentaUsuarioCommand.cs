using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.DesbloquearCuenta;

public record DesbloquearCuentaUsuarioCommand(
    int UsuarioId
) : IRequest<UsuarioDto>;
