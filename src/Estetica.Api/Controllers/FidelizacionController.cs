using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.AcumularEstampitas;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.CanjearCuponFidelizacion;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.EscanearQrFidelizacion;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.GenerarQrFidelizacion;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.RegistrarHistorialTratamiento;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using Estetica.Application.UseCases.FidelizacionHistorial.Queries.GetMiTarjetaFidelizacion;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class FidelizacionController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public FidelizacionController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Consultar la tarjeta virtual de fidelización del cliente autenticado (progreso de 1 a 10 estampitas y cupones ganados).
    /// </summary>
    [HttpGet("mi-tarjeta")]
    public async Task<ActionResult<TarjetaFidelizacionDto>> GetMiTarjeta()
    {
        var tarjeta = await _mediator.Send(new GetMiTarjetaFidelizacionQuery(_currentUserService.UsuarioId));
        return Ok(tarjeta);
    }

    /// <summary>
    /// Consultar la tarjeta virtual de un cliente específico por ID (Solo Administrador, Recepcionista y Profesional).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista,Profesional")]
    [HttpGet("usuario/{usuarioId:int}")]
    public async Task<ActionResult<TarjetaFidelizacionDto>> GetTarjetaPorUsuario(int usuarioId)
    {
        var tarjeta = await _mediator.Send(new GetMiTarjetaFidelizacionQuery(usuarioId));
        return Ok(tarjeta);
    }

    /// <summary>
    /// Generar el código QR dinámico de fidelización con vigencia estricta de 5 minutos asociado a un pago aprobado.
    /// Retorna tanto el SVG como el Data URI PNG para visualización inmediata en pantalla.
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista,Profesional")]
    [HttpPost("qr/{pagoId:int}")]
    public async Task<ActionResult<QrFidelizacionDto>> GenerarQrFidelizacion(int pagoId)
    {
        var qrDto = await _mediator.Send(new GenerarQrFidelizacionCommand(pagoId));
        return Ok(qrDto);
    }

    /// <summary>
    /// Escanear el código QR con la cámara para acreditar la estampita digital.
    /// Si alcanza 10 estampitas, la tarjeta se reinicia automáticamente y se emite un cupón de descuento activo.
    /// </summary>
    [HttpPost("escanear-qr")]
    public async Task<ActionResult<ResultadoEscaneoQrDto>> EscanearQr([FromBody] EscanearQrRequest request)
    {
        var resultado = await _mediator.Send(new EscanearQrFidelizacionCommand(request.Token, _currentUserService.UsuarioId));
        return Ok(resultado);
    }

    /// <summary>
    /// Acumular estampitas al cliente manualmente tras completar servicios (Solo Administrador, Recepcionista y Profesional).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista,Profesional")]
    [HttpPost("estampitas")]
    public async Task<ActionResult<FidelizacionDto>> AcumularEstampitas([FromBody] AcumularEstampitasCommand command)
    {
        var fidelizacion = await _mediator.Send(command);
        return Ok(fidelizacion);
    }

    /// <summary>
    /// Canjear estampitas acumuladas por un cupón promocional con descuento.
    /// </summary>
    [HttpPost("canjear")]
    public async Task<ActionResult<CuponCanjeadoDto>> CanjearCupon([FromBody] CanjearCuponFidelizacionCommand command)
    {
        var cupon = await _mediator.Send(command);
        return Ok(cupon);
    }

    /// <summary>
    /// Registrar observaciones clínicas posteriores a la atención de un turno (Solo Profesionales y Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador,Profesional")]
    [HttpPost("historial")]
    public async Task<ActionResult<HistorialTratamientoDto>> RegistrarHistorial([FromBody] RegistrarHistorialTratamientoCommand command)
    {
        var historial = await _mediator.Send(command);
        return CreatedAtAction(nameof(RegistrarHistorial), new { id = historial.HistorialId }, historial);
    }
}

public record EscanearQrRequest(string Token);
