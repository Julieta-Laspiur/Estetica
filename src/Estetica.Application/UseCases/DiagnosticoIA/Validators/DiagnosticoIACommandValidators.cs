using Estetica.Application.UseCases.DiagnosticoIA.Commands.ConsultarAsistenteIA;
using Estetica.Application.UseCases.DiagnosticoIA.Commands.RegistrarDiagnosticoPiel;
using FluentValidation;

namespace Estetica.Application.UseCases.DiagnosticoIA.Validators;

public class ConsultarAsistenteIACommandValidator : AbstractValidator<ConsultarAsistenteIACommand>
{
    public ConsultarAsistenteIACommandValidator()
    {
        RuleFor(x => x.UsuarioId)
            .GreaterThan(0).WithMessage("El identificador del usuario debe ser válido.");

        RuleFor(x => x.Pregunta)
            .NotEmpty().WithMessage("La consulta hacia el asistente no puede estar vacía.")
            .MaximumLength(1000).WithMessage("La consulta no puede exceder los 1000 caracteres.");
    }
}

public class RegistrarDiagnosticoPielCommandValidator : AbstractValidator<RegistrarDiagnosticoPielCommand>
{
    public RegistrarDiagnosticoPielCommandValidator()
    {
        RuleFor(x => x.UsuarioId)
            .GreaterThan(0).WithMessage("El identificador del usuario debe ser válido.");

        RuleFor(x => x.Resultado)
            .NotEmpty().WithMessage("El resultado u observación del diagnóstico no puede estar vacío.")
            .MaximumLength(500).WithMessage("El resultado no puede exceder los 500 caracteres.");

        RuleFor(x => x.Alergias)
            .MaximumLength(300).WithMessage("La lista de alergias no puede exceder los 300 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.Alergias));
    }
}
