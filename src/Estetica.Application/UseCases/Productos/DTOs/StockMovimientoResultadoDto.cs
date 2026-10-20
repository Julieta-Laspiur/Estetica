using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.Productos.DTOs;

public class StockMovimientoResultadoDto
{
    public int ProductoId { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public int StockAnterior { get; set; }
    public int StockNuevo { get; set; }
    public int StockMinimo { get; set; }
    public TipoAjusteStock TipoAjuste { get; set; }
    public string TipoAjusteDescripcion { get; set; } = string.Empty;
    public int CantidadAjustada { get; set; }
    public string? Motivo { get; set; }
    public bool EsBajoStock { get; set; }
    public bool AlertaGenerada { get; set; }
    public string? MensajeAlerta { get; set; }
    public DateTime FechaMovimiento { get; set; } = DateTime.UtcNow;
}
