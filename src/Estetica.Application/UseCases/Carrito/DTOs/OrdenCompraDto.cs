using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.Carrito.DTOs;

public class DetalleOrdenDto
{
    public int DetalleId { get; set; }
    public int ProductoId { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public string? ImagenUrl { get; set; }
    public string? Marca { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal => Cantidad * PrecioUnitario;
}

public class OrdenCompraDto
{
    public int OrdenId { get; set; }
    public int UsuarioId { get; set; }
    public string? ClienteNombre { get; set; }
    public string? ClienteEmail { get; set; }
    public string? ClienteTelefono { get; set; }
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public EstadoOrden Estado { get; set; }
    public string? MedioPago { get; set; }
    public EstadoPago? EstadoPago { get; set; }
    public string? ReferenciaExterna { get; set; }
    public DateTime? FechaPago { get; set; }
    public string? MotivoDevolucion { get; set; }
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
