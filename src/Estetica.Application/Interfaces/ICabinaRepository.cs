using Estetica.Domain.Entities;
using Estetica.Domain.Enums;

namespace Estetica.Application.Interfaces;

public interface ICabinaRepository : IRepository<Cabina>
{
    Task<IReadOnlyList<Cabina>> GetByEstadoAsync(EstadoCabina estado, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Cabina>> GetDisponiblesAsync(CancellationToken cancellationToken = default);
}
