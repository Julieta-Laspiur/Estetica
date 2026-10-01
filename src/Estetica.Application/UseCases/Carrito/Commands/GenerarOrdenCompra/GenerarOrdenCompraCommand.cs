using Estetica.Application.UseCases.Carrito.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.GenerarOrdenCompra;

public record GenerarOrdenCompraCommand(
    int UsuarioId,
    string? CodigoCupon = null
) : IRequest<OrdenCompraDto>;
