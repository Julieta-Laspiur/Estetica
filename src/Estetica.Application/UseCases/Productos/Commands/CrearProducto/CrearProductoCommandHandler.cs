using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using FluentValidation.Results;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.CrearProducto;

public class CrearProductoCommandHandler : IRequestHandler<CrearProductoCommand, ProductoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public CrearProductoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProductoDto> Handle(CrearProductoCommand request, CancellationToken cancellationToken)
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

        var producto = new Producto
        {
            Nombre = request.Nombre.Trim(),
            Marca = request.Marca.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            ParaQueSirve = request.ParaQueSirve?.Trim(),
            ImagenUrl = request.ImagenUrl?.Trim(),
            Precio = request.Precio,
            StockActual = Math.Max(0, request.StockActual),
            StockMinimo = Math.Max(0, request.StockMinimo),
            Activo = request.Activo,
        };

        if (request.TiposPiel != null && request.TiposPiel.Count > 0)
        {
            var todosTipos = await _unitOfWork.TiposPiel.GetAllAsync(cancellationToken);
            foreach (var tipoStr in request.TiposPiel)
            {
                var tipoEntity = todosTipos.FirstOrDefault(t => t.Nombre.ToString().Equals(tipoStr, StringComparison.OrdinalIgnoreCase));
                if (tipoEntity != null)
                {
                    producto.ProductoTiposPiel.Add(new ProductoTipoPiel
                    {
                        Producto = producto,
                        TipoPielId = tipoEntity.TipoPielId
                    });
                }
            }
        }

        await _unitOfWork.Productos.AddAsync(producto, cancellationToken);
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
            TiposPielAptos = request.TiposPiel ?? new List<string>()
        };
    }
}
