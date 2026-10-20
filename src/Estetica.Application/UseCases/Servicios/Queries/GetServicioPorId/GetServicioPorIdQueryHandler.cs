using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Queries.GetServicioPorId;

public class GetServicioPorIdQueryHandler : IRequestHandler<GetServicioPorIdQuery, ServicioDetalleDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetServicioPorIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ServicioDetalleDto> Handle(GetServicioPorIdQuery request, CancellationToken cancellationToken)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(request.ServicioId, cancellationToken);
        if (servicio == null)
        {
            throw new NotFoundException("Servicio", request.ServicioId);
        }

        return new ServicioDetalleDto
        {
            ServicioId = servicio.ServicioId,
            Nombre = servicio.Nombre,
            Descripcion = servicio.Descripcion,
            Precio = servicio.Precio,
            DuracionMin = servicio.DuracionMin,
            Activo = servicio.Activo
        };
    }
}
