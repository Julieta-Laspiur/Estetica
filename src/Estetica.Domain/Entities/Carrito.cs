using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class Carrito
{
    public int CarritoId { get; set; }
    public int UsuarioId { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public EstadoCarrito Estado { get; set; } = EstadoCarrito.Activo;

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
    public ICollection<ItemCarrito> Items { get; set; } = new List<ItemCarrito>();
}
