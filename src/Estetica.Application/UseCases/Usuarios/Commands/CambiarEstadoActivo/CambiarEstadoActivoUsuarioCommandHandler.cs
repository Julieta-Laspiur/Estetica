using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.CambiarEstadoActivo;

public class CambiarEstadoActivoUsuarioCommandHandler : IRequestHandler<CambiarEstadoActivoUsuarioCommand, UsuarioDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public CambiarEstadoActivoUsuarioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UsuarioDto> Handle(CambiarEstadoActivoUsuarioCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        usuario.Activo = request.Activo;
        _unitOfWork.Usuarios.Update(usuario);

        var estadoTexto = request.Activo ? "activada" : "deshabilitada";
        var motivoTexto = !string.IsNullOrWhiteSpace(request.Motivo) ? $" Motivo: {request.Motivo}." : string.Empty;

        await _unitOfWork.Notificaciones.AddAsync(new Notificacion
        {
            UsuarioId = usuario.UsuarioId,
            Mensaje = $"Tu cuenta de usuario ha sido {estadoTexto} por la administración.{motivoTexto}",
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
