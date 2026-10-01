using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Pagos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Pagos.Commands.ProcesarPago;

public class ProcesarPagoCommandHandler : IRequestHandler<ProcesarPagoCommand, PreferenciaPagoDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasarelaPagoService _pasarelaPagoService;

    public ProcesarPagoCommandHandler(
        IUnitOfWork unitOfWork,
        IPasarelaPagoService pasarelaPagoService)
    {
        _unitOfWork = unitOfWork;
        _pasarelaPagoService = pasarelaPagoService;
    }

    public async Task<PreferenciaPagoDto> Handle(ProcesarPagoCommand request, CancellationToken cancellationToken)
    {
        if (!request.OrdenId.HasValue && !request.TurnoId.HasValue)
        {
            throw new BusinessRuleException("Debe especificar una OrdenId o un TurnoId para procesar el pago.");
        }

        decimal monto;
        string descripcion;

        if (request.OrdenId.HasValue)
        {
            var orden = await _unitOfWork.OrdenesCompra.GetByIdAsync(request.OrdenId.Value, cancellationToken);
            if (orden == null)
            {
                throw new NotFoundException("OrdenCompra", request.OrdenId.Value);
            }
            monto = orden.Total;
            descripcion = $"Pago de Orden de Compra #{orden.OrdenId}";
        }
        else
        {
            var turno = await _unitOfWork.Turnos.GetByIdAsync(request.TurnoId!.Value, cancellationToken);
            if (turno == null)
            {
                throw new NotFoundException("Turno", request.TurnoId.Value);
            }
            monto = turno.Total;
            descripcion = $"Pago de Turno #{turno.TurnoId}";
        }

        var referenciaExterna = $"PAY-{Guid.NewGuid():N}";

        var initPointUrl = await _pasarelaPagoService.CrearPreferenciaPagoAsync(
            monto, descripcion, referenciaExterna, cancellationToken);

        var pago = new Pago
        {
            OrdenId = request.OrdenId,
            TurnoId = request.TurnoId,
            Monto = monto,
            Estado = EstadoPago.Pendiente,
            Proveedor = request.Proveedor,
            FechaPago = null,
            ReferenciaExterna = referenciaExterna
        };

        await _unitOfWork.Pagos.AddAsync(pago, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PreferenciaPagoDto
        {
            PagoId = pago.PagoId,
            InitPointUrl = initPointUrl,
            ReferenciaExterna = referenciaExterna,
            Monto = monto
        };
    }
}
