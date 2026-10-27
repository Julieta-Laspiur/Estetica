namespace Estetica.Application.UseCases.Turnos.DTOs;

public class CabinaDto
{
    public int CabinaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Estado { get; set; } = string.Empty;
}
