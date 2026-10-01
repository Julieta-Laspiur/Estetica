using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.AcumularEstampitas;

public record AcumularEstampitasCommand(
    int UsuarioId,
    int CantidadEstampitas = 1
) : IRequest<FidelizacionDto>;
