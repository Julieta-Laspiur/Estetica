using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.CrearProfesional;

public record CrearProfesionalCommand(
    string Nombre,
    string Apellido,
    string Email,
    string? Telefono,
    string Password,
    string Especialidad
) : IRequest<ProfesionalDto>;

public class CrearProfesionalCommandHandler : IRequestHandler<CrearProfesionalCommand, ProfesionalDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public CrearProfesionalCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<ProfesionalDto> Handle(CrearProfesionalCommand request, CancellationToken cancellationToken)
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
            PasswordHash = _passwordHasher.Hash(string.IsNullOrWhiteSpace(request.Password) ? "Pro123!" : request.Password),
            Rol = RolUsuario.Profesional,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        await _unitOfWork.Usuarios.AddAsync(usuario, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var profesional = new Profesional
        {
            UsuarioId = usuario.UsuarioId,
            Especialidad = string.IsNullOrWhiteSpace(request.Especialidad) ? "Dermatocosmiatría" : request.Especialidad.Trim(),
            Activo = true
        };

        await _unitOfWork.Profesionales.AddAsync(profesional, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ProfesionalDto
        {
            ProfesionalId = profesional.ProfesionalId,
            UsuarioId = usuario.UsuarioId,
            NombreCompleto = $"{usuario.Nombre} {usuario.Apellido}".Trim(),
            Nombre = usuario.Nombre,
            Apellido = usuario.Apellido,
            Email = usuario.Email,
            Telefono = usuario.Telefono,
            Especialidad = profesional.Especialidad,
            Activo = true,
            TotalTurnos = 0
        };
    }
}
