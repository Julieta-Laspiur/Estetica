using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class HistorialTratamientoRepository : Repository<HistorialTratamiento>, IHistorialTratamientoRepository
{
    public HistorialTratamientoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<HistorialTratamiento>> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(h => h.Profesional).ThenInclude(p => p.Usuario)
            .Where(h => h.UsuarioId == usuarioId)
            .OrderByDescending(h => h.Fecha)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<HistorialTratamiento>> GetByProfesionalIdAsync(int profesionalId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(h => h.Usuario)
            .Where(h => h.ProfesionalId == profesionalId)
            .OrderByDescending(h => h.Fecha)
            .ToListAsync(cancellationToken);
    }
}
