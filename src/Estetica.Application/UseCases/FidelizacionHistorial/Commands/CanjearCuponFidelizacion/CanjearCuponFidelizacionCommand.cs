using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.CanjearCuponFidelizacion;

public record CanjearCuponFidelizacionCommand(
    int UsuarioId,
    int EstampitasACanjear = 10,
    decimal MontoDescuento = 5000m
) : IRequest<CuponCanjeadoDto>;
