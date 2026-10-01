namespace Estetica.Domain.Entities;

public class Fidelizacion
{
    public int FidelizacionId { get; set; }
    public int UsuarioId { get; set; }
    public int EstampitasActuales { get; set; }
    public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
}
