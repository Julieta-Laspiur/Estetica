using System.Text;
using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using Estetica.Application.UseCases.Pagos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Pagos.Commands.RegistrarPagoPresencial;

public class RegistrarPagoPresencialCommandHandler : IRequestHandler<RegistrarPagoPresencialCommand, PagoPresencialResultadoDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IQrCodeGeneratorService _qrCodeGeneratorService;

    public RegistrarPagoPresencialCommandHandler(
        IUnitOfWork unitOfWork,
        IQrCodeGeneratorService qrCodeGeneratorService)
    {
        _unitOfWork = unitOfWork;
        _qrCodeGeneratorService = qrCodeGeneratorService;
    }

    public async Task<PagoPresencialResultadoDto> Handle(RegistrarPagoPresencialCommand request, CancellationToken cancellationToken)
    {
        if (!request.TurnoId.HasValue && !request.OrdenId.HasValue)
        {
            throw new BusinessRuleException("Debe especificar al menos un TurnoId o un OrdenId para registrar el cobro.");
        }

        if (request.MetodoPago == ProveedorPago.MercadoPago)
        {
            throw new BusinessRuleException("Para procesar pagos mediante Mercado Pago utilice el flujo de pago digital con redirección.");
        }

        decimal monto;
        int usuarioId;
        string conceptoCobro;

        if (request.TurnoId.HasValue)
        {
            var turno = await _unitOfWork.Turnos.GetByIdAsync(request.TurnoId.Value, cancellationToken);
            if (turno == null)
            {
                throw new NotFoundException("Turno", request.TurnoId.Value);
            }

            monto = request.Monto ?? turno.Total;
            usuarioId = turno.UsuarioId;
            conceptoCobro = $"Cobro de Turno #{turno.TurnoId}";

            if (turno.Estado == EstadoTurno.Pendiente)
            {
                turno.Estado = EstadoTurno.Confirmado;
                _unitOfWork.Turnos.Update(turno);
            }
        }
        else
        {
            var orden = await _unitOfWork.OrdenesCompra.GetWithDetallesAsync(request.OrdenId!.Value, cancellationToken);
            if (orden == null)
            {
                throw new NotFoundException("OrdenCompra", request.OrdenId.Value);
            }

            monto = request.Monto ?? orden.Total;
            usuarioId = orden.UsuarioId;
            conceptoCobro = $"Cobro de Orden de Compra #{orden.OrdenId}";

            if (orden.Estado != EstadoOrden.Pagada)
            {
                orden.Estado = EstadoOrden.Pagada;
                _unitOfWork.OrdenesCompra.Update(orden);
            }
        }

        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(usuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", usuarioId);
        }

        var referenciaExterna = $"PRES-{request.MetodoPago.ToString().ToUpper()}-{Guid.NewGuid().ToString()[..8].ToUpper()}";

        var pago = new Pago
        {
            TurnoId = request.TurnoId,
            OrdenId = request.OrdenId,
            Monto = monto,
            Estado = EstadoPago.Aprobado,
            Proveedor = request.MetodoPago,
            FechaPago = DateTime.UtcNow,
            ReferenciaExterna = referenciaExterna
        };

        await _unitOfWork.Pagos.AddAsync(pago, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        bool cicloDiezCompletado = false;
        string? cuponGeneradoCodigo = null;
        int? estampitasActuales = null;
        QrFidelizacionDto? qrDto = null;

        if (request.AcreditarEstampitaDirectamente)
        {
            var fidelizacion = await _unitOfWork.Fidelizaciones.GetByUsuarioIdAsync(usuarioId, cancellationToken);
            if (fidelizacion == null)
            {
                fidelizacion = new Fidelizacion
                {
                    UsuarioId = usuarioId,
                    EstampitasActuales = 0,
                    UltimaActualizacion = DateTime.UtcNow
                };
                await _unitOfWork.Fidelizaciones.AddAsync(fidelizacion, cancellationToken);
            }

            fidelizacion.EstampitasActuales += 1;
            fidelizacion.UltimaActualizacion = DateTime.UtcNow;

            if (fidelizacion.EstampitasActuales >= 10)
            {
                cicloDiezCompletado = true;
                fidelizacion.EstampitasActuales -= 10;
                cuponGeneradoCodigo = $"PREMIO-{Guid.NewGuid().ToString()[..6].ToUpper()}";

                var cupon = new Cupon
                {
                    UsuarioId = usuarioId,
                    Codigo = cuponGeneradoCodigo,
                    Descuento = 20,
                    Estado = EstadoCupon.Activo,
                    FechaExpiracion = DateTime.UtcNow.AddDays(30)
                };

                await _unitOfWork.Cupones.AddAsync(cupon, cancellationToken);

                await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                {
                    UsuarioId = usuarioId,
                    Mensaje = $"¡Completaste tu cuponera con tu pago presencial! Canje automático realizado: cupón '{cuponGeneradoCodigo}' del 20% listo para usar.",
                    Tipo = TipoNotificacion.Promocion,
                    Leida = false,
                    Fecha = DateTime.UtcNow
                }, cancellationToken);
            }
            else
            {
                await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                {
                    UsuarioId = usuarioId,
                    Mensaje = $"¡Sumaste 1 estampita digital por tu pago en mostrador! Progreso actual: {fidelizacion.EstampitasActuales}/10.",
                    Tipo = TipoNotificacion.Promocion,
                    Leida = false,
                    Fecha = DateTime.UtcNow
                }, cancellationToken);
            }

            estampitasActuales = fidelizacion.EstampitasActuales;
            _unitOfWork.Fidelizaciones.Update(fidelizacion);
        }
        else
        {
            // Generar código QR dinámico temporal (5 minutos de vigencia) para mostrar en pantalla
            var tokenData = $"FID:{pago.PagoId}:{pago.ReferenciaExterna}:{Guid.NewGuid():N}";
            var tokenBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData));

            var qrToken = new QrToken
            {
                PagoId = pago.PagoId,
                TokenBase64 = tokenBase64,
                FechaCreacion = DateTime.UtcNow,
                FechaExpiracion = DateTime.UtcNow.AddMinutes(5),
                Usado = false
            };

            await _unitOfWork.QrTokens.AddAsync(qrToken, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var qrSvg = _qrCodeGeneratorService.GenerarQrSvg(qrToken.TokenBase64);
            var qrPngDataUri = _qrCodeGeneratorService.GenerarQrPngDataUri(qrToken.TokenBase64);

            qrDto = new QrFidelizacionDto
            {
                QrTokenId = qrToken.QrTokenId,
                PagoId = qrToken.PagoId,
                Token = qrToken.TokenBase64,
                QrSvg = qrSvg,
                QrImageDataUri = qrPngDataUri,
                FechaCreacion = qrToken.FechaCreacion,
                FechaExpiracion = qrToken.FechaExpiracion
            };
        }

        // Notificación de confirmación de pago al cliente
        await _unitOfWork.Notificaciones.AddAsync(new Notificacion
        {
            UsuarioId = usuarioId,
            Mensaje = $"¡Pago presencial de ${monto:F2} ({request.MetodoPago}) registrado exitosamente para {conceptoCobro}!",
            Tipo = TipoNotificacion.ActualizacionOrden,
            Leida = false,
            Fecha = DateTime.UtcNow
        }, cancellationToken);

        // HU-16: Notificación inmediata para el panel del Administrador ante cobros presenciales
        var adminsPresencial = await _unitOfWork.Usuarios.GetByRolAsync(RolUsuario.Administrador, cancellationToken);
        foreach (var admin in adminsPresencial)
        {
            await _unitOfWork.Notificaciones.AddAsync(new Notificacion
            {
                UsuarioId = admin.UsuarioId,
                Mensaje = $"ALERTA DE PAGO PRESENCIAL: Se registró cobro de ${monto:F2} ({request.MetodoPago}) para {conceptoCobro}. Cliente: {usuario.Nombre} {usuario.Apellido}. Ref: {referenciaExterna}.",
                Tipo = TipoNotificacion.AlertaPago,
                Leida = false,
                Fecha = DateTime.UtcNow
            }, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PagoPresencialResultadoDto
        {
            PagoId = pago.PagoId,
            TurnoId = pago.TurnoId,
            OrdenId = pago.OrdenId,
            UsuarioId = usuarioId,
            ClienteNombre = $"{usuario.Nombre} {usuario.Apellido}",
            Monto = monto,
            MetodoPago = request.MetodoPago,
            Estado = EstadoPago.Aprobado,
            FechaPago = pago.FechaPago!.Value,
            ReferenciaExterna = referenciaExterna,
            ComprobanteNotas = request.NotasComprobante,
            EstampitaAcreditadaDirectamente = request.AcreditarEstampitaDirectamente,
            EstampitasActuales = estampitasActuales,
            CicloDiezEstampitasCompletado = cicloDiezCompletado,
            CuponGenerado = cuponGeneradoCodigo,
            QrParaMostrarEnPantalla = qrDto
        };
    }
}
