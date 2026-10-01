namespace Estetica.Application.UseCases.Productos.DTOs;

public class StockAlertaDto
{
    public int ProductoId { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public bool EsBajoStock { get; set; }
    public string? MensajeAlerta { get; set; }
}
