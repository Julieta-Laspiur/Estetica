using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Queries.GenerarRecomendacionPersonalizada;

public class GenerarRecomendacionPersonalizadaQueryHandler : IRequestHandler<GenerarRecomendacionPersonalizadaQuery, RecomendacionPersonalizadaDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GenerarRecomendacionPersonalizadaQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<RecomendacionPersonalizadaDto> Handle(GenerarRecomendacionPersonalizadaQuery request, CancellationToken cancellationToken)
    {
        var usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null)
        {
            throw new NotFoundException("Usuario", request.UsuarioId);
        }

        var ultimoDiagnostico = await _unitOfWork.DiagnosticosPiel.GetUltimoDiagnosticoAsync(request.UsuarioId, cancellationToken);
        if (ultimoDiagnostico == null)
        {
            throw new BusinessRuleException("El usuario aún no posee un diagnóstico de piel registrado para generar recomendaciones.");
        }

        var productos = await _unitOfWork.Productos.GetByTipoPielAsync(ultimoDiagnostico.TipoPielId, cancellationToken);

        var productosDto = productos.Select(p => new ProductoDto
        {
            ProductoId = p.ProductoId,
            Nombre = p.Nombre,
            Marca = p.Marca,
            Descripcion = p.Descripcion,
            Precio = p.Precio,
            StockActual = p.StockActual,
            StockMinimo = p.StockMinimo,
            Activo = p.Activo,
            TiposPielAptos = new List<string> { ultimoDiagnostico.TipoPiel.Nombre.ToString() }
        }).ToList();

        return new RecomendacionPersonalizadaDto
        {
            UsuarioId = usuario.UsuarioId,
            TipoPiel = ultimoDiagnostico.TipoPiel.Nombre,
            ObservacionDiagnostico = ultimoDiagnostico.Resultado,
            ProductosRecomendados = productosDto
        };
    }
}
