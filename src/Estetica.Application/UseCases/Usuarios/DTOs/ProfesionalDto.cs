namespace Estetica.Application.UseCases.Usuarios.DTOs;

public class ProfesionalDto
{
    public int ProfesionalId { get; set; }
    public int UsuarioId { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string Especialidad { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public int TotalTurnos { get; set; }
}

