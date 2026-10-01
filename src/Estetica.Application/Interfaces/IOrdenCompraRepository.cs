using Estetica.Domain.Entities;
using Estetica.Domain.Enums;

namespace Estetica.Application.Interfaces;

public interface IOrdenCompraRepository : IRepository<OrdenCompra>
{
    Task<IReadOnlyList<OrdenCompra>> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OrdenCompra>> GetByEstadoAsync(EstadoOrden estado, CancellationToken cancellationToken = default);
    Task<OrdenCompra?> GetWithDetallesAsync(int ordenId, CancellationToken cancellationToken = default);
}
