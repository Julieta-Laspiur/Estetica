using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetTurnosPorUsuario;

public class GetTurnosPorUsuarioQueryHandler : IRequestHandler<GetTurnosPorUsuarioQuery, IReadOnlyList<TurnoDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetTurnosPorUsuarioQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<TurnoDto>> Handle(GetTurnosPorUsuarioQuery request, CancellationToken cancellationToken)
    {
        var turnos = await _unitOfWork.Turnos.GetByUsuarioIdAsync(request.UsuarioId, cancellationToken);

        return turnos.Select(t => new TurnoDto
        {
            TurnoId = t.TurnoId,
            UsuarioId = t.UsuarioId,
            ClienteNombreCompleto = string.Empty,
            ProfesionalId = t.ProfesionalId,
            ProfesionalNombreCompleto = $"{t.Profesional.Usuario.Nombre} {t.Profesional.Usuario.Apellido}".Trim(),
            CabinaId = t.CabinaId,
            CabinaNombre = t.Cabina.Nombre,
            FechaHoraInicio = t.FechaHoraInicio,
            FechaHoraFin = t.FechaHoraFin,
            Estado = t.Estado,
            Total = t.Total,
            Servicios = t.TurnoServicios.Select(ts => new ServicioResumenDto
            {
                ServicioId = ts.Servicio.ServicioId,
                Nombre = ts.Servicio.Nombre,
                Precio = ts.Servicio.Precio,
                DuracionMin = ts.Servicio.DuracionMin
            }).ToList()
        }).ToList();
    }
}
