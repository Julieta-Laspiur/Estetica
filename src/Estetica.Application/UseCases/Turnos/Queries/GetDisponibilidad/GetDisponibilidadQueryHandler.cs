using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetDisponibilidad;

public class GetDisponibilidadQueryHandler : IRequestHandler<GetDisponibilidadQuery, DisponibilidadDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDisponibilidadQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DisponibilidadDto> Handle(GetDisponibilidadQuery request, CancellationToken cancellationToken)
    {
        var fechaHoraFin = request.FechaHoraInicio.AddMinutes(request.DuracionMin);

        var cabinaDisponible = await _unitOfWork.Turnos.IsCabinaAvailableAsync(
            request.CabinaId, request.FechaHoraInicio, fechaHoraFin, null, cancellationToken);

        if (!cabinaDisponible)
        {
            return new DisponibilidadDto
            {
                FechaHoraInicio = request.FechaHoraInicio,
                FechaHoraFin = fechaHoraFin,
                EstaDisponible = false,
                MotivoNoDisponible = "La cabina seleccionada no se encuentra disponible."
            };
        }

        var profesionalDisponible = await _unitOfWork.Turnos.IsProfesionalAvailableAsync(
            request.ProfesionalId, request.FechaHoraInicio, fechaHoraFin, null, cancellationToken);

        if (!profesionalDisponible)
        {
            return new DisponibilidadDto
            {
                FechaHoraInicio = request.FechaHoraInicio,
                FechaHoraFin = fechaHoraFin,
                EstaDisponible = false,
                MotivoNoDisponible = "El profesional seleccionado no se encuentra disponible."
            };
        }

        return new DisponibilidadDto
        {
            FechaHoraInicio = request.FechaHoraInicio,
            FechaHoraFin = fechaHoraFin,
            EstaDisponible = true,
            MotivoNoDisponible = null
        };
    }
}
