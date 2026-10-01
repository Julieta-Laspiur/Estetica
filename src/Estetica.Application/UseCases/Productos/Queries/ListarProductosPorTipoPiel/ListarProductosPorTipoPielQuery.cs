using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Queries.ListarProductosPorTipoPiel;

public record ListarProductosPorTipoPielQuery(
    TipoPielEnum? TipoPiel = null
) : IRequest<IReadOnlyList<ProductoDto>>;
