using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Queries.ListarServiciosActivos;

public record ListarServiciosActivosQuery() : IRequest<IReadOnlyList<ServicioDetalleDto>>;
