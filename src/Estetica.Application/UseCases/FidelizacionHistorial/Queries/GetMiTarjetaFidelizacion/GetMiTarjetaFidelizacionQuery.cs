using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Queries.GetMiTarjetaFidelizacion;

public record GetMiTarjetaFidelizacionQuery(int? UsuarioId = null) : IRequest<TarjetaFidelizacionDto>;
