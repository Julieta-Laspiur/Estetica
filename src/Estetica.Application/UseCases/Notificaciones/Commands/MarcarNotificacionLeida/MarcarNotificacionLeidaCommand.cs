using MediatR;

namespace Estetica.Application.UseCases.Notificaciones.Commands.MarcarNotificacionLeida;

public record MarcarNotificacionLeidaCommand(
    int NotificacionId
) : IRequest<bool>;
