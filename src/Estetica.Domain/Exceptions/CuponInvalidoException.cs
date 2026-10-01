namespace Estetica.Domain.Exceptions;

public class CuponInvalidoException : DomainException
{
    public string CodigoCupon { get; }

    public CuponInvalidoException(string codigoCupon, string motivo)
        : base($"El cupón de descuento '{codigoCupon}' no es válido: {motivo}")
    {
        CodigoCupon = codigoCupon;
    }
}
