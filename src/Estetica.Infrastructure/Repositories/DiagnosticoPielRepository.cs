using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class DiagnosticoPielRepository : Repository<DiagnosticoPiel>, IDiagnosticoPielRepository
{
    public DiagnosticoPielRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<DiagnosticoPiel>> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(d => d.TipoPiel)
            .Where(d => d.UsuarioId == usuarioId)
            .OrderByDescending(d => d.Fecha)
            .ToListAsync(cancellationToken);
    }

    public async Task<DiagnosticoPiel?> GetUltimoDiagnosticoAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(d => d.TipoPiel)
            .Where(d => d.UsuarioId == usuarioId)
            .OrderByDescending(d => d.Fecha)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
