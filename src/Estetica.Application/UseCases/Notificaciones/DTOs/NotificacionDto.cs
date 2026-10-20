using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.Notificaciones.DTOs;

public class NotificacionDto
{
    public int NotificacionId { get; set; }
    public int UsuarioId { get; set; }
    public string? DestinatarioNombre { get; set; }
    public string? DestinatarioEmail { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public TipoNotificacion Tipo { get; set; }
    public string TipoDescripcion { get; set; } = string.Empty;
    public string CategoriaAlerta { get; set; } = string.Empty; // "Pago Aprobado", "Stock Crítico", "Turno", "General"
    public bool EsAlertaCritica { get; set; }
    public bool Leida { get; set; }
    public DateTime Fecha { get; set; }
    public string FechaFormateada { get; set; } = string.Empty;
    public string HoraFormateada { get; set; } = string.Empty;
}
