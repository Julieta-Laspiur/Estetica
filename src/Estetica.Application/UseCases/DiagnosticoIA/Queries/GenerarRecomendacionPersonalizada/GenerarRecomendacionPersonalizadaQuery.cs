using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Queries.GenerarRecomendacionPersonalizada;

public record GenerarRecomendacionPersonalizadaQuery(int UsuarioId) : IRequest<RecomendacionPersonalizadaDto>;
