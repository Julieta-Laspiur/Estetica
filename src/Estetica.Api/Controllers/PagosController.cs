using Estetica.Application.UseCases.Pagos.Commands.ConfirmarPagoWebhook;
using Estetica.Application.UseCases.Pagos.Commands.GenerarQrToken;
using Estetica.Application.UseCases.Pagos.Commands.ProcesarPago;
using Estetica.Application.UseCases.Pagos.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estetica.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class PagosController : ControllerBase
{
    private readonly IMediator _mediator;

    public PagosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Iniciar preferencia de pago con pasarela externa (Mercado Pago) para un turno o una orden.
    /// </summary>
    [HttpPost("procesar")]
    public async Task<ActionResult<PreferenciaPagoDto>> ProcesarPago([FromBody] ProcesarPagoCommand command)
    {
        var preferencia = await _mediator.Send(command);
        return Ok(preferencia);
    }

    /// <summary>
    /// Webhook para recibir notificaciones automáticas de la pasarela y confirmar la transacción (Acceso público para pasarelas).
    /// </summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> ConfirmarPagoWebhook([FromBody] ConfirmarPagoWebhookCommand command)
    {
        await _mediator.Send(command);
        return Ok(new { message = "Webhook procesado correctamente." });
    }

    /// <summary>
    /// Generar o consultar el código QR de acceso tras concretar un pago aprobado.
    /// </summary>
    [HttpPost("{id:int}/qr")]
    public async Task<ActionResult<QrTokenDto>> GenerarQrToken(int id)
    {
        var qrToken = await _mediator.Send(new GenerarQrTokenCommand(id));
        return Ok(qrToken);
    }
}
