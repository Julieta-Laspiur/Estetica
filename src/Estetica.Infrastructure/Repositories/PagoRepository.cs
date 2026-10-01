using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class PagoRepository : Repository<Pago>, IPagoRepository
{
    public PagoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Pago?> GetByReferenciaExternaAsync(string referenciaExterna, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.QrToken)
            .Include(p => p.OrdenCompra)
            .Include(p => p.Turno)
            .FirstOrDefaultAsync(p => p.ReferenciaExterna == referenciaExterna, cancellationToken);
    }

    public async Task<IReadOnlyList<Pago>> GetByOrdenIdAsync(int ordenId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(p => p.QrToken)
            .Where(p => p.OrdenId == ordenId)
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Pago>> GetByTurnoIdAsync(int turnoId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(p => p.QrToken)
            .Where(p => p.TurnoId == turnoId)
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Pago>> GetByEstadoAsync(EstadoPago estado, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(p => p.Estado == estado)
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync(cancellationToken);
    }

    public async Task<Pago?> GetWithQrTokenAsync(int pagoId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.QrToken)
            .FirstOrDefaultAsync(p => p.PagoId == pagoId, cancellationToken);
    }
}
