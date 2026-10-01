using Estetica.Application.UseCases.Productos.Commands.ActualizarStockProducto;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Application.UseCases.Productos.Queries.ListarProductosPorTipoPiel;
using Estetica.Application.UseCases.Productos.Queries.ListarServiciosActivos;
using Estetica.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ProductosController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Listar los tratamientos y servicios estéticos activos (Público).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("servicios")]
    public async Task<ActionResult<IReadOnlyList<ServicioDetalleDto>>> GetServiciosActivos()
    {
        var servicios = await _mediator.Send(new ListarServiciosActivosQuery());
        return Ok(servicios);
    }

    /// <summary>
    /// Listar productos del catálogo de e-commerce, opcionalmente filtrados por biotipo cutáneo (Público).
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductoDto>>> GetProductos([FromQuery] TipoPielEnum? tipoPiel = null)
    {
        var productos = await _mediator.Send(new ListarProductosPorTipoPielQuery(tipoPiel));
        return Ok(productos);
    }

    /// <summary>
    /// Descontar o ajustar stock de un producto (Solo Administrador y Recepcionista).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpPost("{id:int}/stock")]
    public async Task<ActionResult<StockAlertaDto>> ActualizarStock(int id, [FromBody] ActualizarStockRequest request)
    {
        var resultado = await _mediator.Send(new ActualizarStockProductoCommand(id, request.CantidadADescontar));
        return Ok(resultado);
    }
}

public record ActualizarStockRequest(int CantidadADescontar);
