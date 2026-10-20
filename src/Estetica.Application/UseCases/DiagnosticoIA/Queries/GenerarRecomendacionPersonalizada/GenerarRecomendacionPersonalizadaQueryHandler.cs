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

        // 1. Obtener diagnóstico de piel reciente (perfil dermatológico)
        var ultimoDiagnostico = await _unitOfWork.DiagnosticosPiel.GetUltimoDiagnosticoAsync(request.UsuarioId, cancellationToken);
        if (ultimoDiagnostico == null)
        {
            throw new BusinessRuleException("El usuario aún no posee un diagnóstico de piel registrado para generar recomendaciones personalizadas.");
        }

        // 2. Obtener historial de compras para retroalimentar la recomendación (HU-11)
        var ordenes = await _unitOfWork.OrdenesCompra.GetByUsuarioIdAsync(request.UsuarioId, cancellationToken);
        var productosComprados = ordenes
            .SelectMany(o => o.Detalles)
            .Where(d => d.Producto != null)
            .Select(d => d.Producto!)
            .ToList();

        var historialComprasResumen = productosComprados
            .Select(p => $"{p.Nombre} ({p.Marca})")
            .Distinct()
            .ToList();

        // 3. Obtener tratamientos previos del cliente en el centro
        var tratamientos = await _unitOfWork.HistorialesTratamiento.GetByUsuarioIdAsync(request.UsuarioId, cancellationToken);
        var tratamientosResumen = tratamientos
            .Where(t => !string.IsNullOrWhiteSpace(t.Observaciones) || !string.IsNullOrWhiteSpace(t.Recomendaciones))
            .Select(t => $"{t.Fecha:dd/MM/yyyy}: {(string.IsNullOrWhiteSpace(t.Recomendaciones) ? t.Observaciones : t.Recomendaciones)}")
            .Take(5)
            .ToList();

        // 4. Obtener productos aptos según el biotipo cutáneo
        var productosCandidatos = await _unitOfWork.Productos.GetByTipoPielAsync(ultimoDiagnostico.TipoPielId, cancellationToken);

        // Criterio de Aceptación HU-11: Los productos sugeridos deben encontrarse disponibles (stock actual > 0 y activos)
        var productosDisponibles = productosCandidatos
            .Where(p => p.Activo && p.StockActual > 0)
            .ToList();

        // Regla de Negocio HU-11: No deben recomendarse productos incompatibles con alergias registradas
        var alergiasTokens = !string.IsNullOrWhiteSpace(ultimoDiagnostico.Alergias)
            ? ultimoDiagnostico.Alergias.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : Array.Empty<string>();

        var productosFiltrados = productosDisponibles.Where(p =>
        {
            if (alergiasTokens.Length == 0) return true;

            var textoProducto = $"{p.Nombre} {p.Marca} {p.Descripcion}".ToLowerInvariant();
            return !alergiasTokens.Any(alergia => textoProducto.Contains(alergia.ToLowerInvariant()));
        }).ToList();

        // Mapear a DTOs de producto
        var productosDto = productosFiltrados.Select(p => new ProductoDto
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

        // Construir sugerencia estructurada de rutina personalizada
        var biotipo = ultimoDiagnostico.TipoPiel.Nombre.ToString();
        var rutinaBuilder = $"Rutina personalizada recomendada para piel {biotipo}:\n" +
                            $"1. Limpieza suave diaria matutina y nocturna.\n" +
                            $"2. Aplicación de principios activos específicos humectantes o seboreguladores.\n" +
                            $"3. Crema de hidratación/emulsión según tolerancia cutánea.\n" +
                            $"4. Fotoprotección solar de amplio espectro FPS 50+ cada 3 horas durante el día.";

        if (alergiasTokens.Length > 0)
        {
            rutinaBuilder += $"\n[Aviso de Seguridad]: Se han excluido automáticamente del catálogo los productos incompatibles con tus alergias ({string.Join(", ", alergiasTokens)}).";
        }

        return new RecomendacionPersonalizadaDto
        {
            UsuarioId = usuario.UsuarioId,
            ClienteNombre = $"{usuario.Nombre} {usuario.Apellido}".Trim(),
            TipoPiel = ultimoDiagnostico.TipoPiel.Nombre,
            AlergiasRegistradas = ultimoDiagnostico.Alergias,
            ObservacionDiagnostico = ultimoDiagnostico.Resultado,
            HistorialComprasResumen = historialComprasResumen,
            TratamientosPreviosResumen = tratamientosResumen,
            ProductosRecomendados = productosDto,
            RutinaSugerida = rutinaBuilder,
            FechaGeneracion = DateTime.UtcNow
        };
    }
}
