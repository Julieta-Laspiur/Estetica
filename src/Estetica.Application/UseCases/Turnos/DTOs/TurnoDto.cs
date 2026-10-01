using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.Turnos.DTOs;

public class TurnoDto
{
    public int TurnoId { get; set; }
    public int UsuarioId { get; set; }
    public string ClienteNombreCompleto { get; set; } = string.Empty;
    public int ProfesionalId { get; set; }
    public string ProfesionalNombreCompleto { get; set; } = string.Empty;
    public int CabinaId { get; set; }
    public string CabinaNombre { get; set; } = string.Empty;
    public DateTime FechaHoraInicio { get; set; }
    public DateTime FechaHoraFin { get; set; }
    public EstadoTurno Estado { get; set; }
    public decimal Total { get; set; }
    public List<ServicioResumenDto> Servicios { get; set; } = new();
}
