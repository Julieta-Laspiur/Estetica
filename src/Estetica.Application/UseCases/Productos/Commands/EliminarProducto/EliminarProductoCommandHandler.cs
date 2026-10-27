using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.EliminarProducto;

public class EliminarProductoCommandHandler : IRequestHandler<EliminarProductoCommand, EliminarProductoResultDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public EliminarProductoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<EliminarProductoResultDto> Handle(EliminarProductoCommand request, CancellationToken cancellationToken)
    {
        var producto = await _unitOfWork.Productos.GetByIdAsync(request.ProductoId, cancellationToken);
        if (producto == null)
        {
            throw new NotFoundException("Producto", request.ProductoId);
        }

        // Desactivación lógica para preservar integridad referencial de compras y carritos
        producto.Activo = false;
        _unitOfWork.Productos.Update(producto);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new EliminarProductoResultDto($"Producto '{producto.Nombre}' desactivado del catálogo exitosamente.", true);
    }
}
