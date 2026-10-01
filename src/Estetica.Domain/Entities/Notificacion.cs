using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class Notificacion
{
    public int NotificacionId { get; set; }
    public int UsuarioId { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public TipoNotificacion Tipo { get; set; } = TipoNotificacion.Sistema;
    public bool Leida { get; set; } = false;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
}
