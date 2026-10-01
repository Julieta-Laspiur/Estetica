namespace Estetica.Domain.Entities;

public class ItemCarrito
{
    public int ItemCarritoId { get; set; }
    public int CarritoId { get; set; }
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }

    // Relaciones de navegación
    public Carrito Carrito { get; set; } = null!;
    public Producto Producto { get; set; } = null!;
}
