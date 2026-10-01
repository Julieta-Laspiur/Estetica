using System.Security.Claims;
using Estetica.Application.Interfaces;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Estetica.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public int? UsuarioId
    {
        get
        {
            var user = User;
            if (user == null || !user.Identity?.IsAuthenticated == true)
            {
                return null;
            }

            var subClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? user.FindFirst("sub")?.Value
                           ?? user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            return int.TryParse(subClaim, out var id) ? id : null;
        }
    }

    public string? Email
    {
        get
        {
            var user = User;
            if (user == null || !user.Identity?.IsAuthenticated == true)
            {
                return null;
            }

            return user.FindFirst(ClaimTypes.Email)?.Value
                   ?? user.FindFirst("email")?.Value
                   ?? user.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
        }
    }

    public string? Rol
    {
        get
        {
            var user = User;
            if (user == null || !user.Identity?.IsAuthenticated == true)
            {
                return null;
            }

            return user.FindFirst(ClaimTypes.Role)?.Value
                   ?? user.FindFirst("role")?.Value;
        }
    }

    public bool EstaEnRol(string rol)
    {
        var user = User;
        if (user == null || !user.Identity?.IsAuthenticated == true)
        {
            return false;
        }

        return user.IsInRole(rol);
    }
}
