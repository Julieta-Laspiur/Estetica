using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Carrito.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.QuitarItemCarrito;

public class QuitarItemCarritoCommandHandler : IRequestHandler<QuitarItemCarritoCommand, CarritoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public QuitarItemCarritoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CarritoDto> Handle(QuitarItemCarritoCommand request, CancellationToken cancellationToken)
    {
        var carrito = await _unitOfWork.Carritos.GetCarritoActivoByUsuarioIdAsync(request.UsuarioId, cancellationToken);
        if (carrito == null)
        {
            throw new NotFoundException("Carrito activo", request.UsuarioId);
        }

        var item = carrito.Items.FirstOrDefault(i => i.ProductoId == request.ProductoId);
        if (item == null)
        {
            throw new NotFoundException("ItemCarrito con ProductoId", request.ProductoId);
        }

        if (!request.CantidadAQuitar.HasValue || item.Cantidad <= request.CantidadAQuitar.Value)
        {
            carrito.Items.Remove(item);
        }
        else
        {
            item.Cantidad -= request.CantidadAQuitar.Value;
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
                NombreProducto = i.Producto?.Nombre ?? string.Empty,
                PrecioUnitario = i.PrecioUnitario,
                Cantidad = i.Cantidad
            }).ToList()
        };
    }
}
