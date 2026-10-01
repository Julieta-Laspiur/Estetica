using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Queries.GetUsuariosPorRol;

public class GetUsuariosPorRolQueryHandler : IRequestHandler<GetUsuariosPorRolQuery, IReadOnlyList<UsuarioDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUsuariosPorRolQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<UsuarioDto>> Handle(GetUsuariosPorRolQuery request, CancellationToken cancellationToken)
    {
        var usuarios = await _unitOfWork.Usuarios.GetByRolAsync(request.Rol, cancellationToken);

        return usuarios.Select(u => new UsuarioDto
        {
            UsuarioId = u.UsuarioId,
            Nombre = u.Nombre,
            Apellido = u.Apellido,
            Email = u.Email,
            Telefono = u.Telefono,
            Rol = u.Rol,
            FechaRegistro = u.FechaRegistro
        }).ToList();
    }
}
