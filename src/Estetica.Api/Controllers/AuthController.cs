using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.Commands.Login;
using Estetica.Application.UseCases.Usuarios.Commands.RegistrarUsuario;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Application.UseCases.Usuarios.Queries.GetPerfil;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Registrar una nueva cuenta de usuario (Cliente, Profesional o Administrador).
    /// </summary>
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegistrarUsuarioCommand command)
    {
        var response = await _mediator.Send(command);
        return CreatedAtAction(nameof(Register), new { id = response.Usuario.UsuarioId }, response);
    }

    /// <summary>
    /// Autenticar usuario con email y contraseña, devolviendo token JWT.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginCommand command)
    {
        var response = await _mediator.Send(command);
        return Ok(response);
    }

    /// <summary>
    /// Obtener los datos del usuario autenticado actual a partir del token JWT.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<PerfilDto>> GetCurrentUser([FromServices] ICurrentUserService currentUserService)
    {
        if (currentUserService.UsuarioId == null)
        {
            return Unauthorized(new { message = "No se pudo determinar el usuario a partir del token provisto." });
        }

        var perfil = await _mediator.Send(new GetPerfilQuery(currentUserService.UsuarioId.Value));
        return Ok(perfil);
    }
}
