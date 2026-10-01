using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IHistorialTratamientoRepository : IRepository<HistorialTratamiento>
{
    Task<IReadOnlyList<HistorialTratamiento>> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<HistorialTratamiento>> GetByProfesionalIdAsync(int profesionalId, CancellationToken cancellationToken = default);
}
