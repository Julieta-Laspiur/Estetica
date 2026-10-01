using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Commands.RegistrarDiagnosticoPiel;

public record RegistrarDiagnosticoPielCommand(
    int UsuarioId,
    TipoPielEnum TipoPiel,
    string Resultado
) : IRequest<DiagnosticoPielDto>;
