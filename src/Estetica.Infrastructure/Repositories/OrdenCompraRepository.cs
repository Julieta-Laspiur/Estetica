using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class OrdenCompraRepository : Repository<OrdenCompra>, IOrdenCompraRepository
{
    public OrdenCompraRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<OrdenCompra>> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(o => o.Detalles).ThenInclude(d => d.Producto)
            .Where(o => o.UsuarioId == usuarioId)
            .OrderByDescending(o => o.Fecha)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<OrdenCompra>> GetByEstadoAsync(EstadoOrden estado, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(o => o.Usuario)
            .Include(o => o.Detalles).ThenInclude(d => d.Producto)
            .Where(o => o.Estado == estado)
            .OrderByDescending(o => o.Fecha)
            .ToListAsync(cancellationToken);
    }

    public async Task<OrdenCompra?> GetWithDetallesAsync(int ordenId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(o => o.Usuario)
            .Include(o => o.Detalles).ThenInclude(d => d.Producto)
            .Include(o => o.Pagos)
            .FirstOrDefaultAsync(o => o.OrdenId == ordenId, cancellationToken);
    }
}
