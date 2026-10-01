using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetTurnosPorProfesional;

public class GetTurnosPorProfesionalQueryHandler : IRequestHandler<GetTurnosPorProfesionalQuery, IReadOnlyList<TurnoDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetTurnosPorProfesionalQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<TurnoDto>> Handle(GetTurnosPorProfesionalQuery request, CancellationToken cancellationToken)
    {
        var turnos = await _unitOfWork.Turnos.GetByProfesionalIdAsync(
            request.ProfesionalId, request.Fecha, cancellationToken);

        return turnos.Select(t => new TurnoDto
        {
            TurnoId = t.TurnoId,
            UsuarioId = t.UsuarioId,
            ClienteNombreCompleto = $"{t.Usuario.Nombre} {t.Usuario.Apellido}".Trim(),
            ProfesionalId = t.ProfesionalId,
            ProfesionalNombreCompleto = string.Empty,
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
