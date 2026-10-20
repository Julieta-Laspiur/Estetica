using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var emailNormalizado = request.Email.Trim().ToLowerInvariant();
        var usuario = await _unitOfWork.Usuarios.GetByEmailAsync(emailNormalizado, cancellationToken);

        // HU-02: Criterio de Aceptación: El sistema debe mostrar un mensaje genérico ante credenciales inválidas
        if (usuario == null)
        {
            throw new BusinessRuleException("Credenciales inválidas. Verifique su email y contraseña.");
        }

        // HU-02: Regla de Negocio: Solo los usuarios activos pueden iniciar sesión
        if (!usuario.Activo)
        {
            throw new BusinessRuleException("La cuenta de usuario se encuentra inhabilitada o inactiva. Comuníquese con la administración.");
        }

        // HU-02: Regla de Negocio: La cuenta se bloquea temporalmente luego de cinco intentos fallidos consecutivos
        if (usuario.Bloqueado)
        {
            // Desbloqueo temporal automático tras 15 minutos de ventana de seguridad
            if (usuario.FechaBloqueo.HasValue && DateTime.UtcNow > usuario.FechaBloqueo.Value.AddMinutes(15))
            {
                usuario.Bloqueado = false;
                usuario.IntentosFallidos = 0;
                usuario.FechaBloqueo = null;
                _unitOfWork.Usuarios.Update(usuario);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            else
            {
                var minutosRestantes = usuario.FechaBloqueo.HasValue
                    ? Math.Max(1, (int)Math.Ceiling((usuario.FechaBloqueo.Value.AddMinutes(15) - DateTime.UtcNow).TotalMinutes))
                    : 15;

                throw new BusinessRuleException($"La cuenta se encuentra bloqueada por seguridad debido a reiterados intentos fallidos (5). Intente nuevamente en {minutosRestantes} minuto(s) o solicite el desbloqueo a un administrador.");
            }
        }

        // Validar contraseña
        var passwordValido = _passwordHasher.Verify(request.Password, usuario.PasswordHash);

        if (!passwordValido)
        {
            usuario.IntentosFallidos++;

            if (usuario.IntentosFallidos >= 5)
            {
                usuario.Bloqueado = true;
                usuario.FechaBloqueo = DateTime.UtcNow;

                // Alerta administrativa de seguridad
                var admins = await _unitOfWork.Usuarios.GetByRolAsync(RolUsuario.Administrador, cancellationToken);
                foreach (var admin in admins)
                {
                    await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                    {
                        UsuarioId = admin.UsuarioId,
                        Mensaje = $"ALERTA DE SEGURIDAD: La cuenta '{usuario.Email}' ha sido bloqueada tras 5 intentos fallidos consecutivos de inicio de sesión.",
                        Tipo = TipoNotificacion.Sistema,
                        Leida = false,
                        Fecha = DateTime.UtcNow
                    }, cancellationToken);
                }

                _unitOfWork.Usuarios.Update(usuario);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                throw new BusinessRuleException("Credenciales inválidas. La cuenta ha sido bloqueada temporalmente por seguridad tras 5 intentos fallidos consecutivos.");
            }

            _unitOfWork.Usuarios.Update(usuario);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            throw new BusinessRuleException("Credenciales inválidas. Verifique su email y contraseña.");
        }

        // Éxito: Restablecer contador de intentos fallidos si correspondía
        if (usuario.IntentosFallidos > 0 || usuario.Bloqueado)
        {
            usuario.IntentosFallidos = 0;
            usuario.Bloqueado = false;
            usuario.FechaBloqueo = null;
            _unitOfWork.Usuarios.Update(usuario);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var token = _jwtTokenGenerator.GenerateToken(usuario);

        return new AuthResponseDto
        {
            Token = token,
            Usuario = new UsuarioDto
            {
                UsuarioId = usuario.UsuarioId,
                Nombre = usuario.Nombre,
                Apellido = usuario.Apellido,
                Email = usuario.Email,
                Telefono = usuario.Telefono,
                Rol = usuario.Rol,
                FechaRegistro = usuario.FechaRegistro,
                Activo = usuario.Activo,
                Bloqueado = usuario.Bloqueado,
                IntentosFallidos = usuario.IntentosFallidos,
                FechaBloqueo = usuario.FechaBloqueo
            }
        };
    }
}
