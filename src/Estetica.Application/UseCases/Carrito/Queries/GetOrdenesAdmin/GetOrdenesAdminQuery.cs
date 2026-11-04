using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Carrito.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Queries.GetOrdenesAdmin;

public record GetOrdenesAdminQuery : IRequest<IReadOnlyList<OrdenCompraDto>>;

public class GetOrdenesAdminQueryHandler : IRequestHandler<GetOrdenesAdminQuery, IReadOnlyList<OrdenCompraDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetOrdenesAdminQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<OrdenCompraDto>> Handle(GetOrdenesAdminQuery request, CancellationToken cancellationToken)
    {
        var ordenes = await _unitOfWork.OrdenesCompra.GetAllWithDetallesAsync(cancellationToken);
        return ordenes.Select(o => new OrdenCompraDto
        {
            OrdenId = o.OrdenId,
            UsuarioId = o.UsuarioId,
            ClienteNombre = o.Usuario != null ? $"{o.Usuario.Nombre} {o.Usuario.Apellido}".Trim() : null,
            ClienteEmail = o.Usuario?.Email,
            Fecha = o.Fecha,
            Total = o.Total,
            Estado = o.Estado,
            Detalles = o.Detalles.Select(d => new DetalleOrdenDto
            {
                DetalleId = d.DetalleId,
                ProductoId = d.ProductoId,
                NombreProducto = d.Producto?.Nombre ?? $"Producto #{d.ProductoId}",
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario
            }).ToList()
        }).ToList();
    }
}
