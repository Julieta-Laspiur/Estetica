using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Queries.ListarServiciosActivos;

public class ListarServiciosActivosQueryHandler : IRequestHandler<ListarServiciosActivosQuery, IReadOnlyList<ServicioDetalleDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ListarServiciosActivosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ServicioDetalleDto>> Handle(ListarServiciosActivosQuery request, CancellationToken cancellationToken)
    {
        var servicios = await _unitOfWork.Servicios.GetActivosAsync(cancellationToken);

        return servicios.Select(s => new ServicioDetalleDto
        {
            ServicioId = s.ServicioId,
            Nombre = s.Nombre,
            Descripcion = s.Descripcion,
            Precio = s.Precio,
            DuracionMin = s.DuracionMin,
            Activo = s.Activo
        }).ToList();
    }
}
