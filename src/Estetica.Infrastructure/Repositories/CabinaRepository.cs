using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class CabinaRepository : Repository<Cabina>, ICabinaRepository
{
    public CabinaRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Cabina>> GetByEstadoAsync(EstadoCabina estado, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(c => c.Estado == estado)
            .OrderBy(c => c.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Cabina>> GetDisponiblesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(c => c.Estado == EstadoCabina.Disponible)
            .OrderBy(c => c.Nombre)
            .ToListAsync(cancellationToken);
    }
}
