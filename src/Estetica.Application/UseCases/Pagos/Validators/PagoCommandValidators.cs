using Estetica.Application.UseCases.Pagos.Commands.RegistrarPagoPresencial;
using FluentValidation;

namespace Estetica.Application.UseCases.Pagos.Validators;

public class RegistrarPagoPresencialCommandValidator : AbstractValidator<RegistrarPagoPresencialCommand>
{
    public RegistrarPagoPresencialCommandValidator()
    {
        RuleFor(x => x)
            .Must(x => x.TurnoId.HasValue || x.OrdenId.HasValue)
            .WithMessage("Debe asociar el pago a un Turno o a una Orden de Compra.");

        RuleFor(x => x.NotasComprobante)
            .MaximumLength(300).WithMessage("Las notas del comprobante no pueden superar 300 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.NotasComprobante));
    }
}
