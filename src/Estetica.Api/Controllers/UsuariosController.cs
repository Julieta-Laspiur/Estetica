using Estetica.Application.UseCases.Usuarios.Commands.ActualizarPerfil;
using Estetica.Application.UseCases.Usuarios.Commands.GestionarProfesional;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Application.UseCases.Usuarios.Queries.GetPerfil;
using Estetica.Application.UseCases.Usuarios.Queries.GetUsuariosPorRol;
using Estetica.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsuariosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Obtener perfil de usuario (incluye datos condicionales según el rol).
    /// </summary>
    [HttpGet("perfil/{id:int}")]
    public async Task<ActionResult<PerfilDto>> GetPerfil(int id)
    {
        var perfil = await _mediator.Send(new GetPerfilQuery(id));
        return Ok(perfil);
    }

    /// <summary>
    /// Actualizar datos personales del usuario.
    /// </summary>
    [HttpPut("perfil")]
    public async Task<ActionResult<UsuarioDto>> ActualizarPerfil([FromBody] ActualizarPerfilCommand command)
    {
        var usuario = await _mediator.Send(command);
        return Ok(usuario);
    }

    /// <summary>
    /// Listar usuarios según su rol (Solo Administrador y Recepcionista).
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista")]
    [HttpGet("rol/{rol}")]
    public async Task<ActionResult<IReadOnlyList<UsuarioDto>>> GetPorRol(RolUsuario rol)
    {
        var usuarios = await _mediator.Send(new GetUsuariosPorRolQuery(rol));
        return Ok(usuarios);
    }

    /// <summary>
    /// Registrar o actualizar información de profesionales y sus especialidades (Solo Administrador).
    /// </summary>
    [Authorize(Roles = "Administrador")]
    [HttpPost("profesionales")]
    public async Task<ActionResult<ProfesionalDto>> GestionarProfesional([FromBody] GestionarProfesionalCommand command)
    {
        var profesional = await _mediator.Send(command);
        return Ok(profesional);
    }
}
