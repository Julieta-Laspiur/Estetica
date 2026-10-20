using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IQrTokenRepository : IRepository<QrToken>
{
    Task<QrToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<QrToken?> GetByPagoIdAsync(int pagoId, CancellationToken cancellationToken = default);
}
