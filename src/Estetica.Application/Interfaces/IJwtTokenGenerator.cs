using Estetica.Domain.Entities;

namespace Estetica.Application.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(Usuario usuario);
}
