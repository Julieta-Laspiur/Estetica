using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Carrito.DTOs;
using Estetica.Domain.Enums;
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
        return ordenes.Select(o =>
        {
            var ultimoPago = o.Pagos?.OrderByDescending(p => p.PagoId).FirstOrDefault();
            
            var estadoPago = ultimoPago?.Estado ?? (
                o.Estado == EstadoOrden.Pagada || o.Estado == EstadoOrden.EnPreparacion || o.Estado == EstadoOrden.Enviada || o.Estado == EstadoOrden.Entregada
                    ? EstadoPago.Aprobado
                    : (o.Estado == EstadoOrden.Cancelada ? EstadoPago.Rechazado : EstadoPago.Pendiente)
            );

            return new OrdenCompraDto
            {
                OrdenId = o.OrdenId,
                UsuarioId = o.UsuarioId,
                ClienteNombre = o.Usuario != null ? $"{o.Usuario.Nombre} {o.Usuario.Apellido}".Trim() : null,
                ClienteEmail = o.Usuario?.Email,
                ClienteTelefono = o.Usuario?.Telefono,
                Fecha = o.Fecha,
                Total = o.Total,
                Estado = o.Estado,
                MedioPago = ultimoPago != null ? ultimoPago.Proveedor.ToString() : "MercadoPago",
                EstadoPago = estadoPago,
                ReferenciaExterna = ultimoPago?.ReferenciaExterna ?? $"ORD-{o.OrdenId}",
                FechaPago = ultimoPago?.FechaPago ?? (o.Estado != EstadoOrden.Pendiente ? o.Fecha : null),
                Detalles = o.Detalles.Select(d => new DetalleOrdenDto
                {
                    DetalleId = d.DetalleId,
                    ProductoId = d.ProductoId,
                    NombreProducto = d.Producto?.Nombre ?? $"Producto #{d.ProductoId}",
                    ImagenUrl = d.Producto?.ImagenUrl,
                    Marca = d.Producto?.Marca,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario
                }).ToList()
            };
        }).ToList();
    }
}
