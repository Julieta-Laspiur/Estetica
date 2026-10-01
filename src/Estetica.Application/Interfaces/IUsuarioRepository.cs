using Estetica.Domain.Entities;
using Estetica.Domain.Enums;

namespace Estetica.Application.Interfaces;

public interface IUsuarioRepository : IRepository<Usuario>
{
    Task<Usuario?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Usuario>> GetByRolAsync(RolUsuario rol, CancellationToken cancellationToken = default);
    Task<Usuario?> GetWithProfileAsync(int usuarioId, CancellationToken cancellationToken = default);
}
