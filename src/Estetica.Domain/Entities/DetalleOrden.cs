namespace Estetica.Domain.Entities;

public class DetalleOrden
{
    public int DetalleId { get; set; }
    public int OrdenId { get; set; }
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }

    // Relaciones de navegación
    public OrdenCompra OrdenCompra { get; set; } = null!;
    public Producto Producto { get; set; } = null!;
}
