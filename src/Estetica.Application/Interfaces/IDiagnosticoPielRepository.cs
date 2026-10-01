using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IDiagnosticoPielRepository : IRepository<DiagnosticoPiel>
{
    Task<IReadOnlyList<DiagnosticoPiel>> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<DiagnosticoPiel?> GetUltimoDiagnosticoAsync(int usuarioId, CancellationToken cancellationToken = default);
}
