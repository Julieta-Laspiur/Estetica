using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.DiagnosticoIA.DTOs;

public class DiagnosticoPielDto
{
    public int DiagnosticoId { get; set; }
    public int UsuarioId { get; set; }
    public int TipoPielId { get; set; }
    public TipoPielEnum TipoPielNombre { get; set; }
    public string Resultado { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
}

public class ConversacionIADto
{
    public int ConversacionId { get; set; }
    public int UsuarioId { get; set; }
    public string Pregunta { get; set; } = string.Empty;
    public string Respuesta { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
}

public class RecomendacionPersonalizadaDto
{
    public int UsuarioId { get; set; }
    public TipoPielEnum TipoPiel { get; set; }
    public string ObservacionDiagnostico { get; set; } = string.Empty;
    public List<ProductoDto> ProductosRecomendados { get; set; } = new();
}
