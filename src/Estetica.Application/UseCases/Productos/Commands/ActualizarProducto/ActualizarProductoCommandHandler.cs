using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Entities;
using FluentValidation.Results;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.ActualizarProducto;

public class ActualizarProductoCommandHandler : IRequestHandler<ActualizarProductoCommand, ProductoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public ActualizarProductoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProductoDto> Handle(ActualizarProductoCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
        {
            throw new ValidationException(new List<ValidationFailure> { new("Nombre", "El nombre del producto es obligatorio.") });
        }
        if (string.IsNullOrWhiteSpace(request.Marca))
        {
            throw new ValidationException(new List<ValidationFailure> { new("Marca", "La marca del producto es obligatoria.") });
        }
        if (request.Precio <= 0)
        {
            throw new ValidationException(new List<ValidationFailure> { new("Precio", "El precio del producto debe ser mayor a 0.") });
        }

        var producto = await _unitOfWork.Productos.GetWithTiposPielAsync(request.ProductoId, cancellationToken);
        if (producto == null)
        {
            throw new NotFoundException("Producto", request.ProductoId);
        }

        producto.Nombre = request.Nombre.Trim();
        producto.Marca = request.Marca.Trim();
        producto.Descripcion = request.Descripcion?.Trim();
        producto.ParaQueSirve = request.ParaQueSirve?.Trim();
        producto.ImagenUrl = request.ImagenUrl?.Trim();
        producto.Precio = request.Precio;
        producto.StockActual = Math.Max(0, request.StockActual);
        producto.StockMinimo = Math.Max(0, request.StockMinimo);
        producto.Activo = request.Activo;

        // Actualizar biotipos asociados si se proporcionaron
        if (request.TiposPiel != null)
        {
            producto.ProductoTiposPiel.Clear();
            var todosTipos = await _unitOfWork.TiposPiel.GetAllAsync(cancellationToken);
            foreach (var tipoStr in request.TiposPiel)
            {
                var tipoEntity = todosTipos.FirstOrDefault(t => t.Nombre.ToString().Equals(tipoStr, StringComparison.OrdinalIgnoreCase));
                if (tipoEntity != null)
                {
                    producto.ProductoTiposPiel.Add(new ProductoTipoPiel
                    {
                        ProductoId = producto.ProductoId,
                        TipoPielId = tipoEntity.TipoPielId
                    });
                }
            }
        }

        _unitOfWork.Productos.Update(producto);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ProductoDto
        {
            ProductoId = producto.ProductoId,
            Nombre = producto.Nombre,
            Marca = producto.Marca,
            Descripcion = producto.Descripcion,
            ParaQueSirve = producto.ParaQueSirve,
            ImagenUrl = producto.ImagenUrl,
            Precio = producto.Precio,
            StockActual = producto.StockActual,
            StockMinimo = producto.StockMinimo,
            Activo = producto.Activo,
            TiposPielAptos = request.TiposPiel ?? producto.ProductoTiposPiel.Where(pt => pt.TipoPiel != null).Select(pt => pt.TipoPiel.Nombre.ToString()).ToList()
        };
    }
}
