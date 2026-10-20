using Estetica.Application.UseCases.Turnos.Commands.AgendarTurno;
using Estetica.Application.UseCases.Turnos.Commands.BloquearHorarioAgenda;
using Estetica.Application.UseCases.Turnos.Commands.CancelarTurno;
using Estetica.Application.UseCases.Turnos.Commands.ReprogramarTurno;
using FluentValidation;

namespace Estetica.Application.UseCases.Turnos.Validators;

public class AgendarTurnoCommandValidator : AbstractValidator<AgendarTurnoCommand>
{
    public AgendarTurnoCommandValidator()
    {
        RuleFor(x => x.UsuarioId)
            .GreaterThan(0).WithMessage("El identificador del cliente debe ser válido.");

        RuleFor(x => x.ProfesionalId)
            .GreaterThan(0).WithMessage("Debe seleccionar un profesional válido.");

        RuleFor(x => x.CabinaId)
            .GreaterThan(0).WithMessage("Debe asignar una cabina válida.");

        RuleFor(x => x.ServicioIds)
            .NotEmpty().WithMessage("Debe seleccionar al menos un servicio estético para agendar.");

        RuleFor(x => x.FechaHoraInicio)
            .GreaterThan(DateTime.UtcNow.AddMinutes(-5))
            .WithMessage("La fecha y hora del turno debe ser en el futuro.");
    }
}

public class CancelarTurnoCommandValidator : AbstractValidator<CancelarTurnoCommand>
{
    public CancelarTurnoCommandValidator()
    {
        RuleFor(x => x.TurnoId)
            .GreaterThan(0).WithMessage("El identificador del turno debe ser válido.");
    }
}

public class ReprogramarTurnoCommandValidator : AbstractValidator<ReprogramarTurnoCommand>
{
    public ReprogramarTurnoCommandValidator()
    {
        RuleFor(x => x.TurnoId)
            .GreaterThan(0).WithMessage("El identificador del turno debe ser válido.");

        RuleFor(x => x.NuevaFechaHoraInicio)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("La nueva fecha y hora del turno debe ser a futuro.");
    }
}

public class BloquearHorarioAgendaCommandValidator : AbstractValidator<BloquearHorarioAgendaCommand>
{
    public BloquearHorarioAgendaCommandValidator()
    {
        RuleFor(x => x.ProfesionalId)
            .GreaterThan(0).WithMessage("Debe indicar el profesional a bloquear.");

        RuleFor(x => x.CabinaId)
            .GreaterThan(0).WithMessage("Debe indicar la cabina a bloquear.");

        RuleFor(x => x.FechaHoraFin)
            .GreaterThan(x => x.FechaHoraInicio)
            .WithMessage("La fecha/hora de fin del bloqueo debe ser posterior a la de inicio.");

        RuleFor(x => x.Motivo)
            .NotEmpty().WithMessage("Debe especificar el motivo del bloqueo de agenda.")
            .MaximumLength(200).WithMessage("El motivo no puede superar los 200 caracteres.");
    }
}
