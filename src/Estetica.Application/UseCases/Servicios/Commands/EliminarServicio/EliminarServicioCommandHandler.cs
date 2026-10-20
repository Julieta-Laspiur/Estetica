using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Servicios.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Servicios.Commands.EliminarServicio;

public class EliminarServicioCommandHandler : IRequestHandler<EliminarServicioCommand, ServicioEliminadoResultadoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public EliminarServicioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ServicioEliminadoResultadoDto> Handle(EliminarServicioCommand request, CancellationToken cancellationToken)
    {
        var servicio = await _unitOfWork.Servicios.GetByIdAsync(request.ServicioId, cancellationToken);
        if (servicio == null)
        {
            throw new NotFoundException("Servicio", request.ServicioId);
        }

        // Regla de Negocio HU-15: No se admite el borrado físico de servicios con turnos históricos asociados
        var tieneTurnosHistoricos = await _unitOfWork.Servicios.TieneTurnosAsociadosAsync(request.ServicioId, cancellationToken);

        if (tieneTurnosHistoricos)
        {
            // Baja lógica (Soft delete) para proteger los reportes administrativos
            servicio.Activo = false;
            _unitOfWork.Servicios.Update(servicio);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new ServicioEliminadoResultadoDto
            {
                ServicioId = servicio.ServicioId,
                Nombre = servicio.Nombre,
                BorradoFisico = false,
                DeshabilitadoLogicamente = true,
                Mensaje = $"El servicio '{servicio.Nombre}' posee turnos históricos asociados. No se permite su borrado físico para preservar la integridad de los reportes. El servicio ha sido deshabilitado del catálogo comercial."
            };
        }

        // Si no tiene registros históricos asociados, se procede con la eliminación física
        _unitOfWork.Servicios.Delete(servicio);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ServicioEliminadoResultadoDto
        {
            ServicioId = servicio.ServicioId,
            Nombre = servicio.Nombre,
            BorradoFisico = true,
            DeshabilitadoLogicamente = false,
            Mensaje = $"El servicio '{servicio.Nombre}' no registraba turnos históricos y ha sido eliminado correctamente del sistema."
        };
    }
}
