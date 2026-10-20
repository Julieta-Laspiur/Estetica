using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Notificaciones.Commands.MarcarNotificacionLeida;
using Estetica.Application.UseCases.Notificaciones.Commands.MarcarTodasNotificacionesLeidas;
using Estetica.Application.UseCases.Notificaciones.DTOs;
using Estetica.Application.UseCases.Notificaciones.Queries.GetAlertasAdmin;
using Estetica.Application.UseCases.Notificaciones.Queries.GetMisNotificaciones;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class NotificacionesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public NotificacionesController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// HU-16: Monitor Centralizado de Eventos y Alertas para el Dashboard administrativo.
    /// Retorna alertas inmediatas de pagos acreditados, mermas/stock crítico y eventos operativos.
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpGet("admin")]
    public async Task<ActionResult<IReadOnlyList<NotificacionDto>>> GetAlertasAdmin(
        [FromQuery] bool soloNoLeidas = false,
        [FromQuery] int limite = 100)
    {
        var alertas = await _mediator.Send(new GetAlertasAdminQuery(soloNoLeidas, limite));
        return Ok(alertas);
    }

    /// <summary>
    /// HU-16: Marcar una alerta administrativa o notificación específica como Leída / Procesada.
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpPut("{id:int}/leida")]
    public async Task<IActionResult> MarcarComoLeida(int id)
    {
        await _mediator.Send(new MarcarNotificacionLeidaCommand(id));
        return Ok(new { Mensaje = $"La notificación #{id} ha sido marcada como leída / procesada correctamente." });
    }

    /// <summary>
    /// HU-16: Marcar todas las alertas pendientes del monitor administrativo como leídas / procesadas.
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpPut("admin/marcar-todas-leidas")]
    public async Task<IActionResult> MarcarTodasAlertasAdminLeidas()
    {
        await _mediator.Send(new MarcarTodasNotificacionesLeidasCommand(EsAdmin: true));
        return Ok(new { Mensaje = "Todas las alertas administrativas han sido marcadas como leídas." });
    }

    /// <summary>
    /// Listar las notificaciones personales del usuario autenticado (Cliente o Profesional).
    /// </summary>
    [HttpGet("mis-notificaciones")]
    public async Task<ActionResult<IReadOnlyList<NotificacionDto>>> GetMisNotificaciones([FromQuery] bool soloNoLeidas = false)
    {
        if (!_currentUserService.UsuarioId.HasValue)
        {
            return Unauthorized();
        }

        var notificaciones = await _mediator.Send(new GetMisNotificacionesQuery(_currentUserService.UsuarioId.Value, soloNoLeidas));
        return Ok(notificaciones);
    }

    /// <summary>
    /// Marcar todas las notificaciones personales del usuario autenticado como leídas.
    /// </summary>
    [HttpPut("mis-notificaciones/marcar-todas-leidas")]
    public async Task<IActionResult> MarcarMisNotificacionesLeidas()
    {
        if (!_currentUserService.UsuarioId.HasValue)
        {
            return Unauthorized();
        }

        await _mediator.Send(new MarcarTodasNotificacionesLeidasCommand(UsuarioId: _currentUserService.UsuarioId.Value));
        return Ok(new { Mensaje = "Todas tus notificaciones han sido marcadas como leídas." });
    }
}
