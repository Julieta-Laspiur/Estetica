using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class UsuarioRepository : Repository<Usuario>, IUsuarioRepository
{
    public UsuarioRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Usuario?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
    }

    public async Task<IReadOnlyList<Usuario>> GetByRolAsync(RolUsuario rol, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AsNoTracking().Where(u => u.Rol == rol).ToListAsync(cancellationToken);
    }

    public async Task<Usuario?> GetWithProfileAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Profesional)
            .Include(u => u.Fidelizacion)
            .FirstOrDefaultAsync(u => u.UsuarioId == usuarioId, cancellationToken);
    }
}
