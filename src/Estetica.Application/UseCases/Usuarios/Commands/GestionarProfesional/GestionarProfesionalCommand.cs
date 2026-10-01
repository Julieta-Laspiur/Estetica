using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Commands.GestionarProfesional;

public record GestionarProfesionalCommand(
    int UsuarioId,
    string Especialidad,
    bool Activo = true
) : IRequest<ProfesionalDto>;
