using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.BloquearHorarioAgenda;

public class BloquearHorarioAgendaCommandHandler : IRequestHandler<BloquearHorarioAgendaCommand, TurnoDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public BloquearHorarioAgendaCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<TurnoDto> Handle(BloquearHorarioAgendaCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Motivo))
        {
            throw new BusinessRuleException("Debe ingresar un motivo o justificación obligatoria para el bloqueo administrativo (mantenimiento, vacaciones, licencia).");
        }

        if (request.FechaHoraFin <= request.FechaHoraInicio)
        {
            throw new BusinessRuleException("La fecha y hora de fin del bloqueo debe ser posterior a la de inicio.");
        }

        var profesional = await _unitOfWork.Profesionales.GetWithDetailsAsync(request.ProfesionalId, cancellationToken);
        if (profesional == null)
        {
            throw new NotFoundException("Profesional", request.ProfesionalId);
        }

        var cabina = await _unitOfWork.Cabinas.GetByIdAsync(request.CabinaId, cancellationToken);
        if (cabina == null)
        {
            throw new NotFoundException("Cabina", request.CabinaId);
        }

        // Validar que no existan turnos vigentes en ese rango para no generar conflictos desatendidos
        var cabinaDisponible = await _unitOfWork.Turnos.IsCabinaAvailableAsync(
            request.CabinaId, request.FechaHoraInicio, request.FechaHoraFin, null, cancellationToken);

        if (!cabinaDisponible)
        {
            throw new BusinessRuleException("No se puede bloquear el horario: la cabina ya tiene turnos asignados en ese intervalo. Debe cancelarlos o reprogramarlos primero.");
        }

        var profesionalDisponible = await _unitOfWork.Turnos.IsProfesionalAvailableAsync(
            request.ProfesionalId, request.FechaHoraInicio, request.FechaHoraFin, null, cancellationToken);

        if (!profesionalDisponible)
        {
            throw new BusinessRuleException("No se puede bloquear el horario: el profesional ya tiene turnos asignados en ese intervalo. Debe cancelarlos o reprogramarlos primero.");
        }

        int adminId = _currentUserService.UsuarioId ?? profesional.UsuarioId;

        var turnoBloqueo = new Turno
        {
            UsuarioId = adminId,
            ProfesionalId = request.ProfesionalId,
            CabinaId = request.CabinaId,
            FechaHoraInicio = request.FechaHoraInicio,
            FechaHoraFin = request.FechaHoraFin,
            Estado = EstadoTurno.Bloqueado,
            Total = 0m,
            FechaCreacion = DateTime.UtcNow,
            Motivo = $"BLOQUEO ADMINISTRATIVO: {request.Motivo.Trim()}"
        };

        await _unitOfWork.Turnos.AddAsync(turnoBloqueo, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TurnoDto
        {
            TurnoId = turnoBloqueo.TurnoId,
            UsuarioId = turnoBloqueo.UsuarioId,
            ClienteNombreCompleto = "[BLOQUEO ADMINISTRATIVO]",
            ProfesionalId = profesional.ProfesionalId,
            ProfesionalNombreCompleto = $"{profesional.Usuario.Nombre} {profesional.Usuario.Apellido}".Trim(),
            CabinaId = cabina.CabinaId,
            CabinaNombre = cabina.Nombre,
            FechaHoraInicio = turnoBloqueo.FechaHoraInicio,
            FechaHoraFin = turnoBloqueo.FechaHoraFin,
            Estado = turnoBloqueo.Estado,
            Total = 0m,
            FechaCreacion = turnoBloqueo.FechaCreacion,
            Motivo = turnoBloqueo.Motivo,
            Servicios = new List<ServicioResumenDto>()
        };
    }
}
