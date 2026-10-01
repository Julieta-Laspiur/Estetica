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

    public ReprogramarTurnoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        var duracionTotalMin = (int)(turno.FechaHoraFin - turno.FechaHoraInicio).TotalMinutes;
        var nuevaFechaHoraFin = request.NuevaFechaHoraInicio.AddMinutes(duracionTotalMin);

        var cabinaId = request.NuevaCabinaId ?? turno.CabinaId;
        var profesionalId = request.NuevoProfesionalId ?? turno.ProfesionalId;

        // Validar disponibilidad excluyendo el propio turno
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
        turno.Estado = EstadoTurno.Pendiente;

        _unitOfWork.Turnos.Update(turno);

        var notificacion = new Notificacion
        {
            UsuarioId = turno.UsuarioId,
            Mensaje = $"Tu turno ha sido reprogramado para el {request.NuevaFechaHoraInicio:dd/MM/yyyy HH:mm}.",
            Tipo = TipoNotificacion.RecordatorioTurno,
            Leida = false,
            Fecha = DateTime.UtcNow
        };
        await _unitOfWork.Notificaciones.AddAsync(notificacion, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Recargar información actualizada
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
