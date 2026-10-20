using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.DiagnosticoIA.Commands.ConsultarAsistenteIA;
using Estetica.Application.UseCases.DiagnosticoIA.Commands.RegistrarDiagnosticoPiel;
using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using Estetica.Application.UseCases.DiagnosticoIA.Queries.GenerarRecomendacionPersonalizada;
using Estetica.Application.UseCases.DiagnosticoIA.Queries.GetHistorialConversaciones;
using Estetica.Domain.Enums;
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
    private readonly ICurrentUserService _currentUserService;

    public DiagnosticoIAController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Registrar el resultado del análisis dermatológico y alérgenos de un cliente.
    /// </summary>
    [HttpPost("diagnostico")]
    public async Task<ActionResult<DiagnosticoPielDto>> RegistrarDiagnostico([FromBody] RegistrarDiagnosticoRequest request)
    {
        int usuarioId = request.UsuarioId.HasValue && (_currentUserService.EstaEnRol("Administrador") || _currentUserService.EstaEnRol("Recepcionista") || _currentUserService.EstaEnRol("Profesional"))
            ? request.UsuarioId.Value
            : _currentUserService.UsuarioId ?? throw new UnauthorizedAccessException("Usuario no autenticado.");

        var command = new RegistrarDiagnosticoPielCommand(usuarioId, request.TipoPiel, request.Resultado, request.Alergias);
        var diagnostico = await _mediator.Send(command);
        return CreatedAtAction(nameof(RegistrarDiagnostico), new { id = diagnostico.DiagnosticoId }, diagnostico);
    }

    /// <summary>
    /// HU-12: Enviar una consulta al Chatbot Inteligente 24/7 (Arquitectura RAG).
    /// El asistente evalúa el tipo de piel, catálogo de tratamientos, stock real disponible y guardrails médicos.
    /// </summary>
    [HttpPost("consultar-asistente")]
    public async Task<ActionResult<ConversacionIADto>> ConsultarAsistente([FromBody] ConsultarAsistenteRequest request)
    {
        int usuarioId = request.UsuarioId.HasValue && (_currentUserService.EstaEnRol("Administrador") || _currentUserService.EstaEnRol("Recepcionista") || _currentUserService.EstaEnRol("Profesional"))
            ? request.UsuarioId.Value
            : _currentUserService.UsuarioId ?? throw new UnauthorizedAccessException("Usuario no autenticado.");

        var command = new ConsultarAsistenteIACommand(usuarioId, request.Pregunta);
        var conversacion = await _mediator.Send(command);
        return Ok(conversacion);
    }

    /// <summary>
    /// HU-12: Consultar el historial de preguntas y respuestas del asistente conversacional del cliente autenticado.
    /// </summary>
    [HttpGet("conversaciones")]
    public async Task<ActionResult<IReadOnlyList<ConversacionIADto>>> GetHistorialConversaciones([FromQuery] int limite = 50)
    {
        if (!_currentUserService.UsuarioId.HasValue)
        {
            return Unauthorized();
        }

        var historial = await _mediator.Send(new GetHistorialConversacionesQuery(_currentUserService.UsuarioId.Value, limite));
        return Ok(historial);
    }

    /// <summary>
    /// HU-11: Obtener sugerencias automáticas de productos según biotipo cutáneo, alergias e historial de compras del usuario autenticado.
    /// </summary>
    [HttpGet("recomendacion")]
    public async Task<ActionResult<RecomendacionPersonalizadaDto>> GenerarMiRecomendacion()
    {
        if (!_currentUserService.UsuarioId.HasValue)
        {
            return Unauthorized();
        }

        var recomendacion = await _mediator.Send(new GenerarRecomendacionPersonalizadaQuery(_currentUserService.UsuarioId.Value));
        return Ok(recomendacion);
    }

    /// <summary>
    /// HU-11: Obtener recomendación personalizada de un cliente específico por ID (Solo Administrador, Recepcionista y Profesional).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista,Profesional")]
    [HttpGet("recomendacion/{usuarioId:int}")]
    public async Task<ActionResult<RecomendacionPersonalizadaDto>> GenerarRecomendacionPorUsuario(int usuarioId)
    {
        var recomendacion = await _mediator.Send(new GenerarRecomendacionPersonalizadaQuery(usuarioId));
        return Ok(recomendacion);
    }
}

public record RegistrarDiagnosticoRequest(TipoPielEnum TipoPiel, string Resultado, string? Alergias = null, int? UsuarioId = null);
public record ConsultarAsistenteRequest(string Pregunta, int? UsuarioId = null);
