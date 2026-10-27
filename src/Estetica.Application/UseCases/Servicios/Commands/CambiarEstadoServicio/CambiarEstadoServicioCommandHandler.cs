using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Commands.CambiarEstadoServicio;

public class CambiarEstadoServicioCommandHandler : IRequestHandler<CambiarEstadoServicioCommand, ServicioDetalleDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public CambiarEstadoServicioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ServicioDetalleDto> Handle(CambiarEstadoServicioCommand request, CancellationToken cancellationToken)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(request.ServicioId, cancellationToken);
        if (servicio == null)
        {
            throw new NotFoundException("Servicio", request.ServicioId);
        }

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
