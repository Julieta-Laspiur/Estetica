namespace Estetica.Domain.Exceptions;

public class HorarioNoDisponibleException : DomainException
{
    public string RecursoOcupado { get; }
    public DateTime FechaHoraInicio { get; }
    public DateTime FechaHoraFin { get; }

    public HorarioNoDisponibleException(string recursoOcupado, DateTime inicio, DateTime fin)
        : base($"El recurso '{recursoOcupado}' no tiene disponibilidad en el rango horario seleccionado: {inicio:dd/MM/yyyy HH:mm} - {fin:HH:mm}.")
    {
        RecursoOcupado = recursoOcupado;
        FechaHoraInicio = inicio;
        FechaHoraFin = fin;
    }
}
