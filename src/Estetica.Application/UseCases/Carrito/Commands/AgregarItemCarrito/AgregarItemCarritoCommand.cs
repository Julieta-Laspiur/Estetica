using Estetica.Application.UseCases.Carrito.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.AgregarItemCarrito;

public record AgregarItemCarritoCommand(
    int UsuarioId,
    int ProductoId,
    int Cantidad
) : IRequest<CarritoDto>;
