namespace Estetica.Application.Interfaces;

public record RagConsultaContexto(
    string Pregunta,
    string? ClienteNombre,
    string? TipoPiel,
    string? Alergias,
    string? DiagnosticoResultado,
    IReadOnlyList<RagProductoItem> ProductosEnStock,
    IReadOnlyList<RagServicioItem> ServiciosActivos,
    string? ApiKeyOverride = null,
    string? ModeloOverride = null
);

public record RagProductoItem(
    int ProductoId,
    string Nombre,
    string Marca,
    string? Descripcion,
    string? ParaQueSirve,
    string? ImagenUrl,
    decimal Precio,
    int StockActual,
    IReadOnlyList<string> TiposPielAptos
);

public record RagServicioItem(
    int ServicioId,
    string Nombre,
    string? Descripcion,
    string? ParaQueSirve,
    string? ImagenUrl,
    decimal Precio,
    int DuracionMin
);

public record RagResultadoGeneracion(
    string Respuesta,
    List<int> ProductoIdsRelacionados,
    List<int> ServicioIdsRelacionados,
    bool EsAclaracionMedicaOExterna
);

public record GeminiTestResultDto(
    bool Conectado,
    string Mensaje,
    long LatenciaMs,
    string Modelo,
    bool GuardrailsActivos
);

public interface IIAService
{
    Task<string> ConsultarAsistenteAsync(string pregunta, string? contextoCliente = null, CancellationToken cancellationToken = default);
    Task<RagResultadoGeneracion> GenerarRespuestaRagAsync(RagConsultaContexto contexto, CancellationToken cancellationToken = default);
    Task<GeminiTestResultDto> TestConexionGeminiAsync(string? apiKey = null, string? model = null, CancellationToken cancellationToken = default);
}
