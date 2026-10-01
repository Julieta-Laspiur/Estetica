using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IProductoRepository : IRepository<Producto>
{
    Task<IReadOnlyList<Producto>> GetActivosAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Producto>> GetByTipoPielAsync(int tipoPielId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Producto>> GetConBajoStockAsync(CancellationToken cancellationToken = default);
    Task<Producto?> GetWithTiposPielAsync(int productoId, CancellationToken cancellationToken = default);
}
