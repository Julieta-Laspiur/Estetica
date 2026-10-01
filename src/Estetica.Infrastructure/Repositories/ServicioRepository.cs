using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class ServicioRepository : Repository<Servicio>, IServicioRepository
{
    public ServicioRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Servicio>> GetActivosAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(s => s.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Servicio>> GetByIdsAsync(IEnumerable<int> servicioIds, CancellationToken cancellationToken = default)
    {
        var idList = servicioIds.ToList();
        return await _dbSet
            .Where(s => idList.Contains(s.ServicioId))
            .ToListAsync(cancellationToken);
    }
}
