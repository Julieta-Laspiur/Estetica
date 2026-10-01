using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface ICuponRepository : IRepository<Cupon>
{
    Task<Cupon?> GetByCodigoValidoAsync(string codigo, int? usuarioId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Cupon>> GetActivosByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
}
