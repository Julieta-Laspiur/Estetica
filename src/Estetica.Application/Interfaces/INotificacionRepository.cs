using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface INotificacionRepository : IRepository<Notificacion>
{
    Task<IReadOnlyList<Notificacion>> GetByUsuarioIdAsync(int usuarioId, bool soloNoLeidas = false, CancellationToken cancellationToken = default);
    Task MarcarComoLeidasAsync(int usuarioId, CancellationToken cancellationToken = default);
}
