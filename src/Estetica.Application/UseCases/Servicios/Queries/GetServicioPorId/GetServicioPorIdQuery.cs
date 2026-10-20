using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Queries.GetServicioPorId;

public record GetServicioPorIdQuery(int ServicioId) : IRequest<ServicioDetalleDto>;
