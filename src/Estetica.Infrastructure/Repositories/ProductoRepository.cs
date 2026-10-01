using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class ProductoRepository : Repository<Producto>, IProductoRepository
{
    public ProductoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Producto>> GetActivosAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(p => p.Activo)
            .OrderBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Producto>> GetByTipoPielAsync(int tipoPielId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(p => p.Activo && p.ProductoTiposPiel.Any(pt => pt.TipoPielId == tipoPielId))
            .OrderBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Producto>> GetConBajoStockAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(p => p.Activo && p.StockActual <= p.StockMinimo)
            .OrderBy(p => p.StockActual)
            .ToListAsync(cancellationToken);
    }

    public async Task<Producto?> GetWithTiposPielAsync(int productoId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.ProductoTiposPiel).ThenInclude(pt => pt.TipoPiel)
            .FirstOrDefaultAsync(p => p.ProductoId == productoId, cancellationToken);
    }
}
