using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.Login;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<AuthResponseDto>;
