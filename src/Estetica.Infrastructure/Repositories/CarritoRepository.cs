using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class CarritoRepository : Repository<Carrito>, ICarritoRepository
{
    public CarritoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Carrito?> GetCarritoActivoByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Items).ThenInclude(i => i.Producto)
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioId && c.Estado == EstadoCarrito.Activo, cancellationToken);
    }

    public async Task<Carrito?> GetWithItemsAsync(int carritoId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Items).ThenInclude(i => i.Producto)
            .FirstOrDefaultAsync(c => c.CarritoId == carritoId, cancellationToken);
    }
}
