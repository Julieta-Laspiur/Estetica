using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface ICarritoRepository : IRepository<Carrito>
{
    Task<Carrito?> GetCarritoActivoByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<Carrito?> GetWithItemsAsync(int carritoId, CancellationToken cancellationToken = default);
}
