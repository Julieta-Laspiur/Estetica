using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Carrito.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.GenerarOrdenCompra;

public class GenerarOrdenCompraCommandHandler : IRequestHandler<GenerarOrdenCompraCommand, OrdenCompraDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GenerarOrdenCompraCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<OrdenCompraDto> Handle(GenerarOrdenCompraCommand request, CancellationToken cancellationToken)
    {
        var carrito = await _unitOfWork.Carritos.GetCarritoActivoByUsuarioIdAsync(request.UsuarioId, cancellationToken);
        if (carrito == null || !carrito.Items.Any())
        {
            throw new BusinessRuleException("El carrito se encuentra vacío.");
        }

        var totalBruto = 0m;

        // Validar stock de todos los productos
        foreach (var item in carrito.Items)
        {
            var producto = await _unitOfWork.Productos.GetByIdAsync(item.ProductoId, cancellationToken);
            if (producto == null || !producto.Activo)
            {
                throw new BusinessRuleException($"El producto '{item.Producto?.Nombre ?? item.ProductoId.ToString()}' ya no está disponible.");
            }

            if (producto.StockActual < item.Cantidad)
            {
                throw new BusinessRuleException($"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.StockActual}, requerido: {item.Cantidad}.");
            }

            totalBruto += item.Cantidad * item.PrecioUnitario;
        }

        // Aplicar cupón de descuento si fue suministrado
        var descuentoMonto = 0m;
        Cupon? cupon = null;
        if (!string.IsNullOrWhiteSpace(request.CodigoCupon))
        {
            cupon = await _unitOfWork.Cupones.GetByCodigoValidoAsync(request.CodigoCupon, request.UsuarioId, cancellationToken);
            if (cupon != null)
            {
                descuentoMonto = cupon.Descuento;
                cupon.Estado = EstadoCupon.Usado;
                _unitOfWork.Cupones.Update(cupon);
            }
        }

        var totalNeto = Math.Max(0, totalBruto - descuentoMonto);

        var orden = new OrdenCompra
        {
            UsuarioId = request.UsuarioId,
            Fecha = DateTime.UtcNow,
            Total = totalNeto,
            Estado = EstadoOrden.Pendiente
        };

        foreach (var item in carrito.Items)
        {
            orden.Detalles.Add(new DetalleOrden
            {
                OrdenCompra = orden,
                ProductoId = item.ProductoId,
                Cantidad = item.Cantidad,
                PrecioUnitario = item.PrecioUnitario
            });

            // Descontar stock
            var prod = await _unitOfWork.Productos.GetByIdAsync(item.ProductoId, cancellationToken);
            if (prod != null)
            {
                prod.StockActual -= item.Cantidad;
                _unitOfWork.Productos.Update(prod);
            }
        }

        await _unitOfWork.OrdenesCompra.AddAsync(orden, cancellationToken);

        // Marcar carrito como procesado
        carrito.Estado = EstadoCarrito.Procesado;
        _unitOfWork.Carritos.Update(carrito);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new OrdenCompraDto
        {
            OrdenId = orden.OrdenId,
            UsuarioId = orden.UsuarioId,
            Fecha = orden.Fecha,
            Total = orden.Total,
            Estado = orden.Estado,
            Detalles = orden.Detalles.Select(d => new DetalleOrdenDto
            {
                DetalleId = d.DetalleId,
                ProductoId = d.ProductoId,
                NombreProducto = d.Producto?.Nombre ?? string.Empty,
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario
            }).ToList()
        };
    }
}
