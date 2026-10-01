using System.Text;
using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Pagos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Pagos.Commands.GenerarQrToken;

public class GenerarQrTokenCommandHandler : IRequestHandler<GenerarQrTokenCommand, QrTokenDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GenerarQrTokenCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<QrTokenDto> Handle(GenerarQrTokenCommand request, CancellationToken cancellationToken)
    {
        var pago = await _unitOfWork.Pagos.GetWithQrTokenAsync(request.PagoId, cancellationToken);
        if (pago == null)
        {
            throw new NotFoundException("Pago", request.PagoId);
        }

        if (pago.Estado != EstadoPago.Aprobado)
        {
            throw new BusinessRuleException($"No se puede generar un código QR para un pago que no se encuentra Aprobado (Estado actual: '{pago.Estado}').");
        }

        if (pago.QrToken != null)
        {
            return new QrTokenDto
            {
                QrTokenId = pago.QrToken.QrTokenId,
                PagoId = pago.PagoId,
                TokenBase64 = pago.QrToken.TokenBase64,
                FechaCreacion = pago.QrToken.FechaCreacion,
                FechaExpiracion = pago.QrToken.FechaExpiracion,
                Usado = pago.QrToken.Usado
            };
        }

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
        _unitOfWork.Pagos.Update(pago);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new QrTokenDto
        {
            QrTokenId = qrToken.QrTokenId,
            PagoId = qrToken.PagoId,
            TokenBase64 = qrToken.TokenBase64,
            FechaCreacion = qrToken.FechaCreacion,
            FechaExpiracion = qrToken.FechaExpiracion,
            Usado = qrToken.Usado
        };
    }
}
