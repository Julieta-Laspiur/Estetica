using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
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
            .Include(n => n.Usuario)
            .Where(n => n.UsuarioId == usuarioId && (!soloNoLeidas || !n.Leida))
            .OrderByDescending(n => n.Fecha)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Notificacion>> GetAlertasAdminAsync(bool soloNoLeidas = false, int limite = 100, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(n => n.Usuario)
            .Where(n => (n.Usuario.Rol == RolUsuario.Administrador || n.Tipo == TipoNotificacion.Sistema || n.Tipo == TipoNotificacion.AlertaStock || n.Tipo == TipoNotificacion.AlertaPago)
                        && (!soloNoLeidas || !n.Leida))
            .OrderByDescending(n => n.Fecha)
            .Take(limite)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> MarcarComoLeidaAsync(int notificacionId, CancellationToken cancellationToken = default)
    {
        var notificacion = await _dbSet.FirstOrDefaultAsync(n => n.NotificacionId == notificacionId, cancellationToken);
        if (notificacion == null)
            return false;

        notificacion.Leida = true;
        return true;
    }

    public async Task MarcarComoLeidasAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        await _dbSet
            .Where(n => n.UsuarioId == usuarioId && !n.Leida)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Leida, true), cancellationToken);
    }

    public async Task MarcarTodasAlertasAdminComoLeidasAsync(CancellationToken cancellationToken = default)
    {
        await _dbSet
            .Where(n => !n.Leida && (n.Usuario.Rol == RolUsuario.Administrador || n.Tipo == TipoNotificacion.Sistema || n.Tipo == TipoNotificacion.AlertaStock || n.Tipo == TipoNotificacion.AlertaPago))
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Leida, true), cancellationToken);
    }
}
