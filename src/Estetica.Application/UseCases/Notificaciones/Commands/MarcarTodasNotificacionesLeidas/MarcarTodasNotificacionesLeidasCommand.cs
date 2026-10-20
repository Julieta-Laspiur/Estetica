using MediatR;

namespace Estetica.Application.UseCases.Notificaciones.Commands.MarcarTodasNotificacionesLeidas;

public record MarcarTodasNotificacionesLeidasCommand(
    int? UsuarioId = null,
    bool EsAdmin = false
) : IRequest<bool>;
