namespace Estetica.Domain.Entities;

public class HistorialTratamiento
{
    public int HistorialId { get; set; }
    public int UsuarioId { get; set; }
    public int ProfesionalId { get; set; }
    public int? TurnoId { get; set; }
    public string? Observaciones { get; set; }
    public string? Recomendaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
    public Profesional Profesional { get; set; } = null!;
    public Turno? Turno { get; set; }
}
