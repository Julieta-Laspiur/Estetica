using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.ReprogramarTurno;

public class ReprogramarTurnoCommandHandler : IRequestHandler<ReprogramarTurnoCommand, TurnoDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public ReprogramarTurnoCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<TurnoDto> Handle(ReprogramarTurnoCommand request, CancellationToken cancellationToken)
    {
        var turno = await _unitOfWork.Turnos.GetWithDetailsAsync(request.TurnoId, cancellationToken);
        if (turno == null)
        {
            throw new NotFoundException("Turno", request.TurnoId);
        }

        if (turno.Estado == EstadoTurno.Cancelado || turno.Estado == EstadoTurno.Completado)
        {
            throw new BusinessRuleException($"No se puede reprogramar un turno que se encuentra en estado '{turno.Estado}'.");
        }

        bool esStaff = _currentUserService.EstaEnRol("Administrador") ||
                       _currentUserService.EstaEnRol("Recepcionista");

        // Regla HU-04: La reprogramación autónoma del cliente requiere al menos 24 horas de anticipación
        if (!esStaff)
        {
            int usuarioSolicitante = request.SolicitanteUsuarioId ?? _currentUserService.UsuarioId ?? 0;
            if (usuarioSolicitante != 0 && usuarioSolicitante != turno.UsuarioId)
            {
                throw new UnauthorizedAccessException("No tiene autorización para reprogramar un turno que no le pertenece.");
            }

            var horasRestantes = (turno.FechaHoraInicio - DateTime.UtcNow).TotalHours;
            if (horasRestantes < 24)
            {
                throw new BusinessRuleException(
                    "La reprogramación autónoma solo puede realizarse con al menos 24 horas de anticipación respecto al horario pactado originalmente. Por favor, comuníquese con el centro estético.");
            }
        }
        else
        {
            // Regla HU-05: Modificaciones por el personal requieren justificación obligatoria
            if (string.IsNullOrWhiteSpace(request.Motivo))
            {
                throw new BusinessRuleException("Las reprogramaciones realizadas por el personal administrativo requieren una justificación obligatoria.");
            }
        }

        var duracionTotalMin = (int)(turno.FechaHoraFin - turno.FechaHoraInicio).TotalMinutes;
        var nuevaFechaHoraFin = request.NuevaFechaHoraInicio.AddMinutes(duracionTotalMin);

        var cabinaId = request.NuevaCabinaId ?? turno.CabinaId;
        var profesionalId = request.NuevoProfesionalId ?? turno.ProfesionalId;

        // Validar disponibilidad excluyendo el propio turno que se está modificando
        var cabinaDisponible = await _unitOfWork.Turnos.IsCabinaAvailableAsync(
            cabinaId, request.NuevaFechaHoraInicio, nuevaFechaHoraFin, turno.TurnoId, cancellationToken);

        if (!cabinaDisponible)
        {
            throw new BusinessRuleException("La cabina no se encuentra disponible en el nuevo horario seleccionado.");
        }

        var profesionalDisponible = await _unitOfWork.Turnos.IsProfesionalAvailableAsync(
            profesionalId, request.NuevaFechaHoraInicio, nuevaFechaHoraFin, turno.TurnoId, cancellationToken);

        if (!profesionalDisponible)
        {
            throw new BusinessRuleException("El profesional no se encuentra disponible en el nuevo horario seleccionado.");
        }

        turno.FechaHoraInicio = request.NuevaFechaHoraInicio;
        turno.FechaHoraFin = nuevaFechaHoraFin;
        turno.CabinaId = cabinaId;
        turno.ProfesionalId = profesionalId;
        turno.Motivo = request.Motivo?.Trim();

        _unitOfWork.Turnos.Update(turno);

        var motivoTexto = !string.IsNullOrWhiteSpace(request.Motivo)
            ? $" Motivo: {request.Motivo.Trim()}."
            : string.Empty;

        var notificacion = new Notificacion
        {
            UsuarioId = turno.UsuarioId,
            Mensaje = $"Tu turno ha sido reprogramado para el {request.NuevaFechaHoraInicio:dd/MM/yyyy HH:mm}.{motivoTexto}",
            Tipo = TipoNotificacion.RecordatorioTurno,
            Leida = false,
            Fecha = DateTime.UtcNow
        };
        await _unitOfWork.Notificaciones.AddAsync(notificacion, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Recargar entidad completa
        var turnoActualizado = (await _unitOfWork.Turnos.GetWithDetailsAsync(turno.TurnoId, cancellationToken))!;

        return new TurnoDto
        {
            TurnoId = turnoActualizado.TurnoId,
            UsuarioId = turnoActualizado.UsuarioId,
            ClienteNombreCompleto = $"{turnoActualizado.Usuario.Nombre} {turnoActualizado.Usuario.Apellido}".Trim(),
            ProfesionalId = turnoActualizado.ProfesionalId,
            ProfesionalNombreCompleto = $"{turnoActualizado.Profesional.Usuario.Nombre} {turnoActualizado.Profesional.Usuario.Apellido}".Trim(),
            CabinaId = turnoActualizado.CabinaId,
            CabinaNombre = turnoActualizado.Cabina.Nombre,
            FechaHoraInicio = turnoActualizado.FechaHoraInicio,
            FechaHoraFin = turnoActualizado.FechaHoraFin,
            Estado = turnoActualizado.Estado,
            Total = turnoActualizado.Total,
            FechaCreacion = turnoActualizado.FechaCreacion,
            Motivo = turnoActualizado.Motivo,
            Servicios = turnoActualizado.TurnoServicios.Select(ts => new ServicioResumenDto
            {
                ServicioId = ts.Servicio.ServicioId,
                Nombre = ts.Servicio.Nombre,
                Precio = ts.Servicio.Precio,
                DuracionMin = ts.Servicio.DuracionMin
            }).ToList()
        };
    }
}
