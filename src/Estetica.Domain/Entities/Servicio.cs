namespace Estetica.Domain.Entities;

public class Servicio
{
    public int ServicioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int DuracionMin { get; set; }
    public bool Activo { get; set; } = true;

    // Relaciones de navegación
    public ICollection<TurnoServicio> TurnoServicios { get; set; } = new List<TurnoServicio>();
}
