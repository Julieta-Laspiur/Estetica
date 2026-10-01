using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.CambiarEstadoTurno;

public class CambiarEstadoTurnoCommandHandler : IRequestHandler<CambiarEstadoTurnoCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public CambiarEstadoTurnoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(CambiarEstadoTurnoCommand request, CancellationToken cancellationToken)
    {
        var turno = await _unitOfWork.Turnos.GetByIdAsync(request.TurnoId, cancellationToken);
        if (turno == null)
        {
            throw new NotFoundException("Turno", request.TurnoId);
        }

        turno.Estado = request.NuevoEstado;

        // Si se completa el turno y el cliente tiene fidelización, sumamos una estampita
        if (request.NuevoEstado == EstadoTurno.Completado)
        {
            var fidelizacion = await _unitOfWork.Fidelizaciones.GetByUsuarioIdAsync(turno.UsuarioId, cancellationToken);
            if (fidelizacion != null)
            {
                fidelizacion.EstampitasActuales += 1;
                fidelizacion.UltimaActualizacion = DateTime.UtcNow;
                _unitOfWork.Fidelizaciones.Update(fidelizacion);
            }
        }

        _unitOfWork.Turnos.Update(turno);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
