using Estetica.Domain.Exceptions;

namespace Estetica.Domain.ValueObjects;

public readonly record struct PorcentajeDescuento
{
    public decimal Valor { get; }

    public decimal FactorDecimal => Valor / 100m;

    public PorcentajeDescuento(decimal valor)
    {
        if (valor < 0m || valor > 100m)
        {
            throw new DomainException($"El porcentaje de descuento debe estar entre 0% y 100% (recibido: {valor}%).");
        }

        Valor = decimal.Round(valor, 2, MidpointRounding.AwayFromZero);
    }

    public static PorcentajeDescuento Crear(decimal valor) => new(valor);
    public static PorcentajeDescuento Cero => new(0m);
    public static PorcentajeDescuento Total => new(100m);

    /// <summary>
    /// Calcula el importe monetario correspondiente al descuento.
    /// </summary>
    public decimal CalcularMontoDescuento(decimal montoTotal)
    {
        if (montoTotal < 0m)
        {
            throw new DomainException("El importe base para aplicar descuento no puede ser negativo.");
        }

        return decimal.Round(montoTotal * FactorDecimal, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Calcula el descuento sobre un objeto Dinero manteniendo la misma moneda.
    /// </summary>
    public Dinero CalcularMontoDescuento(Dinero dinero) =>
        new(CalcularMontoDescuento(dinero.Monto), dinero.Moneda);

    /// <summary>
    /// Devuelve el importe final resultante tras aplicar el descuento.
    /// </summary>
    public decimal AplicarA(decimal montoTotal)
    {
        var descuento = CalcularMontoDescuento(montoTotal);
        return Math.Max(0m, montoTotal - descuento);
    }

    /// <summary>
    /// Devuelve el Dinero final resultante tras aplicar el descuento.
    /// </summary>
    public Dinero AplicarA(Dinero dinero) =>
        new(AplicarA(dinero.Monto), dinero.Moneda);

    public static implicit operator decimal(PorcentajeDescuento p) => p.Valor;
    public static explicit operator PorcentajeDescuento(decimal valor) => new(valor);

    public override string ToString() => $"{Valor:G29}%";
}
