using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.CanjearCuponFidelizacion;

public class CanjearCuponFidelizacionCommandHandler : IRequestHandler<CanjearCuponFidelizacionCommand, CuponCanjeadoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public CanjearCuponFidelizacionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CuponCanjeadoDto> Handle(CanjearCuponFidelizacionCommand request, CancellationToken cancellationToken)
    {
        var fidelizacion = await _unitOfWork.Fidelizaciones.GetByUsuarioIdAsync(request.UsuarioId, cancellationToken);
        if (fidelizacion == null || fidelizacion.EstampitasActuales < request.EstampitasACanjear)
        {
            var disponibles = fidelizacion?.EstampitasActuales ?? 0;
            throw new BusinessRuleException($"Estampitas insuficientes. Disponibles: {disponibles}, requeridas: {request.EstampitasACanjear}.");
        }

        fidelizacion.EstampitasActuales -= request.EstampitasACanjear;
        fidelizacion.UltimaActualizacion = DateTime.UtcNow;
        _unitOfWork.Fidelizaciones.Update(fidelizacion);

        var codigo = $"PREMIO-{Guid.NewGuid().ToString()[..6].ToUpper()}";
        var fechaExpiracion = DateTime.UtcNow.AddDays(30);

        var cupon = new Cupon
        {
            UsuarioId = request.UsuarioId,
            Codigo = codigo,
            Descuento = request.MontoDescuento,
            Estado = EstadoCupon.Activo,
            FechaExpiracion = fechaExpiracion
        };

        await _unitOfWork.Cupones.AddAsync(cupon, cancellationToken);

        var notificacion = new Notificacion
        {
            UsuarioId = request.UsuarioId,
            Mensaje = $"¡Canje exitoso! Obtuviste el cupón '{codigo}' por ${request.MontoDescuento:F2} válido hasta {fechaExpiracion:dd/MM/yyyy}.",
            Tipo = TipoNotificacion.Promocion,
            Leida = false,
            Fecha = DateTime.UtcNow
        };
        await _unitOfWork.Notificaciones.AddAsync(notificacion, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CuponCanjeadoDto
        {
            CuponId = cupon.CuponId,
            Codigo = cupon.Codigo,
            Descuento = cupon.Descuento,
            FechaExpiracion = cupon.FechaExpiracion,
            EstampitasRestantes = fidelizacion.EstampitasActuales,
            Mensaje = $"Has canjeado {request.EstampitasACanjear} estampitas por el cupón '{codigo}'."
        };
    }
}
