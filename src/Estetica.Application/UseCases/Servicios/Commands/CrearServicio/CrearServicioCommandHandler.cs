using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Entities;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Commands.CrearServicio;

public class CrearServicioCommandHandler : IRequestHandler<CrearServicioCommand, ServicioDetalleDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public CrearServicioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ServicioDetalleDto> Handle(CrearServicioCommand request, CancellationToken cancellationToken)
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

        var servicio = new Servicio
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            ParaQueSirve = request.ParaQueSirve?.Trim(),
            ImagenUrl = request.ImagenUrl?.Trim(),
            Precio = request.Precio,
            DuracionMin = request.DuracionMin,
            Activo = request.Activo
        };

        await _unitOfWork.Servicios.AddAsync(servicio, cancellationToken);
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
