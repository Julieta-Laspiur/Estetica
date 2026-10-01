using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Carrito.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.AgregarItemCarrito;

public class AgregarItemCarritoCommandHandler : IRequestHandler<AgregarItemCarritoCommand, CarritoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public AgregarItemCarritoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CarritoDto> Handle(AgregarItemCarritoCommand request, CancellationToken cancellationToken)
    {
        if (request.Cantidad <= 0)
        {
            throw new BusinessRuleException("La cantidad debe ser mayor a cero.");
        }

        var producto = await _unitOfWork.Productos.GetByIdAsync(request.ProductoId, cancellationToken);
        if (producto == null || !producto.Activo)
        {
            throw new NotFoundException("Producto", request.ProductoId);
        }

        if (producto.StockActual < request.Cantidad)
        {
            throw new BusinessRuleException($"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.StockActual}.");
        }

        var carrito = await _unitOfWork.Carritos.GetCarritoActivoByUsuarioIdAsync(request.UsuarioId, cancellationToken);

        if (carrito == null)
        {
            carrito = new Estetica.Domain.Entities.Carrito
            {
                UsuarioId = request.UsuarioId,
                FechaCreacion = DateTime.UtcNow,
                Estado = EstadoCarrito.Activo
            };
            await _unitOfWork.Carritos.AddAsync(carrito, cancellationToken);
        }

        var existingItem = carrito.Items.FirstOrDefault(i => i.ProductoId == request.ProductoId);

        if (existingItem != null)
        {
            if (producto.StockActual < (existingItem.Cantidad + request.Cantidad))
            {
                throw new BusinessRuleException($"No se puede agregar más unidades. Stock disponible: {producto.StockActual}, en carrito: {existingItem.Cantidad}.");
            }
            existingItem.Cantidad += request.Cantidad;
            existingItem.PrecioUnitario = producto.Precio;
        }
        else
        {
            carrito.Items.Add(new ItemCarrito
            {
                Carrito = carrito,
                ProductoId = producto.ProductoId,
                Producto = producto,
                Cantidad = request.Cantidad,
                PrecioUnitario = producto.Precio
            });
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CarritoDto
        {
            CarritoId = carrito.CarritoId,
            UsuarioId = carrito.UsuarioId,
            Items = carrito.Items.Select(i => new ItemCarritoDto
            {
                ItemCarritoId = i.ItemCarritoId,
                ProductoId = i.ProductoId,
                NombreProducto = i.Producto?.Nombre ?? producto.Nombre,
                PrecioUnitario = i.PrecioUnitario,
                Cantidad = i.Cantidad
            }).ToList()
        };
    }
}
