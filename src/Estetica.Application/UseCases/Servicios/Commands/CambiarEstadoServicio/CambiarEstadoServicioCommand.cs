using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Commands.CambiarEstadoServicio;

public record CambiarEstadoServicioCommand(
    int ServicioId,
    bool Activo
) : IRequest<ServicioDetalleDto>;
