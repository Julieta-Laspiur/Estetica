using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class NotificacionRepository : Repository<Notificacion>, INotificacionRepository
{
    public NotificacionRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Notificacion>> GetByUsuarioIdAsync(int usuarioId, bool soloNoLeidas = false, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(n => n.UsuarioId == usuarioId && (!soloNoLeidas || !n.Leida))
            .OrderByDescending(n => n.Fecha)
            .ToListAsync(cancellationToken);
    }

    public async Task MarcarComoLeidasAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        await _dbSet
            .Where(n => n.UsuarioId == usuarioId && !n.Leida)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Leida, true), cancellationToken);
    }
}
