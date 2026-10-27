using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetTodosTurnos;

public class GetTodosTurnosQueryHandler : IRequestHandler<GetTodosTurnosQuery, IReadOnlyList<TurnoDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetTodosTurnosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<TurnoDto>> Handle(GetTodosTurnosQuery request, CancellationToken cancellationToken)
    {
        var turnos = await _unitOfWork.Turnos.GetAllWithDetailsAsync(
            request.FechaInicio, request.FechaFin, request.Estado, cancellationToken);

        return turnos.Select(t => new TurnoDto
        {
            TurnoId = t.TurnoId,
            UsuarioId = t.UsuarioId,
            ClienteNombreCompleto = t.Usuario != null ? $"{t.Usuario.Nombre} {t.Usuario.Apellido}".Trim() : "Cliente",
            ProfesionalId = t.ProfesionalId,
            ProfesionalNombreCompleto = t.Profesional?.Usuario != null
                ? $"{t.Profesional.Usuario.Nombre} {t.Profesional.Usuario.Apellido}".Trim()
                : "Profesional",
            CabinaId = t.CabinaId,
            CabinaNombre = t.Cabina?.Nombre ?? "Cabina General",
            FechaHoraInicio = t.FechaHoraInicio,
            FechaHoraFin = t.FechaHoraFin,
            Estado = t.Estado,
            Total = t.Total,
            FechaCreacion = t.FechaCreacion,
            Motivo = t.Motivo,
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
