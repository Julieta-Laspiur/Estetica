using Estetica.Application.UseCases.Productos.Commands.ActualizarStockProducto;
using Estetica.Application.UseCases.Productos.Commands.AjustarStockGerencial;
using Estetica.Application.UseCases.Productos.Commands.ConfigurarStockMinimo;
using FluentValidation;

namespace Estetica.Application.UseCases.Productos.Validators;

public class AjustarStockGerencialCommandValidator : AbstractValidator<AjustarStockGerencialCommand>
{
    public AjustarStockGerencialCommandValidator()
    {
        RuleFor(x => x.ProductoId)
            .GreaterThan(0).WithMessage("El identificador del producto debe ser válido.");

        RuleFor(x => x.Cantidad)
            .GreaterThanOrEqualTo(0).WithMessage("La cantidad a ajustar no puede ser un valor negativo.");

        RuleFor(x => x.Motivo)
            .MaximumLength(250).WithMessage("El motivo no puede exceder los 250 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.Motivo));
    }
}

public class ConfigurarStockMinimoCommandValidator : AbstractValidator<ConfigurarStockMinimoCommand>
{
    public ConfigurarStockMinimoCommandValidator()
    {
        RuleFor(x => x.ProductoId)
            .GreaterThan(0).WithMessage("El identificador del producto debe ser válido.");

        RuleFor(x => x.NuevoStockMinimo)
            .GreaterThanOrEqualTo(0).WithMessage("El umbral de stock mínimo no puede ser negativo.");
    }
}

public class ActualizarStockProductoCommandValidator : AbstractValidator<ActualizarStockProductoCommand>
{
    public ActualizarStockProductoCommandValidator()
    {
        RuleFor(x => x.ProductoId)
            .GreaterThan(0).WithMessage("El identificador del producto debe ser válido.");

        RuleFor(x => x.CantidadADescontar)
            .GreaterThan(0).WithMessage("La cantidad a descontar debe ser mayor a cero.");
    }
}
