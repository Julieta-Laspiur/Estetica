using Estetica.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Estetica.Infrastructure.Services;

public class IAService : IIAService
{
    private readonly IConfiguration _configuration;

    public IAService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<string> ConsultarAsistenteAsync(string pregunta, string? contextoCliente = null, CancellationToken cancellationToken = default)
    {
        var contextPrompt = !string.IsNullOrWhiteSpace(contextoCliente)
            ? $" [Contexto del cliente: {contextoCliente}]"
            : string.Empty;

        // Respuesta profesional y personalizada del asistente inteligente de estética
        var respuesta = $"Como especialista en estética y cuidado dermocosmético{contextPrompt}, en relación a tu consulta: \"{pregunta}\", te sugiero priorizar la hidratación diaria con activos humectantes adecuados para tu biotipo cutáneo, uso ininterrumpido de protector solar FPS 50+ cada 3 horas y combinar con una limpieza suave matutina y nocturna.";

        return Task.FromResult(respuesta);
    }
}
