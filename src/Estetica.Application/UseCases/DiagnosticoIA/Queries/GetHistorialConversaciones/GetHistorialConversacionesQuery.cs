using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Queries.GetHistorialConversaciones;

public record GetHistorialConversacionesQuery(
    int UsuarioId,
    int Limite = 50
) : IRequest<IReadOnlyList<ConversacionIADto>>;
