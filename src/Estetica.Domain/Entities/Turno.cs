using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class Turno
{
    public int TurnoId { get; set; }
    public int UsuarioId { get; set; }
    public int ProfesionalId { get; set; }
    public int CabinaId { get; set; }
    public DateTime FechaHoraInicio { get; set; }
    public DateTime FechaHoraFin { get; set; }
    public EstadoTurno Estado { get; set; } = EstadoTurno.Pendiente;
    public decimal Total { get; set; }

    // Relaciones de navegación
    public Usuario Usuario { get; set; } = null!;
    public Profesional Profesional { get; set; } = null!;
    public Cabina Cabina { get; set; } = null!;
    public ICollection<TurnoServicio> TurnoServicios { get; set; } = new List<TurnoServicio>();
    public ICollection<HistorialTratamiento> HistorialesTratamiento { get; set; } = new List<HistorialTratamiento>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
