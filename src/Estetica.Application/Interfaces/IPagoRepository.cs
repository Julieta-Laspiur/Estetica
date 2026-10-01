using Estetica.Domain.Entities;
using Estetica.Domain.Enums;

namespace Estetica.Application.Interfaces;

public interface IPagoRepository : IRepository<Pago>
{
    Task<Pago?> GetByReferenciaExternaAsync(string referenciaExterna, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Pago>> GetByOrdenIdAsync(int ordenId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Pago>> GetByTurnoIdAsync(int turnoId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Pago>> GetByEstadoAsync(EstadoPago estado, CancellationToken cancellationToken = default);
    Task<Pago?> GetWithQrTokenAsync(int pagoId, CancellationToken cancellationToken = default);
}
