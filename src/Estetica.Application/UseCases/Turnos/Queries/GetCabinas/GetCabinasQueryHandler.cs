using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Turnos.DTOs;
using MediatR;

namespace Estetica.Application.UseCases.Turnos.Queries.GetCabinas;

public class GetCabinasQueryHandler : IRequestHandler<GetCabinasQuery, IReadOnlyList<CabinaDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetCabinasQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<CabinaDto>> Handle(GetCabinasQuery request, CancellationToken cancellationToken)
    {
        var cabinas = await _unitOfWork.Cabinas.GetAllAsync(cancellationToken);
        return cabinas.Select(c => new CabinaDto
        {
            CabinaId = c.CabinaId,
            Nombre = c.Nombre,
            Descripcion = c.Descripcion,
            Estado = c.Estado.ToString()
        }).ToList();
    }
}
