using Estetica.Application.UseCases.Servicios.Commands.ActualizarServicio;
using Estetica.Application.UseCases.Servicios.Commands.CrearServicio;
using FluentValidation;

namespace Estetica.Application.UseCases.Servicios.Validators;

public class CrearServicioCommandValidator : AbstractValidator<CrearServicioCommand>
{
    public CrearServicioCommandValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del servicio no puede estar vacío.")
            .MaximumLength(150).WithMessage("El nombre del servicio no puede superar los 150 caracteres.");

        RuleFor(x => x.Precio)
            .GreaterThanOrEqualTo(0).WithMessage("El precio del servicio no puede ser negativo.");

        RuleFor(x => x.DuracionMin)
            .GreaterThan(0).WithMessage("La duración del servicio debe ser mayor a cero minutos.")
            .LessThanOrEqualTo(480).WithMessage("La duración del servicio no puede superar los 480 minutos (8 horas).");
    }
}

public class ActualizarServicioCommandValidator : AbstractValidator<ActualizarServicioCommand>
{
    public ActualizarServicioCommandValidator()
    {
        RuleFor(x => x.ServicioId)
            .GreaterThan(0).WithMessage("El ID del servicio debe ser un número entero positivo.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del servicio no puede estar vacío.")
            .MaximumLength(150).WithMessage("El nombre del servicio no puede superar los 150 caracteres.");

        RuleFor(x => x.Precio)
            .GreaterThanOrEqualTo(0).WithMessage("El precio del servicio no puede ser negativo.");

        RuleFor(x => x.DuracionMin)
            .GreaterThan(0).WithMessage("La duración del servicio debe ser mayor a cero minutos.")
            .LessThanOrEqualTo(480).WithMessage("La duración del servicio no puede superar los 480 minutos (8 horas).");
    }
}
