namespace Estetica.Domain.Entities;

public class QrToken
{
    public int QrTokenId { get; set; }
    public int PagoId { get; set; }
    public string TokenBase64 { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime FechaExpiracion { get; set; }
    public bool Usado { get; set; } = false;

    // Relaciones de navegación
    public Pago Pago { get; set; } = null!;
}
