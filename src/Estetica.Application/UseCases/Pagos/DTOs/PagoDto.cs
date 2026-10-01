using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.Pagos.DTOs;

public class PagoDto
{
    public int PagoId { get; set; }
    public int? OrdenId { get; set; }
    public int? TurnoId { get; set; }
    public decimal Monto { get; set; }
    public EstadoPago Estado { get; set; }
    public ProveedorPago Proveedor { get; set; }
    public DateTime? FechaPago { get; set; }
    public string? ReferenciaExterna { get; set; }
    public string? TokenBase64Qr { get; set; }
}

public class PreferenciaPagoDto
{
    public int PagoId { get; set; }
    public string InitPointUrl { get; set; } = string.Empty;
    public string ReferenciaExterna { get; set; } = string.Empty;
    public decimal Monto { get; set; }
}

public class QrTokenDto
{
    public int QrTokenId { get; set; }
    public int PagoId { get; set; }
    public string TokenBase64 { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaExpiracion { get; set; }
    public bool Usado { get; set; }
}
