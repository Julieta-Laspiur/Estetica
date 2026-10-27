using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Commands.ActualizarServicio;

public class ActualizarServicioCommandHandler : IRequestHandler<ActualizarServicioCommand, ServicioDetalleDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public ActualizarServicioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ServicioDetalleDto> Handle(ActualizarServicioCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
        {
            throw new BusinessRuleException("El nombre del servicio es obligatorio.");
        }

        if (request.Precio < 0)
        {
            throw new BusinessRuleException("El precio del servicio no puede ser negativo.");
        }

        if (request.DuracionMin <= 0)
        {
            throw new BusinessRuleException("La duración del servicio debe ser mayor a cero minutos.");
        }

        var servicio = await _unitOfWork.Servicios.GetByIdAsync(request.ServicioId, cancellationToken);
        if (servicio == null)
        {
            throw new NotFoundException("Servicio", request.ServicioId);
        }

        servicio.Nombre = request.Nombre.Trim();
        servicio.Descripcion = request.Descripcion?.Trim();
        servicio.ParaQueSirve = request.ParaQueSirve?.Trim();
        servicio.ImagenUrl = request.ImagenUrl?.Trim();
        servicio.Precio = request.Precio;
        servicio.DuracionMin = request.DuracionMin;
        servicio.Activo = request.Activo;

        _unitOfWork.Servicios.Update(servicio);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ServicioDetalleDto
        {
            ServicioId = servicio.ServicioId,
            Nombre = servicio.Nombre,
            Descripcion = servicio.Descripcion,
            ParaQueSirve = servicio.ParaQueSirve,
            ImagenUrl = servicio.ImagenUrl,
            Precio = servicio.Precio,
            DuracionMin = servicio.DuracionMin,
            Activo = servicio.Activo
        };
    }
}
