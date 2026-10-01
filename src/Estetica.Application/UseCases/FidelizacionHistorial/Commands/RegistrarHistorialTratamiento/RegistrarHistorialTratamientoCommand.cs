using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.RegistrarHistorialTratamiento;

public record RegistrarHistorialTratamientoCommand(
    int UsuarioId,
    int ProfesionalId,
    int? TurnoId,
    string? Observaciones,
    string? Recomendaciones
) : IRequest<HistorialTratamientoDto>;
