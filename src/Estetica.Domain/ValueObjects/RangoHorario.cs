using Estetica.Domain.Exceptions;

namespace Estetica.Domain.ValueObjects;

public readonly record struct RangoHorario
{
    public DateTime Inicio { get; }
    public DateTime Fin { get; }

    public TimeSpan Duracion => Fin - Inicio;
    public int DuracionMinutos => (int)Duracion.TotalMinutes;

    public RangoHorario(DateTime inicio, DateTime fin)
    {
        if (fin <= inicio)
        {
            throw new TurnoInvalidoException(
                $"La fecha y hora de fin ({fin:yyyy-MM-dd HH:mm}) debe ser posterior a la de inicio ({inicio:yyyy-MM-dd HH:mm}).");
        }

        Inicio = inicio;
        Fin = fin;
    }

    public static RangoHorario Crear(DateTime inicio, DateTime fin) => new(inicio, fin);

    public static RangoHorario DesdeInicioYDuracion(DateTime inicio, TimeSpan duracion) =>
        new(inicio, inicio + duracion);

    public static RangoHorario DesdeInicioYMinutos(DateTime inicio, int minutos)
    {
        if (minutos <= 0)
        {
            throw new TurnoInvalidoException("La duración en minutos debe ser mayor a cero.");
        }

        return new(inicio, inicio.AddMinutes(minutos));
    }

    /// <summary>
    /// Comprueba si este rango horario se solapa o interseca con otro rango horario.
    /// </summary>
    public bool SeSuperponeCon(RangoHorario otro) => Inicio < otro.Fin && Fin > otro.Inicio;

    /// <summary>
    /// Determina si una fecha/hora específica está contenida dentro del rango.
    /// </summary>
    public bool Contiene(DateTime fechaHora) => fechaHora >= Inicio && fechaHora < Fin;

    /// <summary>
    /// Determina si otro rango horario completo está contenido dentro de este rango.
    /// </summary>
    public bool Contiene(RangoHorario otro) => otro.Inicio >= Inicio && otro.Fin <= Fin;

    public override string ToString() => $"{Inicio:yyyy-MM-dd HH:mm} - {Fin:HH:mm} ({DuracionMinutos} min)";
}
