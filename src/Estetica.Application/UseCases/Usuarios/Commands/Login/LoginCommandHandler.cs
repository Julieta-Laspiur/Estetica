using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var emailNormalizado = request.Email.Trim().ToLower();
        var usuario = await _unitOfWork.Usuarios.GetByEmailAsync(emailNormalizado, cancellationToken);

        if (usuario == null || !_passwordHasher.Verify(request.Password, usuario.PasswordHash))
        {
            throw new BusinessRuleException("Credenciales inválidas. Verifique su email y contraseña.");
        }

        var token = _jwtTokenGenerator.GenerateToken(usuario);

        return new AuthResponseDto
        {
            Token = token,
            Usuario = new UsuarioDto
            {
                UsuarioId = usuario.UsuarioId,
                Nombre = usuario.Nombre,
                Apellido = usuario.Apellido,
                Email = usuario.Email,
                Telefono = usuario.Telefono,
                Rol = usuario.Rol,
                FechaRegistro = usuario.FechaRegistro
            }
        };
    }
}
