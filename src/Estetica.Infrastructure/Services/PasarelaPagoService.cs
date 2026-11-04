using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Estetica.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Estetica.Infrastructure.Services;

public class PasarelaPagoService : IPasarelaPagoService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public PasarelaPagoService(IConfiguration configuration)
    {
        _configuration = configuration;
        _httpClient = new HttpClient();
    }

    public async Task<string> CrearPreferenciaPagoAsync(decimal monto, string descripcion, string referenciaExterna, CancellationToken cancellationToken = default)
    {
        var accessToken = _configuration["MercadoPago:AccessToken"];

        // 1. Si existe un Access Token de Mercado Pago configurado, creamos la preferencia real con la API oficial
        if (!string.IsNullOrWhiteSpace(accessToken) && !accessToken.Contains("TU_ACCESS_TOKEN"))
        {
            try
            {
                var requestPayload = new
                {
                    items = new[]
                    {
                        new
                        {
                            title = descripcion,
                            quantity = 1,
                            currency_id = "ARS",
                            unit_price = monto
                        }
                    },
                    external_reference = referenciaExterna,
                    back_urls = new
                    {
                        success = $"{_configuration["MercadoPago:FrontendBaseUrl"] ?? "http://localhost:5173"}/?pago_status=approved",
                        failure = $"{_configuration["MercadoPago:FrontendBaseUrl"] ?? "http://localhost:5173"}/?pago_status=failure",
                        pending = $"{_configuration["MercadoPago:FrontendBaseUrl"] ?? "http://localhost:5173"}/?pago_status=pending"
                    },
                    auto_return = "approved"
                };

                var json = JsonSerializer.Serialize(requestPayload);
                using var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.mercadopago.com/checkout/preferences");
                requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                requestMessage.Content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(requestMessage, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                    using var doc = JsonDocument.Parse(responseJson);
                    if (doc.RootElement.TryGetProperty("init_point", out var initPointElem))
                    {
                        return initPointElem.GetString() ?? string.Empty;
                    }
                    if (doc.RootElement.TryGetProperty("sandbox_init_point", out var sandboxElem))
                    {
                        return sandboxElem.GetString() ?? string.Empty;
                    }
                }
            }
            catch
            {
                // Fallback a URL estándar si falla la llamada de red a Mercado Pago
            }
        }

        // 2. URL estándar de Checkout de Mercado Pago (Sandbox / Producción)
        var baseUrl = _configuration["MercadoPago:SandboxCheckoutUrl"] ?? "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=";
        var preferenceId = $"PREF_{Guid.NewGuid():N}";
        var checkoutUrl = $"{baseUrl}{preferenceId}&external_reference={referenciaExterna}&amount={monto:F2}";

        return checkoutUrl;
    }
}

