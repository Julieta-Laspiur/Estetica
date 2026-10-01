namespace Estetica.Application.UseCases.Usuarios.DTOs;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UsuarioDto Usuario { get; set; } = null!;
}
