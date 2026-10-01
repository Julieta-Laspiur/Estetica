using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class CuponRepository : Repository<Cupon>, ICuponRepository
{
    public CuponRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Cupon?> GetByCodigoValidoAsync(string codigo, int? usuarioId = null, CancellationToken cancellationToken = default)
    {
        var codigoNormalizado = codigo.Trim().ToUpper();
        return await _dbSet
            .FirstOrDefaultAsync(c =>
                c.Codigo.ToUpper() == codigoNormalizado &&
                c.Estado == EstadoCupon.Activo &&
                c.FechaExpiracion > DateTime.UtcNow &&
                (!c.UsuarioId.HasValue || c.UsuarioId == usuarioId),
                cancellationToken);
    }

    public async Task<IReadOnlyList<Cupon>> GetActivosByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(c =>
                (c.UsuarioId == usuarioId || c.UsuarioId == null) &&
                c.Estado == EstadoCupon.Activo &&
                c.FechaExpiracion > DateTime.UtcNow)
            .OrderBy(c => c.FechaExpiracion)
            .ToListAsync(cancellationToken);
    }
}
