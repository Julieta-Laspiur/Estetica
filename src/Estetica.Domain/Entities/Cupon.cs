using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class Cupon
{
    public int CuponId { get; set; }
    public int? UsuarioId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public decimal Descuento { get; set; }
    public EstadoCupon Estado { get; set; } = EstadoCupon.Activo;
    public DateTime FechaExpiracion { get; set; }

    // Relaciones de navegación
    public Usuario? Usuario { get; set; }
}
