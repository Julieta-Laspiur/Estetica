namespace Estetica.Application.UseCases.Productos.DTOs;

public class ServicioDetalleDto
{
    public int ServicioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int DuracionMin { get; set; }
    public bool Activo { get; set; }
}
