namespace Estetica.Domain.Entities;

public class ConversacionIA
{
    public int ConversacionId { get; set; }
    public int UsuarioId { get; set; }
    public string Pregunta { get; set; } = string.Empty;
    public string Respuesta { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
}
