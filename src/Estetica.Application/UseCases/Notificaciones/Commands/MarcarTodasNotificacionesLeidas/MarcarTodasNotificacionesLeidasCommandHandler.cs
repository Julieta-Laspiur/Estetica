using Estetica.Application.Interfaces;
using MediatR;

namespace Estetica.Application.UseCases.Notificaciones.Commands.MarcarTodasNotificacionesLeidas;

public class MarcarTodasNotificacionesLeidasCommandHandler : IRequestHandler<MarcarTodasNotificacionesLeidasCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public MarcarTodasNotificacionesLeidasCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(MarcarTodasNotificacionesLeidasCommand request, CancellationToken cancellationToken)
    {
        if (request.EsAdmin)
        {
            await _unitOfWork.Notificaciones.MarcarTodasAlertasAdminComoLeidasAsync(cancellationToken);
        }
        else if (request.UsuarioId.HasValue)
        {
            await _unitOfWork.Notificaciones.MarcarComoLeidasAsync(request.UsuarioId.Value, cancellationToken);
        }

        return true;
    }
}
