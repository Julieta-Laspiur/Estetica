using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using MediatR;

namespace Estetica.Application.UseCases.Notificaciones.Commands.MarcarNotificacionLeida;

public class MarcarNotificacionLeidaCommandHandler : IRequestHandler<MarcarNotificacionLeidaCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public MarcarNotificacionLeidaCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(MarcarNotificacionLeidaCommand request, CancellationToken cancellationToken)
    {
        var marcada = await _unitOfWork.Notificaciones.MarcarComoLeidaAsync(request.NotificacionId, cancellationToken);
        if (!marcada)
        {
            throw new NotFoundException("Notificacion", request.NotificacionId);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
