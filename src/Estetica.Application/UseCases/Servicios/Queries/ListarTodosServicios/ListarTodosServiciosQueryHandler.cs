using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Queries.ListarTodosServicios;

public class ListarTodosServiciosQueryHandler : IRequestHandler<ListarTodosServiciosQuery, IReadOnlyList<ServicioDetalleDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ListarTodosServiciosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ServicioDetalleDto>> Handle(ListarTodosServiciosQuery request, CancellationToken cancellationToken)
    {
        var servicios = await _unitOfWork.Servicios.GetAllAsync(cancellationToken);

        return servicios
            .OrderBy(s => s.Nombre)
            .Select(s => new ServicioDetalleDto
            {
                ServicioId = s.ServicioId,
                Nombre = s.Nombre,
                Descripcion = s.Descripcion,
                ParaQueSirve = s.ParaQueSirve,
                ImagenUrl = s.ImagenUrl,
                Precio = s.Precio,
                DuracionMin = s.DuracionMin,
                Activo = s.Activo
            })
            .ToList();
    }
}
