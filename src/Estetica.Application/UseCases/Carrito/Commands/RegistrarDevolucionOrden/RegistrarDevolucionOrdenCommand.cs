using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Carrito.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.RegistrarDevolucionOrden;

public record RegistrarDevolucionOrdenCommand(int OrdenId, string Motivo, bool ReintegrarStock = true) : IRequest<OrdenCompraDto>;

public class RegistrarDevolucionOrdenCommandHandler : IRequestHandler<RegistrarDevolucionOrdenCommand, OrdenCompraDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public RegistrarDevolucionOrdenCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<OrdenCompraDto> Handle(RegistrarDevolucionOrdenCommand request, CancellationToken cancellationToken)
    {
        var orden = await _unitOfWork.OrdenesCompra.GetWithDetallesAsync(request.OrdenId, cancellationToken);
        if (orden == null)
        {
            throw new NotFoundException($"La orden de compra #{request.OrdenId} no fue encontrada.");
        }

        orden.Estado = EstadoOrden.Devuelta;

        int unidadesReintegradas = 0;
        if (request.ReintegrarStock)
        {
            foreach (var detalle in orden.Detalles)
            {
                var producto = await _unitOfWork.Productos.GetByIdAsync(detalle.ProductoId, cancellationToken);
                if (producto != null)
                {
                    producto.StockActual += detalle.Cantidad;
                    unidadesReintegradas += detalle.Cantidad;
                }
            }
        }

        // Notificación para el cliente y sistema
        if (orden.UsuarioId > 0)
        {
            await _unitOfWork.Notificaciones.AddAsync(new Notificacion
            {
                UsuarioId = orden.UsuarioId,
                Tipo = TipoNotificacion.ActualizacionOrden,
                Mensaje = $"Se ha procesado la devolución de tu pedido #{orden.OrdenId}. Motivo: {request.Motivo}.",
                Leida = false,
                Fecha = DateTime.UtcNow
            }, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var ultimoPago = orden.Pagos?.OrderByDescending(p => p.PagoId).FirstOrDefault();
        return new OrdenCompraDto
        {
            OrdenId = orden.OrdenId,
            UsuarioId = orden.UsuarioId,
            ClienteNombre = orden.Usuario != null ? $"{orden.Usuario.Nombre} {orden.Usuario.Apellido}".Trim() : null,
            ClienteEmail = orden.Usuario?.Email,
            ClienteTelefono = orden.Usuario?.Telefono,
            Fecha = orden.Fecha,
            Total = orden.Total,
            Estado = orden.Estado,
            MedioPago = ultimoPago != null ? ultimoPago.Proveedor.ToString() : "MercadoPago",
            EstadoPago = ultimoPago?.Estado ?? EstadoPago.Aprobado,
            ReferenciaExterna = ultimoPago?.ReferenciaExterna ?? $"ORD-{orden.OrdenId}",
            FechaPago = ultimoPago?.FechaPago ?? orden.Fecha,
            MotivoDevolucion = request.Motivo,
            Detalles = orden.Detalles.Select(d => new DetalleOrdenDto
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
    }
}
