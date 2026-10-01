namespace Estetica.Application.UseCases.Turnos.DTOs;

public class ServicioResumenDto
{
    public int ServicioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int DuracionMin { get; set; }
}
