namespace Estetica.Application.UseCases.Turnos.DTOs;

public class DisponibilidadDto
{
    public DateTime FechaHoraInicio { get; set; }
    public DateTime FechaHoraFin { get; set; }
    public bool EstaDisponible { get; set; }
    public string? MotivoNoDisponible { get; set; }
}
