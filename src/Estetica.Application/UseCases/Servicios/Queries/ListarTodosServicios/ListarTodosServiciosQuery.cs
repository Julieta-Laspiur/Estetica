using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Queries.ListarTodosServicios;

public record ListarTodosServiciosQuery() : IRequest<IReadOnlyList<ServicioDetalleDto>>;
