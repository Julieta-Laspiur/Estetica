using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using Estetica.Domain.Entities;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Commands.ConsultarAsistenteIA;

public class ConsultarAsistenteIACommandHandler : IRequestHandler<ConsultarAsistenteIACommand, ConversacionIADto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIAService _iaService;

    public ConsultarAsistenteIACommandHandler(
        IUnitOfWork unitOfWork,
        IIAService iaService)
    {
        _unitOfWork = unitOfWork;
        _iaService = iaService;
    }

    public async Task<ConversacionIADto> Handle(ConsultarAsistenteIACommand request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        // Obtener contexto del cliente (último diagnóstico de piel si existe)
        var ultimoDiagnostico = await _unitOfWork.DiagnosticosPiel.GetUltimoDiagnosticoAsync(request.UsuarioId, cancellationToken);
        var contexto = ultimoDiagnostico != null
            ? $"El cliente {usuario.Nombre} tiene tipo de piel {ultimoDiagnostico.TipoPiel.Nombre} con diagnóstico: {ultimoDiagnostico.Resultado}."
            : $"El cliente {usuario.Nombre} no tiene aún diagnóstico registrado.";

        var respuestaIA = await _iaService.ConsultarAsistenteAsync(request.Pregunta.Trim(), contexto, cancellationToken);

        var conversacion = new ConversacionIA
        {
            UsuarioId = request.UsuarioId,
            Pregunta = request.Pregunta.Trim(),
            Respuesta = respuestaIA,
            Fecha = DateTime.UtcNow
        };

        await _unitOfWork.ConversacionesIA.AddAsync(conversacion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ConversacionIADto
        {
            ConversacionId = conversacion.ConversacionId,
            UsuarioId = conversacion.UsuarioId,
            Pregunta = conversacion.Pregunta,
            Respuesta = conversacion.Respuesta,
            Fecha = conversacion.Fecha
        };
    }
}
