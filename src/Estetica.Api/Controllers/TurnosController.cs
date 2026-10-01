using Estetica.Application.UseCases.Turnos.Commands.AgendarTurno;
using Estetica.Application.UseCases.Turnos.Commands.CambiarEstadoTurno;
using Estetica.Application.UseCases.Turnos.Commands.CancelarTurno;
using Estetica.Application.UseCases.Turnos.Commands.ConfirmarTurno;
using Estetica.Application.UseCases.Turnos.Commands.ReprogramarTurno;
using Estetica.Application.UseCases.Turnos.DTOs;
using Estetica.Application.UseCases.Turnos.Queries.GetDisponibilidad;
using Estetica.Application.UseCases.Turnos.Queries.GetTurnoById;
using Estetica.Application.UseCases.Turnos.Queries.GetTurnosPorProfesional;
using Estetica.Application.UseCases.Turnos.Queries.GetTurnosPorUsuario;
using Estetica.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class TurnosController : ControllerBase
{
    private readonly IMediator _mediator;

    public TurnosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Consultar disponibilidad horaria de cabina y profesional (Acceso público).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("disponibilidad")]
    public async Task<ActionResult<DisponibilidadDto>> ConsultarDisponibilidad(
        [FromQuery] int profesionalId,
        [FromQuery] int cabinaId,
        [FromQuery] DateTime fechaHoraInicio,
        [FromQuery] int duracionMin)
    {
        var response = await _mediator.Send(new GetDisponibilidadQuery(profesionalId, cabinaId, fechaHoraInicio, duracionMin));
        return Ok(response);
    }

    /// <summary>
    /// Reservar un nuevo turno asociando cliente, profesional, cabina y servicios.
    /// </summary>
    [HttpPost("reservar")]
    public async Task<ActionResult<TurnoDto>> ReservarTurno([FromBody] AgendarTurnoCommand command)
    {
        var turno = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetTurnoById), new { id = turno.TurnoId }, turno);
    }

    /// <summary>
    /// Confirmar un turno reservado (Solo personal: Administrador, Recepcionista o Profesional).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista,Profesional")]
    [HttpPut("{id:int}/confirmar")]
    public async Task<IActionResult> ConfirmarTurno(int id)
    {
        await _mediator.Send(new ConfirmarTurnoCommand(id));
        return Ok(new { message = $"Turno #{id} confirmado exitosamente." });
    }

    /// <summary>
    /// Cancelar un turno programado indicando el motivo opcional.
    /// </summary>
    [HttpPut("{id:int}/cancelar")]
    public async Task<IActionResult> CancelarTurno(int id, [FromQuery] int solicitanteUsuarioId, [FromBody] string? motivo = null)
    {
        await _mediator.Send(new CancelarTurnoCommand(id, solicitanteUsuarioId, motivo));
        return Ok(new { message = $"Turno #{id} cancelado exitosamente." });
    }

    /// <summary>
    /// Reprogramar fecha, hora, cabina o profesional de un turno existente.
    /// </summary>
    [HttpPut("{id:int}/reprogramar")]
    public async Task<ActionResult<TurnoDto>> ReprogramarTurno(int id, [FromBody] ReprogramarTurnoRequest request)
    {
        var command = new ReprogramarTurnoCommand(id, request.NuevaFechaHoraInicio, request.NuevaCabinaId, request.NuevoProfesionalId);
        var turno = await _mediator.Send(command);
        return Ok(turno);
    }

    /// <summary>
    /// Obtener detalle completo de un turno por su identificador.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TurnoDto>> GetTurnoById(int id)
    {
        var turno = await _mediator.Send(new GetTurnoByIdQuery(id));
        return Ok(turno);
    }

    /// <summary>
    /// Listar los turnos de un cliente.
    /// </summary>
    [HttpGet("usuario/{usuarioId:int}")]
    public async Task<ActionResult<IReadOnlyList<TurnoDto>>> GetTurnosPorUsuario(int usuarioId)
    {
        var turnos = await _mediator.Send(new GetTurnosPorUsuarioQuery(usuarioId));
        return Ok(turnos);
    }

    /// <summary>
    /// Listar los turnos asignados a un profesional (Solo Administrador, Recepcionista o Profesional).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista,Profesional")]
    [HttpGet("profesional/{profesionalId:int}")]
    public async Task<ActionResult<IReadOnlyList<TurnoDto>>> GetTurnosPorProfesional(int profesionalId, [FromQuery] DateTime? fecha = null)
    {
        var turnos = await _mediator.Send(new GetTurnosPorProfesionalQuery(profesionalId, fecha));
        return Ok(turnos);
    }
}

public record ReprogramarTurnoRequest(
    DateTime NuevaFechaHoraInicio,
    int? NuevaCabinaId = null,
    int? NuevoProfesionalId = null
);
