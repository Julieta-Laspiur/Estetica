using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class Pago
{
    public int PagoId { get; set; }
    public int? OrdenId { get; set; }
    public int? TurnoId { get; set; }
    public decimal Monto { get; set; }
    public EstadoPago Estado { get; set; } = EstadoPago.Pendiente;
    public ProveedorPago Proveedor { get; set; } = ProveedorPago.MercadoPago;
    public DateTime? FechaPago { get; set; }
    public string? ReferenciaExterna { get; set; }

    // Relaciones de navegación
    public OrdenCompra? OrdenCompra { get; set; }
    public Turno? Turno { get; set; }
    public QrToken? QrToken { get; set; }
}
