using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.ConfirmarTurno;

public class ConfirmarTurnoCommandHandler : IRequestHandler<ConfirmarTurnoCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmarTurnoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(ConfirmarTurnoCommand request, CancellationToken cancellationToken)
    {
        var turno = await _unitOfWork.Turnos.GetByIdAsync(request.TurnoId, cancellationToken);
        if (turno == null)
        {
            throw new NotFoundException("Turno", request.TurnoId);
        }

        if (turno.Estado == EstadoTurno.Cancelado)
        {
            throw new BusinessRuleException("No se puede confirmar un turno cancelado.");
        }

        turno.Estado = EstadoTurno.Confirmado;
        _unitOfWork.Turnos.Update(turno);

        var notificacion = new Notificacion
        {
            UsuarioId = turno.UsuarioId,
            Mensaje = $"Tu turno para el {turno.FechaHoraInicio:dd/MM/yyyy HH:mm} ha sido Confirmado.",
            Tipo = TipoNotificacion.ConfirmacionTurno,
            Leida = false,
            Fecha = DateTime.UtcNow
        };
        await _unitOfWork.Notificaciones.AddAsync(notificacion, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
