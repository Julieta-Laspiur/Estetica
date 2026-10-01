namespace Estetica.Application.Interfaces;

public interface IIAService
{
    Task<string> ConsultarAsistenteAsync(string pregunta, string? contextoCliente = null, CancellationToken cancellationToken = default);
}
