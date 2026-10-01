using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IProfesionalRepository : IRepository<Profesional>
{
    Task<IReadOnlyList<Profesional>> GetActivosAsync(CancellationToken cancellationToken = default);
    Task<Profesional?> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<Profesional?> GetWithDetailsAsync(int profesionalId, CancellationToken cancellationToken = default);
}
