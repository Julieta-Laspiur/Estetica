using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.ActualizarPerfil;

public class ActualizarPerfilCommandHandler : IRequestHandler<ActualizarPerfilCommand, UsuarioDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public ActualizarPerfilCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UsuarioDto> Handle(ActualizarPerfilCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        usuario.Nombre = request.Nombre.Trim();
        usuario.Apellido = request.Apellido.Trim();
        usuario.Telefono = request.Telefono?.Trim();

        _unitOfWork.Usuarios.Update(usuario);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new UsuarioDto
        {
            UsuarioId = usuario.UsuarioId,
            Nombre = usuario.Nombre,
            Apellido = usuario.Apellido,
            Email = usuario.Email,
            Telefono = usuario.Telefono,
            Rol = usuario.Rol,
            FechaRegistro = usuario.FechaRegistro
        };
    }
}
