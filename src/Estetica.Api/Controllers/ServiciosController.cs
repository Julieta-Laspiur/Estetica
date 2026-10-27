using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Application.UseCases.Productos.Queries.ListarServiciosActivos;
using Estetica.Application.UseCases.Servicios.Commands.ActualizarServicio;
using Estetica.Application.UseCases.Servicios.Commands.CambiarEstadoServicio;
using Estetica.Application.UseCases.Servicios.Commands.CrearServicio;
using Estetica.Application.UseCases.Servicios.Commands.EliminarServicio;
using Estetica.Application.UseCases.Servicios.DTOs;
using Estetica.Application.UseCases.Servicios.Queries.GetServicioPorId;
using Estetica.Application.UseCases.Servicios.Queries.ListarTodosServicios;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ServiciosController : ControllerBase
{
    private readonly IMediator _mediator;

    public ServiciosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// HU-15: Listar servicios estéticos activos disponibles para el catálogo y la reserva de turnos (Público).
    /// Los servicios deshabilitados quedan excluidos automáticamente.
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ServicioDetalleDto>>> GetServiciosActivos()
    {
        var servicios = await _mediator.Send(new ListarServiciosActivosQuery());
        return Ok(servicios);
    }

    /// <summary>
    /// HU-15: Listar todos los servicios del centro, incluyendo activos y deshabilitados (Solo Administrador y Recepcionista).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpGet("todos")]
    public async Task<ActionResult<IReadOnlyList<ServicioDetalleDto>>> GetTodosLosServicios()
    {
        var servicios = await _mediator.Send(new ListarTodosServiciosQuery());
        return Ok(servicios);
    }

    /// <summary>
    /// Consultar el detalle de un servicio estético por su ID (Público).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ServicioDetalleDto>> GetServicioPorId(int id)
    {
        var servicio = await _mediator.Send(new GetServicioPorIdQuery(id));
        return Ok(servicio);
    }

    /// <summary>
    /// HU-15: Dar de alta un nuevo tratamiento o servicio estético (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPost]
    public async Task<ActionResult<ServicioDetalleDto>> CrearServicio([FromBody] CrearServicioRequest request)
    {
        var command = new CrearServicioCommand(
            request.Nombre,
            request.Descripcion,
            request.Precio,
            request.DuracionMin,
            request.Activo,
            request.ParaQueSirve,
            request.ImagenUrl
        );
        var servicio = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetServicioPorId), new { id = servicio.ServicioId }, servicio);
    }

    /// <summary>
    /// HU-15: Modificar las propiedades, precios o duración de un servicio (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ServicioDetalleDto>> ActualizarServicio(int id, [FromBody] ActualizarServicioRequest request)
    {
        var command = new ActualizarServicioCommand(
            id,
            request.Nombre,
            request.Descripcion,
            request.Precio,
            request.DuracionMin,
            request.Activo,
            request.ParaQueSirve,
            request.ImagenUrl
        );
        var servicio = await _mediator.Send(command);
        return Ok(servicio);
    }

    /// <summary>
    /// HU-15: Deshabilitar o eliminar un servicio (Solo Administrador).
    /// Preserva la integridad histórica: Si el servicio tiene turnos históricos asociados, se desactiva lógicamente impidiendo el borrado físico.
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ServicioEliminadoResultadoDto>> EliminarServicio(int id)
    {
        var resultado = await _mediator.Send(new EliminarServicioCommand(id));
        return Ok(resultado);
    }

    /// <summary>
    /// HU-15: Habilitar o deshabilitar un servicio en el catálogo comercial (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPut("{id:int}/estado")]
    public async Task<ActionResult<ServicioDetalleDto>> CambiarEstadoServicio(int id, [FromBody] CambiarEstadoServicioRequest request)
    {
        var servicio = await _mediator.Send(new CambiarEstadoServicioCommand(id, request.Activo));
        return Ok(servicio);
    }

    /// <summary>
    /// Subir imagen para un servicio estético (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPost("upload-imagen")]
    public async Task<ActionResult> UploadImagen([FromForm] IFormFile? archivo)
    {
        if (archivo == null || archivo.Length == 0)
        {
            return BadRequest(new { message = "No se envió ningún archivo de imagen." });
        }

        var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (!extensionesPermitidas.Contains(extension))
        {
            return BadRequest(new { message = "Formato de imagen no permitido. Formatos aceptados: JPG, PNG, WebP, GIF." });
        }

        if (archivo.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "El tamaño de la imagen no puede superar los 5MB." });
        }

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "servicios");
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var nombreArchivoUnico = $"{Guid.NewGuid():N}{extension}";
        var rutaDestino = Path.Combine(uploadDir, nombreArchivoUnico);

        using (var stream = new FileStream(rutaDestino, FileMode.Create))
        {
            await archivo.CopyToAsync(stream);
        }

        var urlRelativa = $"/uploads/servicios/{nombreArchivoUnico}";
        return Ok(new { url = urlRelativa, message = "Imagen de servicio subida exitosamente." });
    }
}

public record CrearServicioRequest(string Nombre, string? Descripcion, decimal Precio, int DuracionMin, bool Activo = true, string? ParaQueSirve = null, string? ImagenUrl = null);
public record ActualizarServicioRequest(string Nombre, string? Descripcion, decimal Precio, int DuracionMin, bool Activo = true, string? ParaQueSirve = null, string? ImagenUrl = null);
public record CambiarEstadoServicioRequest(bool Activo);
