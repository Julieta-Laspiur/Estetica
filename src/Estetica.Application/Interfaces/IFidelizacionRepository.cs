using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IFidelizacionRepository : IRepository<Fidelizacion>
{
    Task<Fidelizacion?> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
}
