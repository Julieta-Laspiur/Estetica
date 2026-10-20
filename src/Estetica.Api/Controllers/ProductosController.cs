using Estetica.Application.UseCases.Productos.Commands.ActualizarStockProducto;
using Estetica.Application.UseCases.Productos.Commands.AjustarStockGerencial;
using Estetica.Application.UseCases.Productos.Commands.ConfigurarStockMinimo;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Application.UseCases.Productos.Queries.ListarProductosBajoStock;
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
    /// Listar productos que alcanzaron o están por debajo de su umbral de stock mínimo (Solo Administrador y Recepcionista).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpGet("bajo-stock")]
    public async Task<ActionResult<IReadOnlyList<StockAlertaDto>>> GetProductosBajoStock()
    {
        var productos = await _mediator.Send(new ListarProductosBajoStockQuery());
        return Ok(productos);
    }

    /// <summary>
    /// Descontar stock básico de un producto tras una venta (Solo Administrador y Recepcionista).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpPost("{id:int}/stock")]
    public async Task<ActionResult<StockAlertaDto>> ActualizarStock(int id, [FromBody] ActualizarStockRequest request)
    {
        var resultado = await _mediator.Send(new ActualizarStockProductoCommand(id, request.CantidadADescontar));
        return Ok(resultado);
    }

    /// <summary>
    /// HU-10: Registrar ingreso de mercadería, ajustes manuales, mermas o inventario físico total (Solo Administrador).
    /// Valida que el stock resultante no sea negativo y emite alertas automáticas ante bajo stock.
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPost("{id:int}/ajustar-stock")]
    public async Task<ActionResult<StockMovimientoResultadoDto>> AjustarStockGerencial(int id, [FromBody] AjustarStockGerencialRequest request)
    {
        var resultado = await _mediator.Send(new AjustarStockGerencialCommand(id, request.TipoAjuste, request.Cantidad, request.Motivo));
        return Ok(resultado);
    }

    /// <summary>
    /// HU-10: Configurar o actualizar el umbral de stock mínimo de un producto (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPut("{id:int}/stock-minimo")]
    public async Task<ActionResult<StockAlertaDto>> ConfigurarStockMinimo(int id, [FromBody] ConfigurarStockMinimoRequest request)
    {
        var resultado = await _mediator.Send(new ConfigurarStockMinimoCommand(id, request.NuevoStockMinimo));
        return Ok(resultado);
    }
}

public record ActualizarStockRequest(int CantidadADescontar);
public record AjustarStockGerencialRequest(TipoAjusteStock TipoAjuste, int Cantidad, string? Motivo = null);
public record ConfigurarStockMinimoRequest(int NuevoStockMinimo);
