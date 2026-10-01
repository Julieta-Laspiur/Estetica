namespace Estetica.Domain.Exceptions;

public class EstampitasInsuficientesException : DomainException
{
    public int EstampitasDisponibles { get; }
    public int EstampitasRequeridas { get; }

    public EstampitasInsuficientesException(int disponibles, int requeridas)
        : base($"Cantidad de estampitas de fidelización insuficiente. Saldo disponible: {disponibles}, requeridas para el canje: {requeridas}.")
    {
        EstampitasDisponibles = disponibles;
        EstampitasRequeridas = requeridas;
    }
}
