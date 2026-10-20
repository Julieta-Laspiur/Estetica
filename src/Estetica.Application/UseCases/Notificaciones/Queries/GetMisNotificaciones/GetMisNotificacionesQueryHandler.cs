using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Notificaciones.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Notificaciones.Queries.GetMisNotificaciones;

public class GetMisNotificacionesQueryHandler : IRequestHandler<GetMisNotificacionesQuery, IReadOnlyList<NotificacionDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMisNotificacionesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<NotificacionDto>> Handle(GetMisNotificacionesQuery request, CancellationToken cancellationToken)
    {
        var notificaciones = await _unitOfWork.Notificaciones.GetByUsuarioIdAsync(request.UsuarioId, request.SoloNoLeidas, cancellationToken);

        return notificaciones.Select(n => n.ToDto()).ToList();
    }
}
