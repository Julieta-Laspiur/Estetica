using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.EliminarProducto;

public record EliminarProductoCommand(int ProductoId) : IRequest<EliminarProductoResultDto>;

public record EliminarProductoResultDto(string Message, bool DesactivadoLogico);
