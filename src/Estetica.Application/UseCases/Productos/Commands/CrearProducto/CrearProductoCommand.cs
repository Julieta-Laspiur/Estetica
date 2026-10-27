using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.CrearProducto;

public record CrearProductoCommand(
    string Nombre,
    string Marca,
    string? Descripcion,
    string? ParaQueSirve,
    string? ImagenUrl,
    decimal Precio,
    int StockActual,
    int StockMinimo,
    bool Activo = true,
    List<string>? TiposPiel = null
) : IRequest<ProductoDto>;
