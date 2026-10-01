using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.AcumularEstampitas;

public class AcumularEstampitasCommandHandler : IRequestHandler<AcumularEstampitasCommand, FidelizacionDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public AcumularEstampitasCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<FidelizacionDto> Handle(AcumularEstampitasCommand request, CancellationToken cancellationToken)
    {
        if (request.CantidadEstampitas <= 0)
        {
            throw new BusinessRuleException("La cantidad de estampitas a acumular debe ser mayor a cero.");
        }

        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        var fidelizacion = await _unitOfWork.Fidelizaciones.GetByUsuarioIdAsync(request.UsuarioId, cancellationToken);

        if (fidelizacion == null)
        {
            fidelizacion = new Fidelizacion
            {
                UsuarioId = request.UsuarioId,
                EstampitasActuales = request.CantidadEstampitas,
                UltimaActualizacion = DateTime.UtcNow
            };
            await _unitOfWork.Fidelizaciones.AddAsync(fidelizacion, cancellationToken);
        }
        else
        {
            fidelizacion.EstampitasActuales += request.CantidadEstampitas;
            fidelizacion.UltimaActualizacion = DateTime.UtcNow;
            _unitOfWork.Fidelizaciones.Update(fidelizacion);
        }

        // Notificación de beneficio al cliente
        var notificacion = new Notificacion
        {
            UsuarioId = request.UsuarioId,
            Mensaje = $"¡Sumaste {request.CantidadEstampitas} estampita(s)! Total acumulado: {fidelizacion.EstampitasActuales}.",
            Tipo = TipoNotificacion.Promocion,
            Leida = false,
            Fecha = DateTime.UtcNow
        };
        await _unitOfWork.Notificaciones.AddAsync(notificacion, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new FidelizacionDto
        {
            FidelizacionId = fidelizacion.FidelizacionId,
            UsuarioId = fidelizacion.UsuarioId,
            EstampitasActuales = fidelizacion.EstampitasActuales,
            UltimaActualizacion = fidelizacion.UltimaActualizacion
        };
    }
}
