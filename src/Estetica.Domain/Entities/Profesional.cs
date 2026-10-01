namespace Estetica.Domain.Entities;

public class Profesional
{
    public int ProfesionalId { get; set; }
    public int UsuarioId { get; set; }
    public string Especialidad { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
    public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
    public ICollection<HistorialTratamiento> HistorialesTratamiento { get; set; } = new List<HistorialTratamiento>();
}
