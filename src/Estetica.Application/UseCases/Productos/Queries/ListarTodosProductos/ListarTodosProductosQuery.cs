using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Queries.ListarTodosProductos;

public record ListarTodosProductosQuery : IRequest<IReadOnlyList<ProductoDto>>;
