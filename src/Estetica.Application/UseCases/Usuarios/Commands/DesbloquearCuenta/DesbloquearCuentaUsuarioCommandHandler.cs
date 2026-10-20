using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.DesbloquearCuenta;

public class DesbloquearCuentaUsuarioCommandHandler : IRequestHandler<DesbloquearCuentaUsuarioCommand, UsuarioDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public DesbloquearCuentaUsuarioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UsuarioDto> Handle(DesbloquearCuentaUsuarioCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        usuario.Bloqueado = false;
        usuario.IntentosFallidos = 0;
        usuario.FechaBloqueo = null;

        _unitOfWork.Usuarios.Update(usuario);

        // Notificación al usuario informando el desbloqueo
        await _unitOfWork.Notificaciones.AddAsync(new Notificacion
        {
            UsuarioId = usuario.UsuarioId,
            Mensaje = "Tu cuenta de usuario ha sido desbloqueada exitosamente por el personal administrativo. Ya puedes iniciar sesión.",
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
