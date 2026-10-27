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

    /// <summary>
    /// Listar todos los productos del catálogo (activos e inactivos) (Solo Administrador y Recepcionista).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpGet("todos")]
    public async Task<ActionResult<IReadOnlyList<ProductoDto>>> GetTodosProductos()
    {
        var productos = await _mediator.Send(new Application.UseCases.Productos.Queries.ListarTodosProductos.ListarTodosProductosQuery());
        return Ok(productos);
    }

    /// <summary>
    /// Registrar un nuevo producto en el catálogo (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPost]
    public async Task<ActionResult<ProductoDto>> CrearProducto([FromBody] Application.UseCases.Productos.Commands.CrearProducto.CrearProductoCommand command)
    {
        var producto = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetProductos), new { id = producto.ProductoId }, producto);
    }

    /// <summary>
    /// Editar por completo un producto del catálogo (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductoDto>> ActualizarProducto(int id, [FromBody] ActualizarProductoRequest request)
    {
        var command = new Application.UseCases.Productos.Commands.ActualizarProducto.ActualizarProductoCommand(
            id,
            request.Nombre,
            request.Marca,
            request.Descripcion,
            request.ParaQueSirve,
            request.ImagenUrl,
            request.Precio,
            request.StockActual,
            request.StockMinimo,
            request.Activo,
            request.TiposPiel
        );
        var producto = await _mediator.Send(command);
        return Ok(producto);
    }

    /// <summary>
    /// Eliminar o desactivar lógicamente un producto del catálogo (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<Application.UseCases.Productos.Commands.EliminarProducto.EliminarProductoResultDto>> EliminarProducto(int id)
    {
        var resultado = await _mediator.Send(new Application.UseCases.Productos.Commands.EliminarProducto.EliminarProductoCommand(id));
        return Ok(resultado);
    }

    /// <summary>
    /// Subir imagen para un producto al servidor (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPost("upload-imagen")]
    public async Task<ActionResult> UploadImagen(IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
        {
            return BadRequest(new { message = "No se ha proporcionado ningún archivo de imagen." });
        }

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        if (!extensionesPermitidas.Contains(extension))
        {
            return BadRequest(new { message = "Formato de imagen no permitido. Utilice JPG, PNG o WEBP." });
        }

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "productos");
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var nombreUnico = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadDir, nombreUnico);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await archivo.CopyToAsync(stream);
        }

        var urlRelativa = $"/uploads/productos/{nombreUnico}";
        return Ok(new { url = urlRelativa, message = "Imagen subida exitosamente." });
    }
}

public record ActualizarStockRequest(int CantidadADescontar);
public record AjustarStockGerencialRequest(TipoAjusteStock TipoAjuste, int Cantidad, string? Motivo = null);
public record ConfigurarStockMinimoRequest(int NuevoStockMinimo);
public record ActualizarProductoRequest(
    string Nombre,
    string Marca,
    string? Descripcion,
    string? ParaQueSirve,
    string? ImagenUrl,
    decimal Precio,
    int StockActual,
    int StockMinimo,
    bool Activo,
    List<string>? TiposPiel = null
);
