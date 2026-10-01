using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.RegistrarUsuario;

public class RegistrarUsuarioCommandHandler : IRequestHandler<RegistrarUsuarioCommand, AuthResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RegistrarUsuarioCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(RegistrarUsuarioCommand request, CancellationToken cancellationToken)
    {
        var emailNormalizado = request.Email.Trim().ToLower();

        if (await _unitOfWork.Usuarios.EmailExistsAsync(emailNormalizado, cancellationToken))
        {
            throw new BusinessRuleException($"El email '{request.Email}' ya se encuentra registrado.");
        }

        var usuario = new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Apellido = request.Apellido.Trim(),
            Email = emailNormalizado,
            Telefono = request.Telefono?.Trim(),
            PasswordHash = _passwordHasher.Hash(request.Password),
            Rol = request.Rol,
            FechaRegistro = DateTime.UtcNow
        };

        await _unitOfWork.Usuarios.AddAsync(usuario, cancellationToken);

        // Si es cliente, creamos automáticamente su registro de fidelización con 0 estampitas
        if (request.Rol == RolUsuario.Cliente)
        {
            var fidelizacion = new Fidelizacion
            {
                Usuario = usuario,
                EstampitasActuales = 0,
                UltimaActualizacion = DateTime.UtcNow
            };
            await _unitOfWork.Fidelizaciones.AddAsync(fidelizacion, cancellationToken);
        }
        else if (request.Rol == RolUsuario.Profesional)
        {
            var profesional = new Profesional
            {
                Usuario = usuario,
                Especialidad = request.Especialidad?.Trim() ?? "General",
                Activo = true
            };
            await _unitOfWork.Profesionales.AddAsync(profesional, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

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
