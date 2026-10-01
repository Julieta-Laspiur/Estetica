using Estetica.Application.UseCases.Usuarios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Usuarios.Queries.GetPerfil;

public record GetPerfilQuery(int UsuarioId) : IRequest<PerfilDto>;
