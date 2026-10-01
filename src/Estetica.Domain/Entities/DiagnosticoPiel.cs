namespace Estetica.Domain.Entities;

public class DiagnosticoPiel
{
    public int DiagnosticoId { get; set; }
    public int UsuarioId { get; set; }
    public int TipoPielId { get; set; }
    public string Resultado { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
    public TipoPiel TipoPiel { get; set; } = null!;
}
