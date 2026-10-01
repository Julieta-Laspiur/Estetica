using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetTurnoById;

public class GetTurnoByIdQueryHandler : IRequestHandler<GetTurnoByIdQuery, TurnoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetTurnoByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TurnoDto> Handle(GetTurnoByIdQuery request, CancellationToken cancellationToken)
    {
        var turno = await _unitOfWork.Turnos.GetWithDetailsAsync(request.TurnoId, cancellationToken);
        if (turno == null)
        {
            throw new NotFoundException("Turno", request.TurnoId);
        }

        return new TurnoDto
        {
            TurnoId = turno.TurnoId,
            UsuarioId = turno.UsuarioId,
            ClienteNombreCompleto = $"{turno.Usuario.Nombre} {turno.Usuario.Apellido}".Trim(),
            ProfesionalId = turno.ProfesionalId,
            ProfesionalNombreCompleto = $"{turno.Profesional.Usuario.Nombre} {turno.Profesional.Usuario.Apellido}".Trim(),
            CabinaId = turno.CabinaId,
            CabinaNombre = turno.Cabina.Nombre,
            FechaHoraInicio = turno.FechaHoraInicio,
            FechaHoraFin = turno.FechaHoraFin,
            Estado = turno.Estado,
            Total = turno.Total,
            Servicios = turno.TurnoServicios.Select(ts => new ServicioResumenDto
            {
                ServicioId = ts.Servicio.ServicioId,
                Nombre = ts.Servicio.Nombre,
                Precio = ts.Servicio.Precio,
                DuracionMin = ts.Servicio.DuracionMin
            }).ToList()
        };
    }
}
