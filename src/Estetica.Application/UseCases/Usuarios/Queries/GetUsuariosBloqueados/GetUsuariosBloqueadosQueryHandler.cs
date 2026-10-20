using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Queries.GetUsuariosBloqueados;

public class GetUsuariosBloqueadosQueryHandler : IRequestHandler<GetUsuariosBloqueadosQuery, IReadOnlyList<UsuarioDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUsuariosBloqueadosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<UsuarioDto>> Handle(GetUsuariosBloqueadosQuery request, CancellationToken cancellationToken)
    {
        var usuarios = await _unitOfWork.Usuarios.GetBloqueadosAsync(cancellationToken);

        return usuarios.Select(u => new UsuarioDto
        {
            UsuarioId = u.UsuarioId,
            Nombre = u.Nombre,
            Apellido = u.Apellido,
            Email = u.Email,
            Telefono = u.Telefono,
            Rol = u.Rol,
            FechaRegistro = u.FechaRegistro,
            Activo = u.Activo,
            Bloqueado = u.Bloqueado,
            IntentosFallidos = u.IntentosFallidos,
            FechaBloqueo = u.FechaBloqueo
        }).ToList();
    }
}
