using Estetica.Application.UseCases.FidelizacionHistorial.Commands.AcumularEstampitas;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.CanjearCuponFidelizacion;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.RegistrarHistorialTratamiento;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
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

    public FidelizacionController(IMediator mediator)
    {
        _mediator = mediator;
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

    /// <summary>
    /// Acumular estampitas al cliente tras completar servicios (Solo Administrador, Recepcionista y Profesional).
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
}
