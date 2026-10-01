using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class TipoPielRepository : Repository<TipoPiel>, ITipoPielRepository
{
    public TipoPielRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<TipoPiel?> GetByNombreAsync(TipoPielEnum nombre, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(tp => tp.Nombre == nombre, cancellationToken);
    }

    public async Task<TipoPiel?> GetWithProductosAsync(int tipoPielId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(tp => tp.ProductoTiposPiel).ThenInclude(pt => pt.Producto)
            .FirstOrDefaultAsync(tp => tp.TipoPielId == tipoPielId, cancellationToken);
    }
}
