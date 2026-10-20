using Estetica.Application.UseCases.Notificaciones.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Notificaciones.Queries.GetMisNotificaciones;

public record GetMisNotificacionesQuery(
    int UsuarioId,
    bool SoloNoLeidas = false
) : IRequest<IReadOnlyList<NotificacionDto>>;
