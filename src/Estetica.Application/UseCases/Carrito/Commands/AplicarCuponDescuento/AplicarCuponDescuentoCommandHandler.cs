using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Carrito.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.AplicarCuponDescuento;

public class AplicarCuponDescuentoCommandHandler : IRequestHandler<AplicarCuponDescuentoCommand, CuponDescuentoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public AplicarCuponDescuentoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CuponDescuentoDto> Handle(AplicarCuponDescuentoCommand request, CancellationToken cancellationToken)
    {
        var cupon = await _unitOfWork.Cupones.GetByCodigoValidoAsync(
            request.CodigoCupon, request.UsuarioId, cancellationToken);

        if (cupon == null)
        {
            throw new BusinessRuleException($"El cupón '{request.CodigoCupon}' no es válido, se encuentra vencido o ya fue utilizado.");
        }

        var totalConDescuento = Math.Max(0, request.TotalOriginal - cupon.Descuento);

        return new CuponDescuentoDto
        {
            Codigo = cupon.Codigo,
            Descuento = cupon.Descuento,
            TotalOriginal = request.TotalOriginal,
            TotalConDescuento = totalConDescuento,
            Mensaje = $"Cupón aplicado con éxito. Descuento: ${cupon.Descuento:F2}."
        };
    }
}
