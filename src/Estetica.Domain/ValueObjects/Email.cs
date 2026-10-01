using System.Text.RegularExpressions;
using Estetica.Domain.Exceptions;

namespace Estetica.Domain.ValueObjects;

public readonly record struct Email
{
    private static readonly Regex EmailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public string Valor { get; }

    public Email(string valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            throw new DomainException("El correo electrónico no puede estar vacío.");
        }

        var valorLimpio = valor.Trim().ToLowerInvariant();

        if (valorLimpio.Length > 255)
        {
            throw new DomainException("El correo electrónico no puede superar los 255 caracteres.");
        }

        if (!EmailRegex.IsMatch(valorLimpio))
        {
            throw new DomainException($"El formato del correo electrónico '{valor}' es inválido.");
        }

        Valor = valorLimpio;
    }

    public static Email Crear(string valor) => new(valor);

    public static implicit operator string(Email email) => email.Valor;
    public static explicit operator Email(string valor) => new(valor);

    public override string ToString() => Valor;
}
