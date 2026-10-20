namespace Estetica.Application.UseCases.Servicios.DTOs;

public class ServicioEliminadoResultadoDto
{
    public int ServicioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool BorradoFisico { get; set; }
    public bool DeshabilitadoLogicamente { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}
