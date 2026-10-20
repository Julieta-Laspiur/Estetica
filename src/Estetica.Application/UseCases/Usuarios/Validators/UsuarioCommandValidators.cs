using Estetica.Application.UseCases.Usuarios.Commands.ActualizarPerfil;
using Estetica.Application.UseCases.Usuarios.Commands.Login;
using Estetica.Application.UseCases.Usuarios.Commands.RegistrarUsuario;
using FluentValidation;

namespace Estetica.Application.UseCases.Usuarios.Validators;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es requerido.")
            .EmailAddress().WithMessage("El formato del correo electrónico es inválido.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("La contraseña es requerida.");
    }
}

public class RegistrarUsuarioCommandValidator : AbstractValidator<RegistrarUsuarioCommand>
{
    public RegistrarUsuarioCommandValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre no puede exceder 100 caracteres.");

        RuleFor(x => x.Apellido)
            .NotEmpty().WithMessage("El apellido es obligatorio.")
            .MaximumLength(100).WithMessage("El apellido no puede exceder 100 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .EmailAddress().WithMessage("Debe proporcionar una dirección de correo electrónico válida.")
            .MaximumLength(150).WithMessage("El correo electrónico no puede exceder 150 caracteres.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("La contraseña es obligatoria.")
            .MinimumLength(6).WithMessage("La contraseña debe poseer al menos 6 caracteres.");

        RuleFor(x => x.Telefono)
            .MaximumLength(30).WithMessage("El teléfono no puede superar los 30 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.Telefono));
    }
}

public class ActualizarPerfilCommandValidator : AbstractValidator<ActualizarPerfilCommand>
{
    public ActualizarPerfilCommandValidator()
    {
        RuleFor(x => x.UsuarioId)
            .GreaterThan(0).WithMessage("El ID de usuario debe ser un identificador válido.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre no puede estar vacío.")
            .MaximumLength(100).WithMessage("El nombre no puede exceder 100 caracteres.");

        RuleFor(x => x.Apellido)
            .NotEmpty().WithMessage("El apellido no puede estar vacío.")
            .MaximumLength(100).WithMessage("El apellido no puede exceder 100 caracteres.");

        RuleFor(x => x.Telefono)
            .MaximumLength(30).WithMessage("El teléfono no puede superar los 30 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.Telefono));
    }
}
