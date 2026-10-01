using Estetica.Application.UseCases.Carrito.Commands.AgregarItemCarrito;
using Estetica.Application.UseCases.Carrito.Commands.AplicarCuponDescuento;
using Estetica.Application.UseCases.Carrito.Commands.GenerarOrdenCompra;
using Estetica.Application.UseCases.Carrito.Commands.QuitarItemCarrito;
using Estetica.Application.UseCases.Carrito.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class CarritoController : ControllerBase
{
    private readonly IMediator _mediator;

    public CarritoController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Agregar un producto al carrito de compras del usuario autenticado.
    /// </summary>
    [HttpPost("items")]
    public async Task<ActionResult<CarritoDto>> AgregarItem([FromBody] AgregarItemCarritoCommand command)
    {
        var carrito = await _mediator.Send(command);
        return Ok(carrito);
    }

    /// <summary>
    /// Quitar un producto o restar unidades del carrito de compras.
    /// </summary>
    [HttpDelete("items")]
    public async Task<ActionResult<CarritoDto>> QuitarItem([FromBody] QuitarItemCarritoCommand command)
    {
        var carrito = await _mediator.Send(command);
        return Ok(carrito);
    }

    /// <summary>
    /// Convertir el carrito de compras en una Orden de Compra y descontar el stock.
    /// </summary>
    [HttpPost("orden")]
    public async Task<ActionResult<OrdenCompraDto>> GenerarOrdenCompra([FromBody] GenerarOrdenCompraCommand command)
    {
        var orden = await _mediator.Send(command);
        return CreatedAtAction(nameof(GenerarOrdenCompra), new { id = orden.OrdenId }, orden);
    }

    /// <summary>
    /// Validar y aplicar un cupón de descuento promocional sobre un monto total.
    /// </summary>
    [HttpPost("cupon")]
    public async Task<ActionResult<CuponDescuentoDto>> AplicarCupon([FromBody] AplicarCuponDescuentoCommand command)
    {
        var resultado = await _mediator.Send(command);
        return Ok(resultado);
    }
}
