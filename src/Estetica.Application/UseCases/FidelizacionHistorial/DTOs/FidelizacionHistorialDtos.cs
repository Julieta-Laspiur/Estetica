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
