using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IServicioRepository : IRepository<Servicio>
{
    Task<IReadOnlyList<Servicio>> GetActivosAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Servicio>> GetByIdsAsync(IEnumerable<int> servicioIds, CancellationToken cancellationToken = default);
}
