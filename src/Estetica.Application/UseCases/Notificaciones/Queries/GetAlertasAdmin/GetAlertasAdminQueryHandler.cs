using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Notificaciones.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Notificaciones.Queries.GetAlertasAdmin;

public class GetAlertasAdminQueryHandler : IRequestHandler<GetAlertasAdminQuery, IReadOnlyList<NotificacionDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAlertasAdminQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<NotificacionDto>> Handle(GetAlertasAdminQuery request, CancellationToken cancellationToken)
    {
        var limite = request.Limite is > 0 and <= 500 ? request.Limite : 100;
        var notificaciones = await _unitOfWork.Notificaciones.GetAlertasAdminAsync(request.SoloNoLeidas, limite, cancellationToken);

        return notificaciones.Select(n => n.ToDto()).ToList();
    }
}
