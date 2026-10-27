using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.ResetearPassword;

public record ResetearPasswordCommand(
    int UsuarioId,
    string NuevaPassword
) : IRequest<UsuarioDto>;
