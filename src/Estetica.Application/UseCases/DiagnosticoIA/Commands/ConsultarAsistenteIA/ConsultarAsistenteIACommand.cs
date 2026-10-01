using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Commands.ConsultarAsistenteIA;

public record ConsultarAsistenteIACommand(
    int UsuarioId,
    string Pregunta
) : IRequest<ConversacionIADto>;
