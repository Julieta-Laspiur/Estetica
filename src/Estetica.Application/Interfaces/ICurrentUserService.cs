namespace Estetica.Application.Interfaces;

public interface ICurrentUserService
{
    int? UsuarioId { get; }
    string? Email { get; }
    string? Rol { get; }
    bool IsAuthenticated { get; }
    bool EstaEnRol(string rol);
}
