namespace Estetica.Application.UseCases.Carrito.DTOs;

public class ItemCarritoDto
{
    public int ItemCarritoId { get; set; }
    public int ProductoId { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public decimal PrecioUnitario { get; set; }
    public int Cantidad { get; set; }
    public decimal Subtotal => PrecioUnitario * Cantidad;
}

public class CarritoDto
{
    public int CarritoId { get; set; }
    public int UsuarioId { get; set; }
    public List<ItemCarritoDto> Items { get; set; } = new();
    public decimal Total => Items.Sum(i => i.Subtotal);
}
