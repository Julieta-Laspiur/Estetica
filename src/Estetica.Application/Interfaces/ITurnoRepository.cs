using Estetica.Domain.Entities;
using Estetica.Domain.Enums;

namespace Estetica.Application.Interfaces;

public interface ITurnoRepository : IRepository<Turno>
{
    Task<IReadOnlyList<Turno>> GetByFechaRangeAsync(DateTime inicio, DateTime fin, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Turno>> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Turno>> GetByProfesionalIdAsync(int profesionalId, DateTime? fecha = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Turno>> GetByCabinaIdAsync(int cabinaId, DateTime? fecha = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Turno>> GetByEstadoAsync(EstadoTurno estado, CancellationToken cancellationToken = default);
    Task<Turno?> GetWithDetailsAsync(int turnoId, CancellationToken cancellationToken = default);
    Task<bool> IsCabinaAvailableAsync(int cabinaId, DateTime inicio, DateTime fin, int? excludeTurnoId = null, CancellationToken cancellationToken = default);
    Task<bool> IsProfesionalAvailableAsync(int profesionalId, DateTime inicio, DateTime fin, int? excludeTurnoId = null, CancellationToken cancellationToken = default);
}
