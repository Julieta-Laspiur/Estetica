using Estetica.Application.UseCases.FidelizacionHistorial.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.FidelizacionHistorial.Commands.GenerarQrFidelizacion;

public record GenerarQrFidelizacionCommand(int PagoId) : IRequest<QrFidelizacionDto>;
