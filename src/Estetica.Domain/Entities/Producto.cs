namespace Estetica.Domain.Entities;

public class Producto
{
    public int ProductoId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public bool Activo { get; set; } = true;

    // Relaciones de navegación
    public ICollection<ProductoTipoPiel> ProductoTiposPiel { get; set; } = new List<ProductoTipoPiel>();
    public ICollection<ItemCarrito> ItemsCarrito { get; set; } = new List<ItemCarrito>();
    public ICollection<DetalleOrden> DetallesOrden { get; set; } = new List<DetalleOrden>();
}
