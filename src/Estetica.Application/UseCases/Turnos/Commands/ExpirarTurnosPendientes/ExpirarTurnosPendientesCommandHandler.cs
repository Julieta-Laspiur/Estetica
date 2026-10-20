using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.ExpirarTurnosPendientes;

public class ExpirarTurnosPendientesCommandHandler : IRequestHandler<ExpirarTurnosPendientesCommand, int>
{
    private readonly IUnitOfWork _unitOfWork;

    public ExpirarTurnosPendientesCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(ExpirarTurnosPendientesCommand request, CancellationToken cancellationToken)
    {
        var turnosPendientes = await _unitOfWork.Turnos.GetByEstadoAsync(EstadoTurno.Pendiente, cancellationToken);
        var ahora = DateTime.UtcNow;
        int expirados = 0;

        foreach (var turno in turnosPendientes)
        {
            // Regla HU-03: Las reservas pendientes expiran a los 10 minutos si no se confirma el pago
            var minutosDesdeCreacion = (ahora - turno.FechaCreacion).TotalMinutes;
            if (minutosDesdeCreacion >= 10)
            {
                var pagos = await _unitOfWork.Pagos.GetByTurnoIdAsync(turno.TurnoId, cancellationToken);
                bool tienePagoAprobado = pagos.Any(p => p.Estado == EstadoPago.Aprobado);

                if (!tienePagoAprobado)
                {
                    turno.Estado = EstadoTurno.Cancelado;
                    turno.Motivo = "Expirado automáticamente por el sistema al superar los 10 minutos sin confirmación de pago.";
                    _unitOfWork.Turnos.Update(turno);

                    await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                    {
                        UsuarioId = turno.UsuarioId,
                        Mensaje = $"Tu reserva para el {turno.FechaHoraInicio:dd/MM/yyyy HH:mm} ha expirado debido a que no se completó el pago en los 10 minutos posteriores a la solicitud.",
                        Tipo = TipoNotificacion.Sistema,
                        Leida = false,
                        Fecha = ahora
                    }, cancellationToken);

                    expirados++;
                }
            }
        }

        if (expirados > 0)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return expirados;
    }
}
