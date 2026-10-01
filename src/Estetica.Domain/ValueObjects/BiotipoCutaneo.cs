using Estetica.Domain.Enums;
using Estetica.Domain.Exceptions;

namespace Estetica.Domain.ValueObjects;

public readonly record struct BiotipoCutaneo
{
    public TipoPielEnum Valor { get; }

    public string Nombre => Valor.ToString();
    public string Descripcion => ObtenerDescripcion(Valor);

    public BiotipoCutaneo(TipoPielEnum valor)
    {
        if (!Enum.IsDefined(typeof(TipoPielEnum), valor))
        {
            throw new DomainException($"El valor '{valor}' no corresponde a un biotipo cutáneo válido.");
        }

        Valor = valor;
    }

    public static BiotipoCutaneo Grasa => new(TipoPielEnum.Grasa);
    public static BiotipoCutaneo Seca => new(TipoPielEnum.Seca);
    public static BiotipoCutaneo Mixta => new(TipoPielEnum.Mixta);
    public static BiotipoCutaneo Sensible => new(TipoPielEnum.Sensible);
    public static BiotipoCutaneo Normal => new(TipoPielEnum.Normal);

    public static BiotipoCutaneo DesdeEnum(TipoPielEnum tipo) => new(tipo);

    public static BiotipoCutaneo DesdeString(string? tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo))
        {
            throw new DomainException("El biotipo cutáneo no puede estar vacío.");
        }

        if (Enum.TryParse<TipoPielEnum>(tipo.Trim(), ignoreCase: true, out var resultado) &&
            Enum.IsDefined(typeof(TipoPielEnum), resultado))
        {
            return new BiotipoCutaneo(resultado);
        }

        var permitidos = string.Join(", ", Enum.GetNames<TipoPielEnum>());
        throw new DomainException($"El biotipo cutáneo '{tipo}' no es válido. Opciones disponibles: {permitidos}.");
    }

    /// <summary>
    /// Verifica si este biotipo es apto para un producto o servicio formulado para un tipo de piel específico.
    /// Si el producto es para piel Normal o universal, es apto para todos.
    /// </summary>
    public bool EsCompatibleCon(TipoPielEnum tipoRequerido) =>
        Valor == tipoRequerido || tipoRequerido == TipoPielEnum.Normal;

    public bool RequiereProtocoloHipoalergenico => Valor == TipoPielEnum.Sensible;

    private static string ObtenerDescripcion(TipoPielEnum tipo) => tipo switch
    {
        TipoPielEnum.Grasa => "Piel con exceso de sebo, brillo visible y poros dilatados.",
        TipoPielEnum.Seca => "Piel con baja producción de lípidos, sensación de tirantez y descamación.",
        TipoPielEnum.Mixta => "Piel con zona T oleosa (frente, nariz, mentón) y mejillas secas o normales.",
        TipoPielEnum.Sensible => "Piel reactiva, propensa a rojeces, irritación y alergias.",
        TipoPielEnum.Normal => "Piel equilibrada, con buena hidratación y textura uniforme.",
        _ => "Biotipo no especificado."
    };

    public static implicit operator TipoPielEnum(BiotipoCutaneo biotipo) => biotipo.Valor;
    public static implicit operator string(BiotipoCutaneo biotipo) => biotipo.Valor.ToString();
    public static explicit operator BiotipoCutaneo(string valor) => DesdeString(valor);
    public static explicit operator BiotipoCutaneo(TipoPielEnum valor) => new(valor);

    public override string ToString() => Valor.ToString();
}
