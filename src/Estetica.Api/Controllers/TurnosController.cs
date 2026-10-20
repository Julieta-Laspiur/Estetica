using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.Commands.AgendarTurno;
using Estetica.Application.UseCases.Turnos.Commands.BloquearHorarioAgenda;
using Estetica.Application.UseCases.Turnos.Commands.CambiarEstadoTurno;
using Estetica.Application.UseCases.Turnos.Commands.CancelarTurno;
using Estetica.Application.UseCases.Turnos.Commands.ConfirmarTurno;
using Estetica.Application.UseCases.Turnos.Commands.ExpirarTurnosPendientes;
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
    private readonly ICurrentUserService _currentUserService;

    public TurnosController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
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
    /// Cancelar un turno programado. Clientes requieren al menos 24 hs de anticipación (HU-04). Personal administrativo requiere justificación (HU-05).
    /// </summary>
    [HttpPut("{id:int}/cancelar")]
    public async Task<IActionResult> CancelarTurno(int id, [FromBody] CancelarTurnoRequest? request = null)
    {
        await _mediator.Send(new CancelarTurnoCommand(id, _currentUserService.UsuarioId, request?.Motivo));
        return Ok(new { message = $"Turno #{id} cancelado exitosamente." });
    }

    /// <summary>
    /// Reprogramar fecha, hora, cabina o profesional de un turno. Clientes requieren al menos 24 hs de anticipación (HU-04). Personal requiere justificación (HU-05).
    /// </summary>
    [HttpPut("{id:int}/reprogramar")]
    public async Task<ActionResult<TurnoDto>> ReprogramarTurno(int id, [FromBody] ReprogramarTurnoRequest request)
    {
        var command = new ReprogramarTurnoCommand(
            id,
            request.NuevaFechaHoraInicio,
            request.NuevaCabinaId,
            request.NuevoProfesionalId,
            request.Motivo,
            _currentUserService.UsuarioId);

        var turno = await _mediator.Send(command);
        return Ok(turno);
    }

    /// <summary>
    /// Bloquear horario en la agenda por mantenimiento de cabina, vacaciones o licencias de profesionales (HU-05) (Solo Administrador y Recepcionista).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpPost("bloquear")]
    public async Task<ActionResult<TurnoDto>> BloquearHorario([FromBody] BloquearHorarioAgendaCommand command)
    {
        var turnoBloqueado = await _mediator.Send(command);
        return Ok(turnoBloqueado);
    }

    /// <summary>
    /// Forzar la expiración de turnos pendientes que superaron los 10 minutos sin confirmación de pago (HU-03).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpPost("expirar-pendientes")]
    public async Task<ActionResult<int>> ExpirarPendientes()
    {
        var liberados = await _mediator.Send(new ExpirarTurnosPendientesCommand());
        return Ok(new { turnosLiberados = liberados, message = $"Se liberaron {liberados} turno(s) pendientes expirados." });
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

public record CancelarTurnoRequest(string? Motivo = null);

public record ReprogramarTurnoRequest(
    DateTime NuevaFechaHoraInicio,
    int? NuevaCabinaId = null,
    int? NuevoProfesionalId = null,
    string? Motivo = null
);
