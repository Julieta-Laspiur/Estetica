using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class ConversacionIARepository : Repository<ConversacionIA>, IConversacionIARepository
{
    public ConversacionIARepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<ConversacionIA>> GetHistorialByUsuarioIdAsync(int usuarioId, int limit = 50, CancellationToken cancellationToken = default)
    {
        var items = await _dbSet
            .AsNoTracking()
            .Where(c => c.UsuarioId == usuarioId)
            .OrderByDescending(c => c.Fecha)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return items.OrderBy(c => c.Fecha).ToList();
    }
}
