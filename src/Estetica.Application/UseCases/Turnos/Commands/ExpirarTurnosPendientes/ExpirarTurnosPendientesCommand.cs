using MediatR;

namespace Estetica.Application.UseCases.Turnos.Commands.ExpirarTurnosPendientes;

public record ExpirarTurnosPendientesCommand : IRequest<int>;
