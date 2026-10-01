using System.Security.Claims;
using System.Text;
using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Estetica.Infrastructure.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(Usuario usuario)
    {
        var secret = _configuration["Jwt:Secret"] ?? "SuperSecretKeyForEsteticaApplication2026!WithEnoughBitsForHmacSha256";
        var issuer = _configuration["Jwt:Issuer"] ?? "EsteticaApi";
        var audience = _configuration["Jwt:Audience"] ?? "EsteticaApp";
        var expiryDays = int.TryParse(_configuration["Jwt:ExpiryDays"], out var days) ? days : 7;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new Dictionary<string, object>
        {
            [JwtRegisteredClaimNames.Sub] = usuario.UsuarioId.ToString(),
            [JwtRegisteredClaimNames.Email] = usuario.Email,
            [JwtRegisteredClaimNames.GivenName] = usuario.Nombre,
            [JwtRegisteredClaimNames.FamilyName] = usuario.Apellido,
            [ClaimTypes.Role] = usuario.Rol.ToString(),
            [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString()
        };

        var handler = new JsonWebTokenHandler();
        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = issuer,
            Audience = audience,
            Claims = claims,
            Expires = DateTime.UtcNow.AddDays(expiryDays),
            SigningCredentials = credentials
        };

        return handler.CreateToken(descriptor);
    }
}
