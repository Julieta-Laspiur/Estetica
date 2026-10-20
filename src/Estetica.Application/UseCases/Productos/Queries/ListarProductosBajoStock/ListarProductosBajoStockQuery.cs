using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Queries.ListarProductosBajoStock;

public record ListarProductosBajoStockQuery() : IRequest<IReadOnlyList<StockAlertaDto>>;
