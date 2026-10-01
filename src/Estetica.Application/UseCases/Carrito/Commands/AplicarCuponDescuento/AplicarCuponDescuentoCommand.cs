using Estetica.Application.UseCases.Carrito.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Carrito.Commands.AplicarCuponDescuento;

public record AplicarCuponDescuentoCommand(
    int UsuarioId,
    string CodigoCupon,
    decimal TotalOriginal
) : IRequest<CuponDescuentoDto>;
