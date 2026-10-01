namespace Estetica.Application.Interfaces;

public interface IPasarelaPagoService
{
    Task<string> CrearPreferenciaPagoAsync(decimal monto, string descripcion, string referenciaExterna, CancellationToken cancellationToken = default);
}
