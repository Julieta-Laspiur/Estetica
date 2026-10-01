using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Queries.GetPerfil;

public class GetPerfilQueryHandler : IRequestHandler<GetPerfilQuery, PerfilDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPerfilQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PerfilDto> Handle(GetPerfilQuery request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetWithProfileAsync(request.UsuarioId, cancellationToken);

        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        return new PerfilDto
        {
            UsuarioId = usuario.UsuarioId,
            Nombre = usuario.Nombre,
            Apellido = usuario.Apellido,
            Email = usuario.Email,
            Telefono = usuario.Telefono,
            Rol = usuario.Rol,
            FechaRegistro = usuario.FechaRegistro,
            Especialidad = usuario.Profesional?.Especialidad,
            EstampitasFidelizacion = usuario.Fidelizacion?.EstampitasActuales
        };
    }
}
