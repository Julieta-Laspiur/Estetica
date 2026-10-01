using Estetica.Domain.Exceptions;

namespace Estetica.Domain.ValueObjects;

public readonly record struct PuntosLealtad
{
    public int Cantidad { get; }

    public PuntosLealtad(int cantidad)
    {
        if (cantidad < 0)
        {
            throw new DomainException($"La cantidad de estampitas o puntos de lealtad no puede ser negativa ({cantidad}).");
        }

        Cantidad = cantidad;
    }

    public static PuntosLealtad Crear(int cantidad) => new(cantidad);
    public static PuntosLealtad Cero => new(0);

    public PuntosLealtad Sumar(int puntosAdicionales)
    {
        if (puntosAdicionales < 0)
        {
            throw new DomainException("No se pueden sumar puntos negativos.");
        }

        return new PuntosLealtad(Cantidad + puntosAdicionales);
    }

    public PuntosLealtad Canjear(int puntosACanjear)
    {
        if (puntosACanjear <= 0)
        {
            throw new DomainException("La cantidad de puntos a canjear debe ser mayor a cero.");
        }

        if (Cantidad < puntosACanjear)
        {
            throw new EstampitasInsuficientesException(Cantidad, puntosACanjear);
        }

        return new PuntosLealtad(Cantidad - puntosACanjear);
    }

    public bool TieneSuficientes(int puntosRequeridos) => Cantidad >= puntosRequeridos;

    public static PuntosLealtad operator +(PuntosLealtad a, PuntosLealtad b) => a.Sumar(b.Cantidad);
    public static PuntosLealtad operator -(PuntosLealtad a, PuntosLealtad b) => a.Canjear(b.Cantidad);

    public static bool operator >(PuntosLealtad a, PuntosLealtad b) => a.Cantidad > b.Cantidad;
    public static bool operator <(PuntosLealtad a, PuntosLealtad b) => a.Cantidad < b.Cantidad;
    public static bool operator >=(PuntosLealtad a, PuntosLealtad b) => a.Cantidad >= b.Cantidad;
    public static bool operator <=(PuntosLealtad a, PuntosLealtad b) => a.Cantidad <= b.Cantidad;

    public static implicit operator int(PuntosLealtad p) => p.Cantidad;
    public static explicit operator PuntosLealtad(int valor) => new(valor);

    public override string ToString() => $"{Cantidad} estampita{(Cantidad == 1 ? "" : "s")}";
}
