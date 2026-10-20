using Estetica.Application.UseCases.Servicios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Commands.EliminarServicio;

public record EliminarServicioCommand(
    int ServicioId
) : IRequest<ServicioEliminadoResultadoDto>;
