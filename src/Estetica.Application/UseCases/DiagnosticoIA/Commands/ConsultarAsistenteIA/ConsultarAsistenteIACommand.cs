using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Commands.ConsultarAsistenteIA;

public record ConsultarAsistenteIACommand(
    int? UsuarioId,
    string Pregunta,
    string? ApiKey = null,
    string? Modelo = null
) : IRequest<ConversacionIADto>;
