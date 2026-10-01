using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.Carrito.DTOs;

public class DetalleOrdenDto
{
    public int DetalleId { get; set; }
    public int ProductoId { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal => Cantidad * PrecioUnitario;
}

public class OrdenCompraDto
{
    public int OrdenId { get; set; }
    public int UsuarioId { get; set; }
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public EstadoOrden Estado { get; set; }
    public List<DetalleOrdenDto> Detalles { get; set; } = new();
}

public class CuponDescuentoDto
{
    public string Codigo { get; set; } = string.Empty;
    public decimal Descuento { get; set; }
    public decimal TotalOriginal { get; set; }
    public decimal TotalConDescuento { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
