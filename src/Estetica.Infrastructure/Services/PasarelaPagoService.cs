using Estetica.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Estetica.Infrastructure.Services;

public class PasarelaPagoService : IPasarelaPagoService
{
    private readonly IConfiguration _configuration;

    public PasarelaPagoService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<string> CrearPreferenciaPagoAsync(decimal monto, string descripcion, string referenciaExterna, CancellationToken cancellationToken = default)
    {
        // En ambiente de desarrollo/sandbox o producción con SDK oficial de MercadoPago
        var baseUrl = _configuration["MercadoPago:SandboxCheckoutUrl"] ?? "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=";
        var preferenceId = $"PREF_{Guid.NewGuid():N}";
        var checkoutUrl = $"{baseUrl}{preferenceId}&external_reference={referenciaExterna}&amount={monto:F2}";

        return Task.FromResult(checkoutUrl);
    }
}
