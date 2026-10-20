using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface INotificacionRepository : IRepository<Notificacion>
{
    Task<IReadOnlyList<Notificacion>> GetByUsuarioIdAsync(int usuarioId, bool soloNoLeidas = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Notificacion>> GetAlertasAdminAsync(bool soloNoLeidas = false, int limite = 100, CancellationToken cancellationToken = default);
    Task<bool> MarcarComoLeidaAsync(int notificacionId, CancellationToken cancellationToken = default);
    Task MarcarComoLeidasAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task MarcarTodasAlertasAdminComoLeidasAsync(CancellationToken cancellationToken = default);
}
