using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using Estetica.Domain.Entities;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Commands.RegistrarDiagnosticoPiel;

public class RegistrarDiagnosticoPielCommandHandler : IRequestHandler<RegistrarDiagnosticoPielCommand, DiagnosticoPielDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public RegistrarDiagnosticoPielCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DiagnosticoPielDto> Handle(RegistrarDiagnosticoPielCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        var tipoPielEntity = await _unitOfWork.TiposPiel.GetByNombreAsync(request.TipoPiel, cancellationToken);
        if (tipoPielEntity == null)
        {
            tipoPielEntity = new TipoPiel { Nombre = request.TipoPiel };
            await _unitOfWork.TiposPiel.AddAsync(tipoPielEntity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var diagnostico = new DiagnosticoPiel
        {
            UsuarioId = request.UsuarioId,
            TipoPielId = tipoPielEntity.TipoPielId,
            Resultado = request.Resultado.Trim(),
            Fecha = DateTime.UtcNow
        };

        await _unitOfWork.DiagnosticosPiel.AddAsync(diagnostico, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new DiagnosticoPielDto
        {
            DiagnosticoId = diagnostico.DiagnosticoId,
            UsuarioId = diagnostico.UsuarioId,
            TipoPielId = tipoPielEntity.TipoPielId,
            TipoPielNombre = tipoPielEntity.Nombre,
            Resultado = diagnostico.Resultado,
            Fecha = diagnostico.Fecha
        };
    }
}
