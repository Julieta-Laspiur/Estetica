using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class Usuario
{
    public int UsuarioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; } = RolUsuario.Cliente;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    // Relaciones de navegación
    public Profesional? Profesional { get; set; }
    public Fidelizacion? Fidelizacion { get; set; }
    public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
    public ICollection<Carrito> Carritos { get; set; } = new List<Carrito>();
    public ICollection<OrdenCompra> OrdenesCompra { get; set; } = new List<OrdenCompra>();
    public ICollection<DiagnosticoPiel> DiagnosticosPiel { get; set; } = new List<DiagnosticoPiel>();
    public ICollection<HistorialTratamiento> HistorialesTratamiento { get; set; } = new List<HistorialTratamiento>();
    public ICollection<Notificacion> Notificaciones { get; set; } = new List<Notificacion>();
    public ICollection<ConversacionIA> ConversacionesIA { get; set; } = new List<ConversacionIA>();
    public ICollection<Cupon> Cupones { get; set; } = new List<Cupon>();
}
