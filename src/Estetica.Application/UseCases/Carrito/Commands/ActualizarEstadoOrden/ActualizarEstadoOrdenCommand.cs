using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Carrito.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.ActualizarEstadoOrden;

public record ActualizarEstadoOrdenCommand(int OrdenId, EstadoOrden NuevoEstado) : IRequest<OrdenCompraDto>;

public class ActualizarEstadoOrdenCommandHandler : IRequestHandler<ActualizarEstadoOrdenCommand, OrdenCompraDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public ActualizarEstadoOrdenCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<OrdenCompraDto> Handle(ActualizarEstadoOrdenCommand request, CancellationToken cancellationToken)
    {
        var orden = await _unitOfWork.OrdenesCompra.GetWithDetallesAsync(request.OrdenId, cancellationToken);
        if (orden == null)
        {
            throw new NotFoundException($"La orden de compra #{request.OrdenId} no fue encontrada.");
        }

        var estadoAnterior = orden.Estado;
        orden.Estado = request.NuevoEstado;

        // Si se marca como pagada manualmente o presencialmente, confirmar pagos asociados
        if (request.NuevoEstado == EstadoOrden.Pagada || request.NuevoEstado == EstadoOrden.EnPreparacion || request.NuevoEstado == EstadoOrden.Enviada || request.NuevoEstado == EstadoOrden.Entregada)
        {
            var pagoPendiente = orden.Pagos?.FirstOrDefault(p => p.Estado == EstadoPago.Pendiente);
            if (pagoPendiente != null)
            {
                pagoPendiente.Estado = EstadoPago.Aprobado;
                pagoPendiente.FechaPago = DateTime.UtcNow;
            }
        }

        // Si se cancela una orden que estaba activa, reponer el stock al catálogo
        if (request.NuevoEstado == EstadoOrden.Cancelada && estadoAnterior != EstadoOrden.Cancelada && estadoAnterior != EstadoOrden.Devuelta)
        {
            foreach (var detalle in orden.Detalles)
            {
                var producto = await _unitOfWork.Productos.GetByIdAsync(detalle.ProductoId, cancellationToken);
                if (producto != null)
                {
                    producto.StockActual += detalle.Cantidad;
                }
            }
        }

        // Registrar notificación administrativa para trazabilidad
        if (orden.UsuarioId > 0)
        {
            await _unitOfWork.Notificaciones.AddAsync(new Notificacion
            {
                UsuarioId = orden.UsuarioId,
                Tipo = TipoNotificacion.ActualizacionOrden,
                Mensaje = $"Tu pedido #{orden.OrdenId} ha cambiado de estado a '{request.NuevoEstado}'.",
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
