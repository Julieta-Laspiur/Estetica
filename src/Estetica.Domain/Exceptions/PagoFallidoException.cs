namespace Estetica.Domain.Exceptions;

public class PagoFallidoException : DomainException
{
    public string? ReferenciaExterna { get; }
    public decimal Monto { get; }

    public PagoFallidoException(string mensaje, string? referenciaExterna = null, decimal monto = 0)
        : base(mensaje)
    {
        ReferenciaExterna = referenciaExterna;
        Monto = monto;
    }
}
