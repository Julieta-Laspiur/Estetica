using Estetica.Application.UseCases.Carrito.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.QuitarItemCarrito;

public record QuitarItemCarritoCommand(
    int UsuarioId,
    int ProductoId,
    int? CantidadAQuitar = null
) : IRequest<CarritoDto>;
