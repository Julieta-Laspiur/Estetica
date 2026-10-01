using Estetica.Domain.Entities;
using Estetica.Domain.Enums;

namespace Estetica.Application.Interfaces;

public interface ITipoPielRepository : IRepository<TipoPiel>
{
    Task<TipoPiel?> GetByNombreAsync(TipoPielEnum nombre, CancellationToken cancellationToken = default);
    Task<TipoPiel?> GetWithProductosAsync(int tipoPielId, CancellationToken cancellationToken = default);
}
