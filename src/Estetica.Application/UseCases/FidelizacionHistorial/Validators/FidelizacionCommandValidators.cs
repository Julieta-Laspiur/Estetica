using Estetica.Application.UseCases.FidelizacionHistorial.Commands.CanjearCuponFidelizacion;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.EscanearQrFidelizacion;
using Estetica.Application.UseCases.FidelizacionHistorial.Commands.GenerarQrFidelizacion;
using FluentValidation;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Validators;

public class GenerarQrFidelizacionCommandValidator : AbstractValidator<GenerarQrFidelizacionCommand>
{
    public GenerarQrFidelizacionCommandValidator()
    {
        RuleFor(x => x.PagoId)
            .GreaterThan(0).WithMessage("El ID de pago debe ser válido.");
    }
}

public class EscanearQrFidelizacionCommandValidator : AbstractValidator<EscanearQrFidelizacionCommand>
{
    public EscanearQrFidelizacionCommandValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("El token QR escaneado no puede estar vacío.");

        RuleFor(x => x.UsuarioId)
            .GreaterThan(0).WithMessage("El identificador de usuario debe ser válido.")
            .When(x => x.UsuarioId.HasValue);
    }
}

public class CanjearCuponFidelizacionCommandValidator : AbstractValidator<CanjearCuponFidelizacionCommand>
{
    public CanjearCuponFidelizacionCommandValidator()
    {
        RuleFor(x => x.UsuarioId)
            .GreaterThan(0).WithMessage("El ID de usuario debe ser válido.");

        RuleFor(x => x.EstampitasACanjear)
            .GreaterThan(0).WithMessage("La cantidad de estampitas a canjear debe ser mayor a cero.");

        RuleFor(x => x.MontoDescuento)
            .GreaterThan(0).WithMessage("El monto de descuento debe ser mayor a cero.");
    }
}
