using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.DiagnosticoIA.DTOs;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Entities;
using MediatR;

namespace Estetica.Application.UseCases.DiagnosticoIA.Commands.ConsultarAsistenteIA;

public class ConsultarAsistenteIACommandHandler : IRequestHandler<ConsultarAsistenteIACommand, ConversacionIADto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIAService _iaService;

    public ConsultarAsistenteIACommandHandler(
        IUnitOfWork unitOfWork,
        IIAService iaService)
    {
        _unitOfWork = unitOfWork;
        _iaService = iaService;
    }

    public async Task<ConversacionIADto> Handle(ConsultarAsistenteIACommand request, CancellationToken cancellationToken)
    {
        Usuario? usuario = null;
        DiagnosticoPiel? ultimoDiagnostico = null;

        // 1. Obtener contexto dermatológico del cliente si está autenticado (HU-11, RF-09)
        if (request.UsuarioId.HasValue)
        {
            usuario = await _unitOfWork.Usuarios.GetByIdAsync(request.UsuarioId.Value, cancellationToken);
            if (usuario != null)
            {
                ultimoDiagnostico = await _unitOfWork.DiagnosticosPiel.GetUltimoDiagnosticoAsync(request.UsuarioId.Value, cancellationToken);
            }
        }

        // 2. Obtener productos activos con stock disponible (RAG Retrieval)
        var productos = await _unitOfWork.Productos.GetActivosAsync(cancellationToken);
        var productosEnStock = productos
            .Where(p => p.StockActual > 0)
            .Select(p => new RagProductoItem(
                p.ProductoId,
                p.Nombre,
                p.Marca,
                p.Descripcion,
                p.ParaQueSirve,
                p.ImagenUrl,
                p.Precio,
                p.StockActual,
                p.ProductoTiposPiel.Select(pt => pt.TipoPiel.Nombre.ToString()).ToList()
            ))
            .ToList();

        // 3. Obtener catálogo de servicios activos
        var servicios = await _unitOfWork.Servicios.GetActivosAsync(cancellationToken);
        var serviciosActivos = servicios.Select(s => new RagServicioItem(
            s.ServicioId,
            s.Nombre,
            s.Descripcion,
            s.ParaQueSirve,
            s.ImagenUrl,
            s.Precio,
            s.DuracionMin
        )).ToList();

        // 4. Construir contexto enriquecido para la inferencia RAG
        var ragContexto = new RagConsultaContexto(
            Pregunta: request.Pregunta.Trim(),
            ClienteNombre: usuario != null ? $"{usuario.Nombre} {usuario.Apellido}".Trim() : null,
            TipoPiel: ultimoDiagnostico?.TipoPiel.Nombre.ToString(),
            Alergias: ultimoDiagnostico?.Alergias,
            DiagnosticoResultado: ultimoDiagnostico?.Resultado,
            ProductosEnStock: productosEnStock,
            ServiciosActivos: serviciosActivos
        );

        // 5. Inferencia RAG con guardrails médicos y de marcas ajenas (HU-12)
        var resultadoRag = await _iaService.GenerarRespuestaRagAsync(ragContexto, cancellationToken);

        // 6. Persistir la interacción conversacional si el usuario está registrado
        int conversacionId = 0;
        var fecha = DateTime.UtcNow;

        if (usuario != null)
        {
            var conversacion = new ConversacionIA
            {
                UsuarioId = usuario.UsuarioId,
                Pregunta = request.Pregunta.Trim(),
                Respuesta = resultadoRag.Respuesta,
                Fecha = fecha
            };

            await _unitOfWork.ConversacionesIA.AddAsync(conversacion, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            conversacionId = conversacion.ConversacionId;
        }

        // 7. Mapear productos y servicios relacionados para la respuesta estructurada
        var productosRelacionados = productos
            .Where(p => resultadoRag.ProductoIdsRelacionados.Contains(p.ProductoId))
            .Select(p => new ProductoDto
            {
                ProductoId = p.ProductoId,
                Nombre = p.Nombre,
                Marca = p.Marca,
                Descripcion = p.Descripcion,
                ParaQueSirve = p.ParaQueSirve,
                ImagenUrl = p.ImagenUrl,
                Precio = p.Precio,
                StockActual = p.StockActual,
                StockMinimo = p.StockMinimo,
                Activo = p.Activo,
                TiposPielAptos = p.ProductoTiposPiel.Select(pt => pt.TipoPiel.Nombre.ToString()).ToList()
            })
            .ToList();

        var serviciosRelacionados = servicios
            .Where(s => resultadoRag.ServicioIdsRelacionados.Contains(s.ServicioId))
            .Select(s => new ServicioDetalleDto
            {
                ServicioId = s.ServicioId,
                Nombre = s.Nombre,
                Descripcion = s.Descripcion,
                ParaQueSirve = s.ParaQueSirve,
                ImagenUrl = s.ImagenUrl,
                Precio = s.Precio,
                DuracionMin = s.DuracionMin,
                Activo = s.Activo
            })
            .ToList();

        return new ConversacionIADto
        {
            ConversacionId = conversacionId,
            UsuarioId = usuario?.UsuarioId ?? 0,
            Pregunta = request.Pregunta.Trim(),
            Respuesta = resultadoRag.Respuesta,
            Fecha = fecha,
            EsAclaracionMedicaOExterna = resultadoRag.EsAclaracionMedicaOExterna,
            ProductosRelacionados = productosRelacionados,
            ServiciosRelacionados = serviciosRelacionados
        };
    }
}
