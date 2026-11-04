using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Queries.GetProfesionales;

public record GetProfesionalesQuery : IRequest<IReadOnlyList<ProfesionalDto>>;

public class GetProfesionalesQueryHandler : IRequestHandler<GetProfesionalesQuery, IReadOnlyList<ProfesionalDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetProfesionalesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ProfesionalDto>> Handle(GetProfesionalesQuery request, CancellationToken cancellationToken)
    {
        var profesionales = await _unitOfWork.Profesionales.GetAllWithUsuarioAsync(cancellationToken);
        var usuariosProfesionales = await _unitOfWork.Usuarios.GetByRolAsync(RolUsuario.Profesional, cancellationToken);
        var proUsuarioIds = new HashSet<int>(profesionales.Select(p => p.UsuarioId));

        var lista = profesionales.Select(p => new ProfesionalDto
        {
            ProfesionalId = p.ProfesionalId,
            UsuarioId = p.UsuarioId,
            NombreCompleto = $"{p.Usuario?.Nombre} {p.Usuario?.Apellido}".Trim(),
            Nombre = p.Usuario?.Nombre ?? string.Empty,
            Apellido = p.Usuario?.Apellido ?? string.Empty,
            Email = p.Usuario?.Email ?? string.Empty,
            Telefono = p.Usuario?.Telefono,
            Especialidad = p.Especialidad,
            Activo = p.Activo && (p.Usuario?.Activo ?? true),
            TotalTurnos = p.Turnos?.Count ?? 0
        }).ToList();

        foreach (var u in usuariosProfesionales)
        {
            if (!proUsuarioIds.Contains(u.UsuarioId))
            {
                var nuevoPro = new Profesional
                {
                    UsuarioId = u.UsuarioId,
                    Especialidad = "Dermatocosmiatría",
                    Activo = u.Activo
                };
                await _unitOfWork.Profesionales.AddAsync(nuevoPro, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                lista.Add(new ProfesionalDto
                {
                    ProfesionalId = nuevoPro.ProfesionalId,
                    UsuarioId = u.UsuarioId,
                    NombreCompleto = $"{u.Nombre} {u.Apellido}".Trim(),
                    Nombre = u.Nombre,
                    Apellido = u.Apellido,
                    Email = u.Email,
                    Telefono = u.Telefono,
                    Especialidad = nuevoPro.Especialidad,
                    Activo = u.Activo,
                    TotalTurnos = 0
                });
            }
        }

        return lista;
    }
}
