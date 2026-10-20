using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.EscanearQrFidelizacion;

public record EscanearQrFidelizacionCommand(
    string Token,
    int? UsuarioId = null
) : IRequest<ResultadoEscaneoQrDto>;
