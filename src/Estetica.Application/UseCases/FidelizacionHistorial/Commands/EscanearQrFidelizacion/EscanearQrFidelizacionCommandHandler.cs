using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.EscanearQrFidelizacion;

public class EscanearQrFidelizacionCommandHandler : IRequestHandler<EscanearQrFidelizacionCommand, ResultadoEscaneoQrDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public EscanearQrFidelizacionCommandHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ResultadoEscaneoQrDto> Handle(EscanearQrFidelizacionCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            throw new BusinessRuleException("El token del código QR no puede estar vacío.");
        }

        var qrToken = await _unitOfWork.QrTokens.GetByTokenAsync(request.Token.Trim(), cancellationToken);
        if (qrToken == null)
        {
            throw new NotFoundException("Código QR de fidelización no encontrado o no emitido por este centro.");
        }

        if (qrToken.Usado)
        {
            throw new BusinessRuleException("Este código QR ya fue utilizado anteriormente. Los códigos son de uso único.");
        }

        if (DateTime.UtcNow > qrToken.FechaExpiracion)
        {
            throw new BusinessRuleException(
                $"El código QR ha expirado. Su validez es de 5 minutos desde la emisión (Expiró a las {qrToken.FechaExpiracion:HH:mm:ss} UTC).");
        }

        // Determinar a qué usuario corresponde la estampita:
        // Si el QR está asociado a un Pago de un Turno, el beneficiario es SIEMPRE el cliente de ese Turno
        int usuarioId = 0;
        if (qrToken.Pago != null && qrToken.Pago.TurnoId.HasValue)
        {
            var turno = await _unitOfWork.Turnos.GetByIdAsync(qrToken.Pago.TurnoId.Value, cancellationToken);
            if (turno != null)
            {
                usuarioId = turno.UsuarioId;
            }
        }
        else if (qrToken.Pago != null && qrToken.Pago.OrdenId.HasValue)
        {
            var orden = await _unitOfWork.OrdenesCompra.GetByIdAsync(qrToken.Pago.OrdenId.Value, cancellationToken);
            if (orden != null)
            {
                usuarioId = orden.UsuarioId;
            }
        }

        // Si no se dedujo del turno/orden, verificar si se especificó explícitamente en el request
        if (usuarioId == 0)
        {
            usuarioId = request.UsuarioId ?? 0;
        }

        // Fallback final: si fue el propio cliente quien escaneó su propio QR
        if (usuarioId == 0)
        {
            usuarioId = _currentUserService.UsuarioId ?? 0;
        }

        if (usuarioId == 0)
        {
            throw new BusinessRuleException(
                "No se pudo determinar el cliente beneficiario para acreditar la estampita de fidelización.");
        }

        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(usuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", usuarioId);
        }

        // Marcar el QR como usado (One-Time Token)
        qrToken.Usado = true;
        _unitOfWork.QrTokens.Update(qrToken);

        // Obtener o inicializar la tarjeta de fidelización del cliente
        var fidelizacion = await _unitOfWork.Fidelizaciones.GetByUsuarioIdAsync(usuarioId, cancellationToken);
        if (fidelizacion == null)
        {
            fidelizacion = new Fidelizacion
            {
                UsuarioId = usuarioId,
                EstampitasActuales = 0,
                UltimaActualizacion = DateTime.UtcNow
            };
            await _unitOfWork.Fidelizaciones.AddAsync(fidelizacion, cancellationToken);
        }

        fidelizacion.EstampitasActuales += 1;
        fidelizacion.UltimaActualizacion = DateTime.UtcNow;

        bool cicloCompletado = false;
        CuponCanjeadoDto? cuponDto = null;

        // Regla HU-13 y RF-11: Al alcanzar 10 estampitas, la tarjeta se reinicia a 0 y se genera un cupón automáticamente
        if (fidelizacion.EstampitasActuales >= 10)
        {
            cicloCompletado = true;
            fidelizacion.EstampitasActuales -= 10;

            var codigoCupon = $"PREMIO-{Guid.NewGuid().ToString()[..6].ToUpper()}";
            var fechaExpiracion = DateTime.UtcNow.AddDays(30);

            var cupon = new Cupon
            {
                UsuarioId = usuarioId,
                Codigo = codigoCupon,
                Descuento = 20, // 20% de descuento de recompensa por completar las 10 estampitas
                Estado = EstadoCupon.Activo,
                FechaExpiracion = fechaExpiracion
            };

            await _unitOfWork.Cupones.AddAsync(cupon, cancellationToken);

            cuponDto = new CuponCanjeadoDto
            {
                CuponId = cupon.CuponId,
                Codigo = cupon.Codigo,
                Descuento = cupon.Descuento,
                FechaExpiracion = cupon.FechaExpiracion,
                EstampitasRestantes = fidelizacion.EstampitasActuales,
                Mensaje = $"¡Felicitaciones! Has completado tu cuponera de 10 estampitas. Se ha generado tu cupón '{codigoCupon}'."
            };

            await _unitOfWork.Notificaciones.AddAsync(new Notificacion
            {
                UsuarioId = usuarioId,
                Mensaje = $"¡Completaste tu cuponera de 10 estampitas! Canje automático realizado: cupón '{codigoCupon}' del 20% listo para usar.",
                Tipo = TipoNotificacion.Promocion,
                Leida = false,
                Fecha = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            await _unitOfWork.Notificaciones.AddAsync(new Notificacion
            {
                UsuarioId = usuarioId,
                Mensaje = $"¡Sumaste 1 estampita digital! Tu tarjeta virtual ahora tiene {fidelizacion.EstampitasActuales}/10 estampitas.",
                Tipo = TipoNotificacion.Promocion,
                Leida = false,
                Fecha = DateTime.UtcNow
            }, cancellationToken);
        }

        _unitOfWork.Fidelizaciones.Update(fidelizacion);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ResultadoEscaneoQrDto
        {
            Exitoso = true,
            ClienteNombre = $"{usuario.Nombre} {usuario.Apellido}",
            EstampitasActuales = fidelizacion.EstampitasActuales,
            CicloCompletado = cicloCompletado,
            CuponGenerado = cuponDto,
            Mensaje = cicloCompletado
                ? $"¡Felicitaciones! {usuario.Nombre} {usuario.Apellido} completó 10 estampitas y ganó el cupón '{cuponDto?.Codigo}'. Tarjeta reiniciada a {fidelizacion.EstampitasActuales}/10."
                : $"¡Estampita acreditada con éxito para {usuario.Nombre} {usuario.Apellido}! Progreso actual: {fidelizacion.EstampitasActuales}/10 estampitas."
        };
    }
}
