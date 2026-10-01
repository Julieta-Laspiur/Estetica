using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using Estetica.Domain.Entities;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.RegistrarHistorialTratamiento;

public class RegistrarHistorialTratamientoCommandHandler : IRequestHandler<RegistrarHistorialTratamientoCommand, HistorialTratamientoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public RegistrarHistorialTratamientoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<HistorialTratamientoDto> Handle(RegistrarHistorialTratamientoCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        var profesional = await _unitOfWork.Profesionales.GetWithDetailsAsync(request.ProfesionalId, cancellationToken);
        if (profesional == null)
        {
            throw new NotFoundException("Profesional", request.ProfesionalId);
        }

        if (request.TurnoId.HasValue)
        {
            var turno = await _unitOfWork.Turnos.GetByIdAsync(request.TurnoId.Value, cancellationToken);
            if (turno == null)
            {
                throw new NotFoundException("Turno", request.TurnoId.Value);
            }
        }

        var historial = new HistorialTratamiento
        {
            UsuarioId = request.UsuarioId,
            ProfesionalId = request.ProfesionalId,
            TurnoId = request.TurnoId,
            Observaciones = request.Observaciones?.Trim(),
            Recomendaciones = request.Recomendaciones?.Trim(),
            Fecha = DateTime.UtcNow
        };

        await _unitOfWork.HistorialesTratamiento.AddAsync(historial, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new HistorialTratamientoDto
        {
            HistorialId = historial.HistorialId,
            UsuarioId = historial.UsuarioId,
            ProfesionalId = historial.ProfesionalId,
            ProfesionalNombre = $"{profesional.Usuario.Nombre} {profesional.Usuario.Apellido}".Trim(),
            TurnoId = historial.TurnoId,
            Observaciones = historial.Observaciones,
            Recomendaciones = historial.Recomendaciones,
            Fecha = historial.Fecha
        };
    }
}
