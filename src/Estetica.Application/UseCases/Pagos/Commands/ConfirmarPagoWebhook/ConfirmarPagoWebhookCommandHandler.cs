using System.Text;
using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Pagos.Commands.ConfirmarPagoWebhook;

public class ConfirmarPagoWebhookCommandHandler : IRequestHandler<ConfirmarPagoWebhookCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmarPagoWebhookCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(ConfirmarPagoWebhookCommand request, CancellationToken cancellationToken)
    {
        var pago = await _unitOfWork.Pagos.GetByReferenciaExternaAsync(request.ReferenciaExterna, cancellationToken);
        if (pago == null)
        {
            throw new NotFoundException($"No se encontró ningún pago con la referencia externa '{request.ReferenciaExterna}'.");
        }

        pago.Estado = request.EstadoPago;

        if (request.EstadoPago == EstadoPago.Aprobado)
        {
            pago.FechaPago = DateTime.UtcNow;

            int usuarioId = 0;
            string tipoAsociado = "";

            if (pago.OrdenId.HasValue)
            {
                var orden = await _unitOfWork.OrdenesCompra.GetByIdAsync(pago.OrdenId.Value, cancellationToken);
                if (orden != null)
                {
                    orden.Estado = EstadoOrden.Pagada;
                    _unitOfWork.OrdenesCompra.Update(orden);
                    usuarioId = orden.UsuarioId;
                    tipoAsociado = $"tu Orden de Compra #{orden.OrdenId}";
                }
            }
            else if (pago.TurnoId.HasValue)
            {
                var turno = await _unitOfWork.Turnos.GetByIdAsync(pago.TurnoId.Value, cancellationToken);
                if (turno != null)
                {
                    turno.Estado = EstadoTurno.Confirmado;
                    _unitOfWork.Turnos.Update(turno);
                    usuarioId = turno.UsuarioId;
                    tipoAsociado = $"tu Turno #{turno.TurnoId}";
                }
            }

            // Generar QrToken si no existe ya
            if (pago.QrToken == null)
            {
                var tokenData = $"{pago.PagoId}:{pago.ReferenciaExterna}:{DateTime.UtcNow.Ticks}";
                var tokenBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData));

                var qrToken = new QrToken
                {
                    PagoId = pago.PagoId,
                    TokenBase64 = tokenBase64,
                    FechaCreacion = DateTime.UtcNow,
                    FechaExpiracion = DateTime.UtcNow.AddDays(7),
                    Usado = false
                };

                pago.QrToken = qrToken;
            }

            if (usuarioId > 0)
            {
                await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                {
                    UsuarioId = usuarioId,
                    Mensaje = $"¡Pago acreditado con éxito! Se ha confirmado {tipoAsociado}.",
                    Tipo = TipoNotificacion.ActualizacionOrden,
                    Leida = false,
                    Fecha = DateTime.UtcNow
                }, cancellationToken);
            }
        }

        _unitOfWork.Pagos.Update(pago);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
