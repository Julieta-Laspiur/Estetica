using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.CancelarTurno;

public class CancelarTurnoCommandHandler : IRequestHandler<CancelarTurnoCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CancelarTurnoCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(CancelarTurnoCommand request, CancellationToken cancellationToken)
    {
        var turno = await _unitOfWork.Turnos.GetByIdAsync(request.TurnoId, cancellationToken);
        if (turno == null)
        {
            throw new NotFoundException("Turno", request.TurnoId);
        }

        if (turno.Estado == EstadoTurno.Cancelado)
        {
            throw new BusinessRuleException("El turno ya se encontraba cancelado.");
        }

        if (turno.Estado == EstadoTurno.Completado)
        {
            throw new BusinessRuleException("No se puede cancelar un turno que ya ha sido completado.");
        }

        bool esStaff = _currentUserService.EstaEnRol("Administrador") ||
                       _currentUserService.EstaEnRol("Recepcionista");

        // Regla HU-04: La cancelación autónoma por parte del cliente requiere más de 24 horas de anticipación
        if (!esStaff)
        {
            // Validar que el cliente solo cancele sus propios turnos (anti-IDOR)
            int usuarioSolicitante = request.SolicitanteUsuarioId ?? _currentUserService.UsuarioId ?? 0;
            if (usuarioSolicitante != 0 && usuarioSolicitante != turno.UsuarioId)
            {
                throw new UnauthorizedAccessException("No tiene autorización para cancelar un turno asignado a otro usuario.");
            }

            var horasRestantes = (turno.FechaHoraInicio - DateTime.UtcNow).TotalHours;
            if (horasRestantes < 24)
            {
                throw new BusinessRuleException(
                    "La cancelación autónoma solo puede realizarse con al menos 24 horas de anticipación respecto al horario de la cita. Por favor comuníquese telefónicamente con la recepción del centro estético.");
            }
        }
        else
        {
            // Regla HU-05: Modificaciones realizadas por el personal requieren justificación obligatoria
            if (string.IsNullOrWhiteSpace(request.Motivo))
            {
                throw new BusinessRuleException("Las cancelaciones realizadas por el personal administrativo requieren una justificación obligatoria.");
            }
        }

        turno.Estado = EstadoTurno.Cancelado;
        turno.Motivo = request.Motivo?.Trim();
        _unitOfWork.Turnos.Update(turno);

        var motivoTexto = !string.IsNullOrWhiteSpace(request.Motivo)
            ? $" Motivo: {request.Motivo.Trim()}."
            : string.Empty;

        // Notificación al cliente
        var mensajeNotificacion = esStaff
            ? $"AVISO DE ADMINISTRACIÓN: Tu turno para el {turno.FechaHoraInicio:dd/MM/yyyy HH:mm} ha sido cancelado por el centro estético.{motivoTexto}"
            : $"Tu turno para el {turno.FechaHoraInicio:dd/MM/yyyy HH:mm} ha sido cancelado con éxito.{motivoTexto}";

        var notificacion = new Notificacion
        {
            UsuarioId = turno.UsuarioId,
            Mensaje = mensajeNotificacion,
            Tipo = TipoNotificacion.Sistema,
            Leida = false,
            Fecha = DateTime.UtcNow
        };
        await _unitOfWork.Notificaciones.AddAsync(notificacion, cancellationToken);

        // Si fue cancelado por el cliente, alertar al Administrador
        if (!esStaff)
        {
            var admins = await _unitOfWork.Usuarios.GetByRolAsync(RolUsuario.Administrador, cancellationToken);
            foreach (var admin in admins)
            {
                await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                {
                    UsuarioId = admin.UsuarioId,
                    Mensaje = $"El cliente #{turno.UsuarioId} ha cancelado su turno #{turno.TurnoId} programado para el {turno.FechaHoraInicio:dd/MM/yyyy HH:mm}. Horario liberado.",
                    Tipo = TipoNotificacion.Sistema,
                    Leida = false,
                    Fecha = DateTime.UtcNow
                }, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
