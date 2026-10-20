using Estetica.Application.UseCases.Productos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Commands.ActualizarServicio;

public record ActualizarServicioCommand(
    int ServicioId,
    string Nombre,
    string? Descripcion,
    decimal Precio,
    int DuracionMin,
    bool Activo
) : IRequest<ServicioDetalleDto>;
