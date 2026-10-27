using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using FluentValidation;
using FluentValidation.Results;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.ResetearPassword;

public class ResetearPasswordCommandHandler : IRequestHandler<ResetearPasswordCommand, UsuarioDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public ResetearPasswordCommandHandler(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<UsuarioDto> Handle(ResetearPasswordCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.NuevaPassword) || request.NuevaPassword.Length < 6)
        {
            throw new Estetica.Application.Common.Exceptions.ValidationException(new List<ValidationFailure>
            {
                new("NuevaPassword", "La contraseña debe contener al menos 6 caracteres.")
            });
        }

        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        // Hashear y actualizar contraseña
        usuario.PasswordHash = _passwordHasher.Hash(request.NuevaPassword);

        // Desbloquear y reactivar cuenta si estaba bloqueada
        usuario.Bloqueado = false;
        usuario.IntentosFallidos = 0;
        usuario.FechaBloqueo = null;
        usuario.Activo = true;

        _unitOfWork.Usuarios.Update(usuario);

        // Notificación al usuario
        await _unitOfWork.Notificaciones.AddAsync(new Notificacion
        {
            UsuarioId = usuario.UsuarioId,
            Mensaje = "Tu contraseña ha sido restablecida por la administración. Ya puedes ingresar con tu nueva clave de acceso.",
            Tipo = TipoNotificacion.Sistema,
            Leida = false,
            Fecha = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new UsuarioDto
        {
            UsuarioId = usuario.UsuarioId,
            Nombre = usuario.Nombre,
            Apellido = usuario.Apellido,
            Email = usuario.Email,
            Telefono = usuario.Telefono,
            Rol = usuario.Rol,
            FechaRegistro = usuario.FechaRegistro,
            Activo = usuario.Activo,
            Bloqueado = usuario.Bloqueado,
            IntentosFallidos = usuario.IntentosFallidos,
            FechaBloqueo = usuario.FechaBloqueo
        };
    }
}
