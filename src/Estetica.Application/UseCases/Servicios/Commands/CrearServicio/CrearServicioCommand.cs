using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Commands.CrearServicio;

public record CrearServicioCommand(
    string Nombre,
    string? Descripcion,
    decimal Precio,
    int DuracionMin,
    bool Activo = true
) : IRequest<ServicioDetalleDto>;
