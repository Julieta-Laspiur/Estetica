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

        // Idempotencia: Si ya estaba aprobado, no procesar nuevamente para evitar duplicaciones
        if (pago.Estado == EstadoPago.Aprobado && request.EstadoPago == EstadoPago.Aprobado)
        {
            return true;
        }

        pago.Estado = request.EstadoPago;

        if (request.EstadoPago == EstadoPago.Aprobado)
        {
            pago.FechaPago = DateTime.UtcNow;

            int usuarioId = 0;
            string tipoAsociado = "";

            if (pago.OrdenId.HasValue)
            {
                var orden = await _unitOfWork.OrdenesCompra.GetWithDetallesAsync(pago.OrdenId.Value, cancellationToken);
                if (orden != null)
                {
                    orden.Estado = EstadoOrden.Pagada;
                    _unitOfWork.OrdenesCompra.Update(orden);
                    usuarioId = orden.UsuarioId;
                    tipoAsociado = $"tu Orden de Compra #{orden.OrdenId}";

                    // RF-07: Alertar si algún producto alcanza o cae por debajo del stock mínimo
                    foreach (var detalle in orden.Detalles)
                    {
                        var prod = await _unitOfWork.Productos.GetByIdAsync(detalle.ProductoId, cancellationToken);
                        if (prod != null && prod.StockActual <= prod.StockMinimo)
                        {
                            var admins = await _unitOfWork.Usuarios.GetByRolAsync(RolUsuario.Administrador, cancellationToken);
                            foreach (var admin in admins)
                            {
                                await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                                {
                                    UsuarioId = admin.UsuarioId,
                                    Mensaje = $"ALERTA DE INVENTARIO: El producto '{prod.Nombre}' ha alcanzado el umbral mínimo (Stock actual: {prod.StockActual}, Mínimo: {prod.StockMinimo}).",
                                    Tipo = TipoNotificacion.AlertaStock,
                                    Leida = false,
                                    Fecha = DateTime.UtcNow
                                }, cancellationToken);
                            }
                        }
                    }
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

            // Generar QrToken temporal con 5 minutos de validez estricta según RNF de Seguridad
            if (pago.QrToken == null)
            {
                var tokenData = $"FID:{pago.PagoId}:{pago.ReferenciaExterna}:{Guid.NewGuid():N}";
                var tokenBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData));

                var qrToken = new QrToken
                {
                    PagoId = pago.PagoId,
                    TokenBase64 = tokenBase64,
                    FechaCreacion = DateTime.UtcNow,
                    FechaExpiracion = DateTime.UtcNow.AddMinutes(5), // 5 minutos de vigencia
                    Usado = false
                };

                pago.QrToken = qrToken;
            }

            // Notificación al cliente
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

            // HU-16: Notificación inmediata para el panel del Administrador ante pagos aprobados
            var administradores = await _unitOfWork.Usuarios.GetByRolAsync(RolUsuario.Administrador, cancellationToken);
            foreach (var admin in administradores)
            {
                await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                {
                    UsuarioId = admin.UsuarioId,
                    Mensaje = $"ALERTA DE PAGO APROBADO: Se acreditó el pago de ${pago.Monto:F2} para {tipoAsociado}. Ref: {pago.ReferenciaExterna}.",
                    Tipo = TipoNotificacion.AlertaPago,
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
