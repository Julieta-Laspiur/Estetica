using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class OrdenCompra
{
    public int OrdenId { get; set; }
    public int UsuarioId { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public decimal Total { get; set; }
    public EstadoOrden Estado { get; set; } = EstadoOrden.Pendiente;

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
    public ICollection<DetalleOrden> Detalles { get; set; } = new List<DetalleOrden>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
