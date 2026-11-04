using System.Text.Json;
using Estetica.Application.UseCases.Pagos.Commands.ConfirmarPagoWebhook;
using Estetica.Application.UseCases.Pagos.Commands.GenerarQrToken;
using Estetica.Application.UseCases.Pagos.Commands.ProcesarPago;
using Estetica.Application.UseCases.Pagos.Commands.RegistrarPagoPresencial;
using Estetica.Application.UseCases.Pagos.DTOs;
using Estetica.Domain.Enums;
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
    /// Registrar cobro presencial en mostrador (Efectivo, Transferencia, Tarjeta física).
    /// Permite al staff acreditar la estampita de fidelización directamente al cliente o generar el QR dinámico en pantalla para que lo escanee.
    /// </summary>
    [Authorize(Roles = "Administrador,Recepcionista,Profesional")]
    [HttpPost("presencial")]
    public async Task<ActionResult<PagoPresencialResultadoDto>> RegistrarPagoPresencial([FromBody] RegistrarPagoPresencialCommand command)
    {
        var resultado = await _mediator.Send(command);
        return Ok(resultado);
    }

    /// <summary>
    /// Webhook para recibir notificaciones automáticas de la pasarela y confirmar la transacción (Acceso público para pasarelas).
    /// Admite tanto el comando directo con ReferenciaExterna como payloads nativos de Mercado Pago (IPN / Webhooks).
    /// </summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> ConfirmarPagoWebhook(
        [FromQuery] string? id,
        [FromQuery] string? topic,
        [FromQuery(Name = "data.id")] string? dataId,
        [FromQuery] string? type,
        [FromBody] JsonElement? body)
    {
        if (body.HasValue && body.Value.ValueKind == JsonValueKind.Object)
        {
            if (body.Value.TryGetProperty("referenciaExterna", out var refProp) && refProp.GetString() is { Length: > 0 } refExt)
            {
                var estadoPago = EstadoPago.Aprobado;
                if (body.Value.TryGetProperty("estadoPago", out var stProp))
                {
                    if (stProp.ValueKind == JsonValueKind.Number)
                    {
                        estadoPago = (EstadoPago)stProp.GetInt32();
                    }
                    else if (stProp.ValueKind == JsonValueKind.String && Enum.TryParse<EstadoPago>(stProp.GetString(), true, out var parsed))
                    {
                        estadoPago = parsed;
                    }
                }
                string? txId = null;
                if (body.Value.TryGetProperty("transaccionIdPasarela", out var txProp))
                {
                    txId = txProp.GetString();
                }

                await _mediator.Send(new ConfirmarPagoWebhookCommand(refExt, estadoPago, txId));
                return Ok(new { message = "Webhook procesado correctamente." });
            }
        }

        var paymentId = id ?? dataId;
        return Ok(new { message = $"Notificación recibida exitosamente{(paymentId != null ? $" para el pago {paymentId}" : "")}." });
    }

    /// <summary>
    /// Simular la acreditación de un pago vía Webhook para entorno de desarrollo / pruebas locales sin requerir túnel ngrok.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("simular-webhook/{referenciaExterna}")]
    public async Task<IActionResult> SimularWebhook(string referenciaExterna, [FromQuery] EstadoPago estado = EstadoPago.Aprobado)
    {
        await _mediator.Send(new ConfirmarPagoWebhookCommand(referenciaExterna, estado, $"SIM-MP-{Guid.NewGuid():N}"));
        return Ok(new { message = $"Webhook simulado exitosamente para '{referenciaExterna}' con estado '{estado}'." });
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
