using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.Usuarios.DTOs;

public class UsuarioDto
{
    public int UsuarioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public RolUsuario Rol { get; set; }
    public DateTime FechaRegistro { get; set; }
}
