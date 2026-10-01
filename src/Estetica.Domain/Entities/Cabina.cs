using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class Cabina
{
    public int CabinaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public EstadoCabina Estado { get; set; } = EstadoCabina.Disponible;

    // Relaciones de navegación
    public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
}
