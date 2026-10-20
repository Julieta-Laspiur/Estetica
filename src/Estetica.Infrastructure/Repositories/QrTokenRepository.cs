using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class QrTokenRepository : Repository<QrToken>, IQrTokenRepository
{
    public QrTokenRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<QrToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(q => q.Pago)
            .FirstOrDefaultAsync(q => q.TokenBase64 == token, cancellationToken);
    }

    public async Task<QrToken?> GetByPagoIdAsync(int pagoId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(q => q.Pago)
            .FirstOrDefaultAsync(q => q.PagoId == pagoId, cancellationToken);
    }
}
