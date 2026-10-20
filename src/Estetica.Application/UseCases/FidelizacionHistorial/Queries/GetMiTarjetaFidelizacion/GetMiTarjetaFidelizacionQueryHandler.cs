using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Queries.GetMiTarjetaFidelizacion;

public class GetMiTarjetaFidelizacionQueryHandler : IRequestHandler<GetMiTarjetaFidelizacionQuery, TarjetaFidelizacionDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public GetMiTarjetaFidelizacionQueryHandler(
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<TarjetaFidelizacionDto> Handle(GetMiTarjetaFidelizacionQuery request, CancellationToken cancellationToken)
    {
        int usuarioId = request.UsuarioId ?? _currentUserService.UsuarioId ?? 0;
        if (usuarioId == 0)
        {
            throw new BusinessRuleException("Debe especificarse el identificador del usuario para consultar su tarjeta de fidelización.");
        }

        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(usuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", usuarioId);
        }

        var fidelizacion = await _unitOfWork.Fidelizaciones.GetByUsuarioIdAsync(usuarioId, cancellationToken);
        var cupones = await _unitOfWork.Cupones.GetActivosByUsuarioIdAsync(usuarioId, cancellationToken);
        var historiales = await _unitOfWork.HistorialesTratamiento.GetByUsuarioIdAsync(usuarioId, cancellationToken);

        var cuponesDto = cupones.Select(c => new CuponCanjeadoDto
        {
            CuponId = c.CuponId,
            Codigo = c.Codigo,
            Descuento = c.Descuento,
            FechaExpiracion = c.FechaExpiracion,
            EstampitasRestantes = fidelizacion?.EstampitasActuales ?? 0,
            Mensaje = $"Cupón activo de descuento por ${c.Descuento:F2} (o {c.Descuento}%) válido hasta {c.FechaExpiracion:dd/MM/yyyy}."
        }).ToList();

        var historialesDto = historiales.Select(h => new HistorialTratamientoDto
        {
            HistorialId = h.HistorialId,
            UsuarioId = h.UsuarioId,
            ProfesionalId = h.ProfesionalId,
            ProfesionalNombre = h.Profesional != null ? $"{h.Profesional.Usuario?.Nombre} {h.Profesional.Usuario?.Apellido}".Trim() : string.Empty,
            TurnoId = h.TurnoId,
            Observaciones = h.Observaciones,
            Recomendaciones = h.Recomendaciones,
            Fecha = h.Fecha
        }).ToList();

        return new TarjetaFidelizacionDto
        {
            UsuarioId = usuario.UsuarioId,
            ClienteNombre = $"{usuario.Nombre} {usuario.Apellido}",
            EstampitasActuales = fidelizacion?.EstampitasActuales ?? 0,
            UltimaActualizacion = fidelizacion?.UltimaActualizacion ?? DateTime.UtcNow,
            CuponesDisponibles = cuponesDto,
            HistorialTratamientos = historialesDto
        };
    }
}
