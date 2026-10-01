using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.AgendarTurno;

public class AgendarTurnoCommandHandler : IRequestHandler<AgendarTurnoCommand, TurnoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public AgendarTurnoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TurnoDto> Handle(AgendarTurnoCommand request, CancellationToken cancellationToken)
    {
        if (request.ServicioIds == null || request.ServicioIds.Count == 0)
        {
            throw new BusinessRuleException("Debe seleccionar al menos un servicio para agendar el turno.");
        }

        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        var profesional = await _unitOfWork.Profesionales.GetWithDetailsAsync(request.ProfesionalId, cancellationToken);
        if (profesional == null || !profesional.Activo)
        {
            throw new BusinessRuleException("El profesional seleccionado no existe o no se encuentra activo.");
        }

        var cabina = await _unitOfWork.Cabinas.GetByIdAsync(request.CabinaId, cancellationToken);
        if (cabina == null)
        {
            throw new NotFoundException("Cabina", request.CabinaId);
        }

        var servicios = await _unitOfWork.Servicios.GetByIdsAsync(request.ServicioIds, cancellationToken);
        if (servicios.Count != request.ServicioIds.Distinct().Count())
        {
            throw new BusinessRuleException("Uno o más servicios seleccionados no existen.");
        }

        var duracionTotalMin = servicios.Sum(s => s.DuracionMin);
        var totalPrecio = servicios.Sum(s => s.Precio);
        var fechaHoraFin = request.FechaHoraInicio.AddMinutes(duracionTotalMin);

        // Validación de disponibilidad de cabina
        var cabinaDisponible = await _unitOfWork.Turnos.IsCabinaAvailableAsync(
            request.CabinaId, request.FechaHoraInicio, fechaHoraFin, null, cancellationToken);

        if (!cabinaDisponible)
        {
            throw new BusinessRuleException("La cabina seleccionada ya tiene un turno reservado en ese rango horario.");
        }

        // Validación de disponibilidad de profesional
        var profesionalDisponible = await _unitOfWork.Turnos.IsProfesionalAvailableAsync(
            request.ProfesionalId, request.FechaHoraInicio, fechaHoraFin, null, cancellationToken);

        if (!profesionalDisponible)
        {
            throw new BusinessRuleException("El profesional seleccionado ya tiene un turno asignado en ese rango horario.");
        }

        var turno = new Turno
        {
            UsuarioId = request.UsuarioId,
            ProfesionalId = request.ProfesionalId,
            CabinaId = request.CabinaId,
            FechaHoraInicio = request.FechaHoraInicio,
            FechaHoraFin = fechaHoraFin,
            Estado = EstadoTurno.Pendiente,
            Total = totalPrecio
        };

        foreach (var servicio in servicios)
        {
            turno.TurnoServicios.Add(new TurnoServicio
            {
                Turno = turno,
                ServicioId = servicio.ServicioId
            });
        }

        await _unitOfWork.Turnos.AddAsync(turno, cancellationToken);

        // Notificación automática al usuario
        var notificacion = new Notificacion
        {
            UsuarioId = usuario.UsuarioId,
            Mensaje = $"Tu turno para el {request.FechaHoraInicio:dd/MM/yyyy HH:mm} ha sido reservado con éxito.",
            Tipo = TipoNotificacion.ConfirmacionTurno,
            Leida = false,
            Fecha = DateTime.UtcNow
        };
        await _unitOfWork.Notificaciones.AddAsync(notificacion, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TurnoDto
        {
            TurnoId = turno.TurnoId,
            UsuarioId = usuario.UsuarioId,
            ClienteNombreCompleto = $"{usuario.Nombre} {usuario.Apellido}".Trim(),
            ProfesionalId = profesional.ProfesionalId,
            ProfesionalNombreCompleto = $"{profesional.Usuario.Nombre} {profesional.Usuario.Apellido}".Trim(),
            CabinaId = cabina.CabinaId,
            CabinaNombre = cabina.Nombre,
            FechaHoraInicio = turno.FechaHoraInicio,
            FechaHoraFin = turno.FechaHoraFin,
            Estado = turno.Estado,
            Total = turno.Total,
            Servicios = servicios.Select(s => new ServicioResumenDto
            {
                ServicioId = s.ServicioId,
                Nombre = s.Nombre,
                Precio = s.Precio,
                DuracionMin = s.DuracionMin
            }).ToList()
        };
    }
}
