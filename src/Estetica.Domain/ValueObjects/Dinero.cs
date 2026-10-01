using Estetica.Domain.Exceptions;

namespace Estetica.Domain.ValueObjects;

public readonly record struct Dinero
{
    public decimal Monto { get; }
    public string Moneda { get; }

    public Dinero(decimal monto, string moneda = "ARS")
    {
        if (monto < 0)
        {
            throw new DomainException($"El importe de dinero no puede ser negativo ({monto}).");
        }

        if (string.IsNullOrWhiteSpace(moneda))
        {
            throw new DomainException("La moneda no puede estar vacía.");
        }

        Monto = decimal.Round(monto, 2, MidpointRounding.AwayFromZero);
        Moneda = moneda.Trim().ToUpperInvariant();
    }

    public static Dinero Crear(decimal monto, string moneda = "ARS") => new(monto, moneda);
    public static Dinero Cero(string moneda = "ARS") => new(0m, moneda);

    public static Dinero operator +(Dinero a, Dinero b)
    {
        ValidarMismaMoneda(a, b);
        return new Dinero(a.Monto + b.Monto, a.Moneda);
    }

    public static Dinero operator -(Dinero a, Dinero b)
    {
        ValidarMismaMoneda(a, b);
        return new Dinero(Math.Max(0m, a.Monto - b.Monto), a.Moneda);
    }

    public static Dinero operator *(Dinero a, int factor)
    {
        if (factor < 0) throw new DomainException("No se puede multiplicar dinero por un factor negativo.");
        return new Dinero(a.Monto * factor, a.Moneda);
    }

    public static Dinero operator *(Dinero a, decimal factor)
    {
        if (factor < 0) throw new DomainException("No se puede multiplicar dinero por un factor negativo.");
        return new Dinero(a.Monto * factor, a.Moneda);
    }

    public static bool operator >(Dinero a, Dinero b)
    {
        ValidarMismaMoneda(a, b);
        return a.Monto > b.Monto;
    }

    public static bool operator <(Dinero a, Dinero b)
    {
        ValidarMismaMoneda(a, b);
        return a.Monto < b.Monto;
    }

    public static bool operator >=(Dinero a, Dinero b)
    {
        ValidarMismaMoneda(a, b);
        return a.Monto >= b.Monto;
    }

    public static bool operator <=(Dinero a, Dinero b)
    {
        ValidarMismaMoneda(a, b);
        return a.Monto <= b.Monto;
    }

    private static void ValidarMismaMoneda(Dinero a, Dinero b)
    {
        if (a.Moneda != b.Moneda)
        {
            throw new DomainException($"No se pueden operar importes con diferentes monedas: '{a.Moneda}' y '{b.Moneda}'.");
        }
    }

    public override string ToString() => $"{Moneda} ${Monto:F2}";
}
