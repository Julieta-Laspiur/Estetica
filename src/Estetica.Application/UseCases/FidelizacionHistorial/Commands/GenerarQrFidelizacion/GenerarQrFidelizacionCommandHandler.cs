using System.Text;
using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.GenerarQrFidelizacion;

public class GenerarQrFidelizacionCommandHandler : IRequestHandler<GenerarQrFidelizacionCommand, QrFidelizacionDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IQrCodeGeneratorService _qrCodeGeneratorService;

    public GenerarQrFidelizacionCommandHandler(
        IUnitOfWork unitOfWork,
        IQrCodeGeneratorService qrCodeGeneratorService)
    {
        _unitOfWork = unitOfWork;
        _qrCodeGeneratorService = qrCodeGeneratorService;
    }

    public async Task<QrFidelizacionDto> Handle(GenerarQrFidelizacionCommand request, CancellationToken cancellationToken)
    {
        var pago = await _unitOfWork.Pagos.GetWithQrTokenAsync(request.PagoId, cancellationToken);
        if (pago == null)
        {
            throw new NotFoundException("Pago", request.PagoId);
        }

        if (pago.Estado != EstadoPago.Aprobado)
        {
            throw new BusinessRuleException(
                $"No se puede generar un código QR de fidelización para un pago que no esté Aprobado (Estado actual: '{pago.Estado}').");
        }

        QrToken qrToken;

        // Reutilizar si ya existe uno activo (no usado y no expirado en sus 5 minutos)
        if (pago.QrToken != null && !pago.QrToken.Usado && pago.QrToken.FechaExpiracion > DateTime.UtcNow)
        {
            qrToken = pago.QrToken;
        }
        else
        {
            // Generar nuevo token con expiración estricta de 5 minutos según especificación
            var tokenData = $"FID:{pago.PagoId}:{pago.ReferenciaExterna}:{Guid.NewGuid():N}";
            var tokenBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData));

            if (pago.QrToken != null)
            {
                pago.QrToken.TokenBase64 = tokenBase64;
                pago.QrToken.FechaCreacion = DateTime.UtcNow;
                pago.QrToken.FechaExpiracion = DateTime.UtcNow.AddMinutes(5);
                pago.QrToken.Usado = false;
                qrToken = pago.QrToken;
                _unitOfWork.QrTokens.Update(qrToken);
            }
            else
            {
                qrToken = new QrToken
                {
                    PagoId = pago.PagoId,
                    TokenBase64 = tokenBase64,
                    FechaCreacion = DateTime.UtcNow,
                    FechaExpiracion = DateTime.UtcNow.AddMinutes(5),
                    Usado = false
                };
                pago.QrToken = qrToken;
                await _unitOfWork.QrTokens.AddAsync(qrToken, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var qrSvg = _qrCodeGeneratorService.GenerarQrSvg(qrToken.TokenBase64);
        var qrPngDataUri = _qrCodeGeneratorService.GenerarQrPngDataUri(qrToken.TokenBase64);

        return new QrFidelizacionDto
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
}
