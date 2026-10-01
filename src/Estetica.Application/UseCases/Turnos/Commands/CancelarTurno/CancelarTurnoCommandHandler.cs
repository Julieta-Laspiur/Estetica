using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.CancelarTurno;

public class CancelarTurnoCommandHandler : IRequestHandler<CancelarTurnoCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public CancelarTurnoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
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

        turno.Estado = EstadoTurno.Cancelado;
        _unitOfWork.Turnos.Update(turno);

        var motivoTexto = !string.IsNullOrWhiteSpace(request.Motivo)
            ? $" Motivo: {request.Motivo.Trim()}."
            : string.Empty;

        var notificacion = new Notificacion
        {
            UsuarioId = turno.UsuarioId,
            Mensaje = $"Tu turno para el {turno.FechaHoraInicio:dd/MM/yyyy HH:mm} ha sido cancelado.{motivoTexto}",
            Tipo = TipoNotificacion.Sistema,
            Leida = false,
            Fecha = DateTime.UtcNow
        };

        await _unitOfWork.Notificaciones.AddAsync(notificacion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
