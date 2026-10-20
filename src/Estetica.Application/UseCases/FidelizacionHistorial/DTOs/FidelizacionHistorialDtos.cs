namespace Estetica.Application.UseCases.FidelizacionHistorial.DTOs;

public class HistorialTratamientoDto
{
    public int HistorialId { get; set; }
    public int UsuarioId { get; set; }
    public int ProfesionalId { get; set; }
    public string ProfesionalNombre { get; set; } = string.Empty;
    public int? TurnoId { get; set; }
    public string? Observaciones { get; set; }
    public string? Recomendaciones { get; set; }
    public DateTime Fecha { get; set; }
}

public class FidelizacionDto
{
    public int FidelizacionId { get; set; }
    public int UsuarioId { get; set; }
    public int EstampitasActuales { get; set; }
    public DateTime UltimaActualizacion { get; set; }
    public int EstampitasParaSiguientePremio => Math.Max(0, 10 - EstampitasActuales);
}

public class CuponCanjeadoDto
{
    public int CuponId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public decimal Descuento { get; set; }
    public DateTime FechaExpiracion { get; set; }
    public int EstampitasRestantes { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

public class QrFidelizacionDto
{
    public int QrTokenId { get; set; }
    public int PagoId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string QrSvg { get; set; } = string.Empty;
    public string QrImageDataUri { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaExpiracion { get; set; }
    public int MinutosValidez => 5;
    public double SegundosRestantes => Math.Max(0, (FechaExpiracion - DateTime.UtcNow).TotalSeconds);
}

public class ResultadoEscaneoQrDto
{
    public bool Exitoso { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public int EstampitasActuales { get; set; }
    public string Progreso => $"{EstampitasActuales}/10";
    public bool CicloCompletado { get; set; }
    public CuponCanjeadoDto? CuponGenerado { get; set; }
}

public class TarjetaFidelizacionDto
{
    public int UsuarioId { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public int EstampitasActuales { get; set; }
    public int MetaEstampitas => 10;
    public double PorcentajeProgreso => Math.Clamp((EstampitasActuales / 10.0) * 100, 0, 100);
    public DateTime UltimaActualizacion { get; set; }
    public IReadOnlyList<CuponCanjeadoDto> CuponesDisponibles { get; set; } = new List<CuponCanjeadoDto>();
    public IReadOnlyList<HistorialTratamientoDto> HistorialTratamientos { get; set; } = new List<HistorialTratamientoDto>();
}
