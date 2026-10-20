using Estetica.Application.UseCases.Notificaciones.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Notificaciones.Queries.GetAlertasAdmin;

public record GetAlertasAdminQuery(
    bool SoloNoLeidas = false,
    int Limite = 100
) : IRequest<IReadOnlyList<NotificacionDto>>;
