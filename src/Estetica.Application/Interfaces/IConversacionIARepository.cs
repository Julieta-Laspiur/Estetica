using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IConversacionIARepository : IRepository<ConversacionIA>
{
    Task<IReadOnlyList<ConversacionIA>> GetHistorialByUsuarioIdAsync(int usuarioId, int limit = 50, CancellationToken cancellationToken = default);
}
