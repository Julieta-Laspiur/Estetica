using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.ActualizarProducto;

public record ActualizarProductoCommand(
    int ProductoId,
    string Nombre,
    string Marca,
    string? Descripcion,
    string? ParaQueSirve,
    string? ImagenUrl,
    decimal Precio,
    int StockActual,
    int StockMinimo,
    bool Activo,
    List<string>? TiposPiel = null
) : IRequest<ProductoDto>;
