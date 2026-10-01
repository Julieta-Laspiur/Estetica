using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class ProfesionalRepository : Repository<Profesional>, IProfesionalRepository
{
    public ProfesionalRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Profesional>> GetActivosAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(p => p.Usuario)
            .Where(p => p.Activo)
            .ToListAsync(cancellationToken);
    }

    public async Task<Profesional?> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId, cancellationToken);
    }

    public async Task<Profesional?> GetWithDetailsAsync(int profesionalId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Usuario)
            .Include(p => p.Turnos)
            .Include(p => p.HistorialesTratamiento)
            .FirstOrDefaultAsync(p => p.ProfesionalId == profesionalId, cancellationToken);
    }
}
