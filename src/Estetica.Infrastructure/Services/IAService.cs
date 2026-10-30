using System.Text;
using System.Text.RegularExpressions;
using Estetica.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Estetica.Infrastructure.Services;

public class IAService : IIAService
{
    private readonly IConfiguration _configuration;

    private static readonly string[] TerminosMedicosOClinicos =
    {
        "receta", "recetar", "medicamento", "farmaco", "fármaco", "antibiotico", "antibiótico",
        "corticoide", "cortisona", "roacutan", "roacután", "isotretinoina", "isotretinoína",
        "cirugia", "cirugía", "operacion", "operación", "biopsia", "patologia", "patología",
        "dermatitis infecciosa", "psoriasis clinica", "melanoma", "cancer", "cáncer", "quiste infectado"
    };

    private static readonly string[] MarcasAjenasConocidas =
    {
        "cerave", "bioderma", "isdin", "neutrogena", "cetaphil", "the ordinary",
        "clinique", "kiehls", "kiehl's", "avene", "avène", "nivea", "garnier"
    };

    public IAService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<string> ConsultarAsistenteAsync(string pregunta, string? contextoCliente = null, CancellationToken cancellationToken = default)
    {
        var contextPrompt = !string.IsNullOrWhiteSpace(contextoCliente)
            ? $" [Contexto del cliente: {contextoCliente}]"
            : string.Empty;

        var respuesta = $"Como especialista en estética y cuidado dermocosmético{contextPrompt}, en relación a tu consulta: \"{pregunta}\", te sugiero priorizar la hidratación diaria con activos humectantes adecuados para tu biotipo cutáneo, uso ininterrumpido de protector solar FPS 50+ cada 3 horas y combinar con una limpieza suave matutina y nocturna.";

        return Task.FromResult(respuesta);
    }

    public Task<RagResultadoGeneracion> GenerarRespuestaRagAsync(RagConsultaContexto contexto, CancellationToken cancellationToken = default)
    {
        var preguntaLower = contexto.Pregunta.ToLowerInvariant();
        var sb = new StringBuilder();
        var productoIdsRelacionados = new List<int>();
        var servicioIdsRelacionados = new List<int>();
        bool esAclaracionMedicaOExterna = false;

        // 1. Guardrail HU-12: Detección de tratamientos médicos complejos o marcas ajenas
        var marcasEnCatalogo = contexto.ProductosEnStock
            .Select(p => p.Marca.ToLowerInvariant().Trim())
            .Distinct()
            .ToList();

        bool contieneConsultaMedica = TerminosMedicosOClinicos.Any(tm => preguntaLower.Contains(tm));
        bool contieneMarcaAjena = MarcasAjenasConocidas.Any(ma => preguntaLower.Contains(ma) && !marcasEnCatalogo.Any(mc => mc.Contains(ma)));

        if (contieneConsultaMedica || contieneMarcaAjena)
        {
            esAclaracionMedicaOExterna = true;
            sb.AppendLine("Aclaración profesional importante: Como asistente dermocosmético inteligente de nuestro centro, no estamos facultados para emitir diagnósticos médicos clínicos, realizar procedimientos quirúrgicos ni comercializar fármacos bajo receta.");

            if (contieneMarcaAjena)
            {
                sb.AppendLine("Respecto a las marcas ajenas consultadas, en nuestro centro trabajamos exclusivamente con líneas cosmecéuticas profesionales certificadas con respaldo dermatológico y stock verificado.");
            }

            sb.AppendLine("Para el cuidado seguro y el embellecimiento de tu piel, te compartimos nuestras mejores opciones y tratamientos afines disponibles en el centro:\n");
        }
        else
        {
            var saludo = !string.IsNullOrWhiteSpace(contexto.ClienteNombre)
                ? $"¡Hola {contexto.ClienteNombre}! "
                : "¡Hola! ";
            sb.Append(saludo);
            sb.AppendLine("Con gusto te asesoro según las alternativas y stock real de nuestro centro estético.");
        }

        // 2. Extracción de descriptores de tipo de piel (RF-09)
        string? tipoPielDetectado = contexto.TipoPiel;
        if (preguntaLower.Contains("grasa") || preguntaLower.Contains("sebo") || preguntaLower.Contains("brillo"))
            tipoPielDetectado = "Grasa";
        else if (preguntaLower.Contains("seca") || preguntaLower.Contains("tirantez") || preguntaLower.Contains("descamad"))
            tipoPielDetectado = "Seca";
        else if (preguntaLower.Contains("mixta"))
            tipoPielDetectado = "Mixta";
        else if (preguntaLower.Contains("sensible") || preguntaLower.Contains("rojez") || preguntaLower.Contains("rosacea"))
            tipoPielDetectado = "Sensible";

        if (!string.IsNullOrWhiteSpace(tipoPielDetectado))
        {
            sb.AppendLine($"Tomando en consideración tu perfil cutáneo ({tipoPielDetectado}) y necesidades específicas:");
        }

        // 3. Retrieval RAG: Filtrar productos con stock activo y descartar alérgenos
        var alergiasTokens = !string.IsNullOrWhiteSpace(contexto.Alergias)
            ? contexto.Alergias.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : Array.Empty<string>();

        var productosAptos = contexto.ProductosEnStock.Where(p =>
        {
            if (alergiasTokens.Length == 0) return true;
            var txt = $"{p.Nombre} {p.Marca} {p.Descripcion} {p.ParaQueSirve}".ToLowerInvariant();
            return !alergiasTokens.Any(a => txt.Contains(a.ToLowerInvariant()));
        }).ToList();

        // Scoring de productos según coincidencia temática
        var productosPuntuados = productosAptos.Select(p =>
        {
            int score = 0;
            var texto = $"{p.Nombre} {p.Marca} {p.Descripcion} {p.ParaQueSirve}".ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(tipoPielDetectado) && p.TiposPielAptos.Any(tp => tp.Equals(tipoPielDetectado, StringComparison.OrdinalIgnoreCase)))
                score += 5;

            if (preguntaLower.Contains("limpieza") || preguntaLower.Contains("limpiador") || preguntaLower.Contains("gel"))
                if (texto.Contains("limpiad") || texto.Contains("gel") || texto.Contains("espuma")) score += 3;

            if (preguntaLower.Contains("hidrat") || preguntaLower.Contains("crema") || preguntaLower.Contains("humect"))
                if (texto.Contains("hidrat") || texto.Contains("crema") || texto.Contains("emulsion") || texto.Contains("emulsión")) score += 3;

            if (preguntaLower.Contains("solar") || preguntaLower.Contains("protector") || preguntaLower.Contains("bloqueador"))
                if (texto.Contains("solar") || texto.Contains("fps") || texto.Contains("protector")) score += 4;

            if (preguntaLower.Contains("serum") || preguntaLower.Contains("suero") || preguntaLower.Contains("vitamina"))
                if (texto.Contains("serum") || texto.Contains("suero") || texto.Contains("activo")) score += 3;

            if (preguntaLower.Contains("manchas") || preguntaLower.Contains("aclar"))
                if (texto.Contains("vitamina c") || texto.Contains("aclar") || texto.Contains("manchas") || texto.Contains("niacinamida")) score += 3;

            return new { Producto = p, Score = score };
        })
        .OrderByDescending(x => x.Score)
        .ThenBy(x => x.Producto.Precio)
        .Take(3)
        .Select(x => x.Producto)
        .ToList();

        // Scoring de servicios afines en catálogo
        var serviciosPuntuados = contexto.ServiciosActivos.Select(s =>
        {
            int score = 0;
            var texto = $"{s.Nombre} {s.Descripcion} {s.ParaQueSirve}".ToLowerInvariant();

            if (preguntaLower.Contains("limpieza") || preguntaLower.Contains("puntos negros") || preguntaLower.Contains("poros"))
                if (texto.Contains("limpieza") || texto.Contains("facial") || texto.Contains("higiene")) score += 5;

            if (preguntaLower.Contains("peeling") || preguntaLower.Contains("manchas") || preguntaLower.Contains("marcas"))
                if (texto.Contains("peeling") || texto.Contains("renovación") || texto.Contains("exfolia")) score += 5;

            if (preguntaLower.Contains("hidrat") || preguntaLower.Contains("seco") || preguntaLower.Contains("nutri"))
                if (texto.Contains("hidrat") || texto.Contains("nutrición") || texto.Contains("máscara")) score += 4;

            if (preguntaLower.Contains("arrugas") || preguntaLower.Contains("edad") || preguntaLower.Contains("flacidez"))
                if (texto.Contains("antiage") || texto.Contains("radiofrecuencia") || texto.Contains("rejuven")) score += 5;

            if (preguntaLower.Contains("masaje") || preguntaLower.Contains("relax") || preguntaLower.Contains("descontract"))
                if (texto.Contains("masaje") || texto.Contains("relax")) score += 5;

            return new { Servicio = s, Score = score };
        })
        .OrderByDescending(x => x.Score)
        .Take(2)
        .Select(x => x.Servicio)
        .ToList();

        // 4. Redacción natural fundamentada en el contexto RAG
        if (productosPuntuados.Any())
        {
            sb.AppendLine("\nProductos recomendados en nuestra tienda (con disponibilidad inmediata):");
            foreach (var p in productosPuntuados)
            {
                productoIdsRelacionados.Add(p.ProductoId);
                var detalle = !string.IsNullOrWhiteSpace(p.ParaQueSirve) ? p.ParaQueSirve : (p.Descripcion ?? "Fórmula cosmecéutica de alta tolerancia.");
                sb.AppendLine($"• {p.Nombre} ({p.Marca}) - ${p.Precio:N0}: {detalle} [Stock: {p.StockActual} disp.]");
            }
        }

        if (serviciosPuntuados.Any())
        {
            sb.AppendLine("\nTratamientos sugeridos en nuestro centro:");
            foreach (var s in serviciosPuntuados)
            {
                servicioIdsRelacionados.Add(s.ServicioId);
                var detalle = !string.IsNullOrWhiteSpace(s.ParaQueSirve) ? s.ParaQueSirve : (s.Descripcion ?? "Tratamiento personalizado en cabina profesional.");
                sb.AppendLine($"• {s.Nombre} (Duración: {s.DuracionMin} min, ${s.Precio:N0}): {detalle}");
            }
        }

        sb.AppendLine("\n¿Te gustaría que te ayude a agendar un turno para alguno de estos servicios o agregar los productos a tu carrito de compras?");

        var resultado = new RagResultadoGeneracion(
            Respuesta: sb.ToString().Trim(),
            ProductoIdsRelacionados: productoIdsRelacionados,
            ServicioIdsRelacionados: servicioIdsRelacionados,
            EsAclaracionMedicaOExterna: esAclaracionMedicaOExterna
        );

        return Task.FromResult(resultado);
    }
}
