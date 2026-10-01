using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class FidelizacionRepository : Repository<Fidelizacion>, IFidelizacionRepository
{
    public FidelizacionRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Fidelizacion?> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(f => f.UsuarioId == usuarioId, cancellationToken);
    }
}
