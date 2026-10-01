using Estetica.Application.UseCases.DiagnosticoIA.Commands.ConsultarAsistenteIA;
using Estetica.Application.UseCases.DiagnosticoIA.Commands.RegistrarDiagnosticoPiel;
using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using Estetica.Application.UseCases.DiagnosticoIA.Queries.GenerarRecomendacionPersonalizada;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class DiagnosticoIAController : ControllerBase
{
    private readonly IMediator _mediator;

    public DiagnosticoIAController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Registrar el resultado del análisis de piel del cliente.
    /// </summary>
    [HttpPost("diagnostico")]
    public async Task<ActionResult<DiagnosticoPielDto>> RegistrarDiagnostico([FromBody] RegistrarDiagnosticoPielCommand command)
    {
        var diagnostico = await _mediator.Send(command);
        return CreatedAtAction(nameof(RegistrarDiagnostico), new { id = diagnostico.DiagnosticoId }, diagnostico);
    }

    /// <summary>
    /// Enviar una consulta al asistente virtual de estética con el contexto clínico del usuario.
    /// </summary>
    [HttpPost("consultar-asistente")]
    public async Task<ActionResult<ConversacionIADto>> ConsultarAsistente([FromBody] ConsultarAsistenteIACommand command)
    {
        var conversacion = await _mediator.Send(command);
        return Ok(conversacion);
    }

    /// <summary>
    /// Generar recomendación personalizada de productos basada en el biotipo cutáneo del cliente.
    /// </summary>
    [HttpGet("recomendacion/{usuarioId:int}")]
    public async Task<ActionResult<RecomendacionPersonalizadaDto>> GenerarRecomendacion(int usuarioId)
    {
        var recomendacion = await _mediator.Send(new GenerarRecomendacionPersonalizadaQuery(usuarioId));
        return Ok(recomendacion);
    }
}
