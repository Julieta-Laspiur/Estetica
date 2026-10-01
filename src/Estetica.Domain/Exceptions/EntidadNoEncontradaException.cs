namespace Estetica.Domain.Exceptions;

public class EntidadNoEncontradaException : DomainException
{
    public string NombreEntidad { get; }
    public object Clave { get; }

    public EntidadNoEncontradaException(string nombreEntidad, object clave)
        : base($"La entidad '{nombreEntidad}' con identificador ({clave}) no fue encontrada en el sistema.")
    {
        NombreEntidad = nombreEntidad;
        Clave = clave;
    }
}
