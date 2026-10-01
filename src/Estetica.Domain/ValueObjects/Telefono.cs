using System.Text.RegularExpressions;
using Estetica.Domain.Exceptions;

namespace Estetica.Domain.ValueObjects;

public readonly record struct Telefono
{
    private static readonly Regex TelefonoRegex = new(
        @"^[\+]?[(]?[0-9]{2,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,6}$",
        RegexOptions.Compiled);

    public string Valor { get; }

    public Telefono(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            throw new DomainException("El número de teléfono no puede estar vacío.");
        }

        var valorLimpio = valor.Trim();

        if (valorLimpio.Length < 6 || valorLimpio.Length > 20)
        {
            throw new DomainException("El número de teléfono debe contener entre 6 y 20 caracteres.");
        }

        if (!TelefonoRegex.IsMatch(valorLimpio))
        {
            throw new DomainException($"El formato del teléfono '{valor}' es inválido.");
        }

        Valor = valorLimpio;
    }

    public static Telefono Crear(string valor) => new(valor);

    public static implicit operator string(Telefono telefono) => telefono.Valor;
    public static explicit operator Telefono(string valor) => new(valor);

    public override string ToString() => Valor;
}
