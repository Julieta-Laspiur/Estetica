using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Usuarios.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.GestionarProfesional;

public class GestionarProfesionalCommandHandler : IRequestHandler<GestionarProfesionalCommand, ProfesionalDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GestionarProfesionalCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProfesionalDto> Handle(GestionarProfesionalCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        var profesional = await _unitOfWork.Profesionales.GetByUsuarioIdAsync(request.UsuarioId, cancellationToken);

        if (profesional == null)
        {
            usuario.Rol = RolUsuario.Profesional;
            _unitOfWork.Usuarios.Update(usuario);

            profesional = new Profesional
            {
                UsuarioId = usuario.UsuarioId,
                Especialidad = request.Especialidad.Trim(),
                Activo = request.Activo
            };
            await _unitOfWork.Profesionales.AddAsync(profesional, cancellationToken);
        }
        else
        {
            profesional.Especialidad = request.Especialidad.Trim();
            profesional.Activo = request.Activo;
            _unitOfWork.Profesionales.Update(profesional);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ProfesionalDto
        {
            ProfesionalId = profesional.ProfesionalId,
            UsuarioId = usuario.UsuarioId,
            NombreCompleto = $"{usuario.Nombre} {usuario.Apellido}".Trim(),
            Email = usuario.Email,
            Especialidad = profesional.Especialidad,
            Activo = profesional.Activo
        };
    }
}
