using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Queries.GetHistorialConversaciones;

public class GetHistorialConversacionesQueryHandler : IRequestHandler<GetHistorialConversacionesQuery, IReadOnlyList<ConversacionIADto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetHistorialConversacionesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ConversacionIADto>> Handle(GetHistorialConversacionesQuery request, CancellationToken cancellationToken)
    {
        var limite = request.Limite is > 0 and <= 100 ? request.Limite : 50;
        var historial = await _unitOfWork.ConversacionesIA.GetHistorialByUsuarioIdAsync(request.UsuarioId, limite, cancellationToken);

        return historial.Select(c => new ConversacionIADto
        {
            ConversacionId = c.ConversacionId,
            UsuarioId = c.UsuarioId,
            Pregunta = c.Pregunta,
            Respuesta = c.Respuesta,
            Fecha = c.Fecha
        }).ToList();
    }
}
