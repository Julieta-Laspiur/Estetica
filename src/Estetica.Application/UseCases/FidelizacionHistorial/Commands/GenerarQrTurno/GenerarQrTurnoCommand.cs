using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.GenerarQrTurno;

public record GenerarQrTurnoCommand(int TurnoId) : IRequest<QrFidelizacionDto>;
