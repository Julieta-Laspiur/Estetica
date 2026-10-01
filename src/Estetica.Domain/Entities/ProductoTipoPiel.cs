namespace Estetica.Domain.Entities;

public class ProductoTipoPiel
{
    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;

    public int TipoPielId { get; set; }
    public TipoPiel TipoPiel { get; set; } = null!;
}
