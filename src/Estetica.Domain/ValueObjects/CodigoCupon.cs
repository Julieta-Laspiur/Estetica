using System.Text.RegularExpressions;
using Estetica.Domain.Exceptions;

namespace Estetica.Domain.ValueObjects;

public readonly record struct CodigoCupon
{
    private static readonly Regex CodigoRegex = new(
        @"^[A-Z0-9_-]{3,30}$",
        RegexOptions.Compiled);

    public string Valor { get; }

    public CodigoCupon(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            throw new CuponInvalidoException(valor ?? string.Empty, "El código del cupón no puede estar vacío.");
        }

        var valorNormalizado = valor.Trim().ToUpperInvariant();

        if (valorNormalizado.Length < 3 || valorNormalizado.Length > 30)
        {
            throw new CuponInvalidoException(valor, "El código debe tener entre 3 y 30 caracteres.");
        }

        if (!CodigoRegex.IsMatch(valorNormalizado))
        {
            throw new CuponInvalidoException(
                valor,
                "El código solo puede contener letras mayúsculas, números y los caracteres '-' o '_'.");
        }

        Valor = valorNormalizado;
    }

    public static CodigoCupon Crear(string valor) => new(valor);

    public static implicit operator string(CodigoCupon cupon) => cupon.Valor;
    public static explicit operator CodigoCupon(string valor) => new(valor);

    public override string ToString() => Valor;
}
