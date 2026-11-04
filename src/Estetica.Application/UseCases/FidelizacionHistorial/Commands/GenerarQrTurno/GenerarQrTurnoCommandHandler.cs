using System.Text;
using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.GenerarQrTurno;

public class GenerarQrTurnoCommandHandler : IRequestHandler<GenerarQrTurnoCommand, QrFidelizacionDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IQrCodeGeneratorService _qrCodeGeneratorService;

    public GenerarQrTurnoCommandHandler(
        IUnitOfWork unitOfWork,
        IQrCodeGeneratorService qrCodeGeneratorService)
    {
        _unitOfWork = unitOfWork;
        _qrCodeGeneratorService = qrCodeGeneratorService;
    }

    public async Task<QrFidelizacionDto> Handle(GenerarQrTurnoCommand request, CancellationToken cancellationToken)
    {
        var turno = await _unitOfWork.Turnos.GetWithDetailsAsync(request.TurnoId, cancellationToken);
        if (turno == null)
        {
            throw new NotFoundException("Turno", request.TurnoId);
        }

        if (turno.Estado == EstadoTurno.Cancelado)
        {
            throw new BusinessRuleException("No se puede habilitar código QR de estampita para un turno cancelado.");
        }

        // Marcar el turno como Completado si aún estaba Pendiente, Confirmado o EnProceso
        if (turno.Estado != EstadoTurno.Completado)
        {
            turno.Estado = EstadoTurno.Completado;
            _unitOfWork.Turnos.Update(turno);
        }

        // Buscar si ya existe un Pago aprobado para este turno
        var pago = turno.Pagos.FirstOrDefault(p => p.Estado == EstadoPago.Aprobado);

        if (pago == null)
        {
            // Registrar pago presencial completado
            pago = new Pago
            {
                TurnoId = turno.TurnoId,
                Monto = turno.Total,
                Estado = EstadoPago.Aprobado,
                Proveedor = ProveedorPago.Efectivo,
                FechaPago = DateTime.UtcNow,
                ReferenciaExterna = $"TURNO-QR-{turno.TurnoId}-{Guid.NewGuid().ToString()[..6].ToUpper()}"
            };
            await _unitOfWork.Pagos.AddAsync(pago, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        // Cargar con QrToken
        var pagoConQr = await _unitOfWork.Pagos.GetWithQrTokenAsync(pago.PagoId, cancellationToken);
        if (pagoConQr == null)
        {
            throw new NotFoundException("Pago", pago.PagoId);
        }

        // Si ya fue usado el QR, no permitir duplicar estampitas para este turno
        if (pagoConQr.QrToken != null && pagoConQr.QrToken.Usado)
        {
            throw new BusinessRuleException(
                $"El turno #{turno.TurnoId} ya tiene su estampita acreditada exitosamente. No se permite generar estampitas duplicadas para el mismo turno.");
        }

        QrToken qrToken;

        // Reutilizar si ya existe uno activo (no usado y no expirado en sus 5 minutos)
        if (pagoConQr.QrToken != null && !pagoConQr.QrToken.Usado && pagoConQr.QrToken.FechaExpiracion > DateTime.UtcNow)
        {
            qrToken = pagoConQr.QrToken;
        }
        else
        {
            // Generar nuevo token con expiración estricta de 5 minutos
            var tokenData = $"FID:{pagoConQr.PagoId}:{pagoConQr.ReferenciaExterna}:{Guid.NewGuid():N}";
            var tokenBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData));

            if (pagoConQr.QrToken != null)
            {
                pagoConQr.QrToken.TokenBase64 = tokenBase64;
                pagoConQr.QrToken.FechaCreacion = DateTime.UtcNow;
                pagoConQr.QrToken.FechaExpiracion = DateTime.UtcNow.AddMinutes(5);
                pagoConQr.QrToken.Usado = false;
                qrToken = pagoConQr.QrToken;
                _unitOfWork.QrTokens.Update(qrToken);
            }
            else
            {
                qrToken = new QrToken
                {
                    PagoId = pagoConQr.PagoId,
                    TokenBase64 = tokenBase64,
                    FechaCreacion = DateTime.UtcNow,
                    FechaExpiracion = DateTime.UtcNow.AddMinutes(5),
                    Usado = false
                };
                pagoConQr.QrToken = qrToken;
                await _unitOfWork.QrTokens.AddAsync(qrToken, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var qrSvg = _qrCodeGeneratorService.GenerarQrSvg(qrToken.TokenBase64);
        var qrPngDataUri = _qrCodeGeneratorService.GenerarQrPngDataUri(qrToken.TokenBase64);

        var clienteNombre = turno.Usuario != null
            ? $"{turno.Usuario.Nombre} {turno.Usuario.Apellido}".Trim()
            : "Cliente";

        var servicioNombre = turno.TurnoServicios.FirstOrDefault()?.Servicio?.Nombre ?? "Tratamiento Estético";

        return new QrFidelizacionDto
        {
            QrTokenId = qrToken.QrTokenId,
            PagoId = qrToken.PagoId,
            TurnoId = turno.TurnoId,
            ClienteNombre = clienteNombre,
            ServicioNombre = servicioNombre,
            Token = qrToken.TokenBase64,
            QrSvg = qrSvg,
            QrImageDataUri = qrPngDataUri,
            FechaCreacion = qrToken.FechaCreacion,
            FechaExpiracion = qrToken.FechaExpiracion
        };
    }
}
