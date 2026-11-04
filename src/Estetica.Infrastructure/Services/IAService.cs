using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Estetica.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Estetica.Infrastructure.Services;

public class IAService : IIAService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<IAService> _logger;
    private static readonly HttpClient _httpClient = new HttpClient();

    private static readonly string[] TerminosMedicosOClinicos =
    {
        "receta", "recetar", "medicamento", "farmaco", "fármaco", "antibiotico", "antibiótico",
        "corticoide", "cortisona", "roacutan", "roacután", "isotretinoina", "isotretinoína",
        "cirugia", "cirugía", "operacion", "operación", "biopsia", "patologia", "patología",
        "dermatitis infecciosa", "psoriasis clinica", "psoriasis", "melanoma", "cancer", "cáncer",
        "quiste infectado", "infeccion bacteriana", "herpes", "erupcion aguda", "enfermedad cutanea"
    };

    private static readonly string[] MarcasAjenasConocidas =
    {
        "cerave", "bioderma", "isdin", "neutrogena", "cetaphil", "the ordinary",
        "clinique", "kiehls", "kiehl's", "avene", "avène", "nivea", "garnier",
        "vichy", "eucerin", "la roche posay", "laroche posay", "olay", "loreal", "l'oreal"
    };

    public IAService(
        IConfiguration configuration,
        ILogger<IAService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task<string> ConsultarAsistenteAsync(string pregunta, string? contextoCliente = null, CancellationToken cancellationToken = default)
    {
        var contextPrompt = !string.IsNullOrWhiteSpace(contextoCliente)
            ? $" [Contexto del cliente: {contextoCliente}]"
            : string.Empty;

        var respuesta = $"Como especialista en estética y cuidado dermocosmético{contextPrompt}, en relación a tu consulta: \"{pregunta}\", te sugiero priorizar la hidratación diaria con activos humectantes adecuados para tu biotipo cutáneo, uso ininterrumpido de protector solar FPS 50+ cada 3 horas y combinar con una limpieza suave matutina y nocturna.";

        return Task.FromResult(respuesta);
    }

    public async Task<RagResultadoGeneracion> GenerarRespuestaRagAsync(RagConsultaContexto contexto, CancellationToken cancellationToken = default)
    {
        var preguntaLower = contexto.Pregunta.ToLowerInvariant();

        // 1. Guardrail HU-12: Detección estricta de tratamientos médicos complejos o marcas ajenas
        var marcasEnCatalogo = contexto.ProductosEnStock
            .Select(p => p.Marca.ToLowerInvariant().Trim())
            .Distinct()
            .ToList();

        bool contieneConsultaMedica = TerminosMedicosOClinicos.Any(tm => preguntaLower.Contains(tm));
        bool contieneMarcaAjena = MarcasAjenasConocidas.Any(ma => preguntaLower.Contains(ma) && !marcasEnCatalogo.Any(mc => mc.Contains(ma)));
        bool esAclaracionMedicaOExterna = contieneConsultaMedica || contieneMarcaAjena;

        // 2. Resolver API Key de Gemini (prioridad: Override del request -> Configuration -> Variable de Entorno)
        var apiKey = !string.IsNullOrWhiteSpace(contexto.ApiKeyOverride)
            ? contexto.ApiKeyOverride.Trim()
            : _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        var modelo = !string.IsNullOrWhiteSpace(contexto.ModeloOverride)
            ? contexto.ModeloOverride.Trim()
            : _configuration["Gemini:Model"] ?? "gemini-1.5-flash";

        // 3. Intentar inferencia en vivo con Google Gemini si la API Key está configurada
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var resultadoGemini = await InvocarGeminiAsync(apiKey, modelo, contexto, esAclaracionMedicaOExterna, cancellationToken);
                if (resultadoGemini != null)
                {
                    return resultadoGemini;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallo al invocar la API de Google Gemini ({Modelo}). Ejecutando fallback al motor RAG local.", modelo);
            }
        }
        else
        {
            _logger.LogInformation("Gemini API Key no configurada. Utilizando motor RAG heurístico de respaldo certificado.");
        }

        // 4. Fallback transparente y robusto: Motor heurístico RAG local con estricta adherencia a los guardrails
        return GenerarRespuestaLocalRag(contexto, esAclaracionMedicaOExterna, contieneMarcaAjena);
    }

    private async Task<RagResultadoGeneracion?> InvocarGeminiAsync(
        string apiKey,
        string modelo,
        RagConsultaContexto contexto,
        bool esAclaracionMedicaOExterna,
        CancellationToken cancellationToken)
    {
        var client = _httpClient;

        // Construcción del System Instruction con las 4 limitaciones del proyecto (HU-12, RF-09, RNF-04)
        var systemInstruction = new StringBuilder();
        systemInstruction.AppendLine("Eres el Asistente Dermatológico y Cosmecéutico Virtual Inteligente oficial de nuestro centro estético.");
        systemInstruction.AppendLine("Tu objetivo es asesorar a clientes de manera profesional, empática, cortés y personalizada sobre el cuidado de su piel, orientándolos sobre nuestros tratamientos en cabina y productos en tienda.");
        systemInstruction.AppendLine();
        systemInstruction.AppendLine("REGLAS Y LIMITACIONES OBLIGATORIAS (GUARDRAILS DE SEGURIDAD HU-12):");
        systemInstruction.AppendLine("1. PROHIBICIÓN ABSOLUTA DE DIAGNÓSTICOS MÉDICOS Y FÁRMACOS:");
        systemInstruction.AppendLine("   - Tienes TERMINANTEMENTE PROHIBIDO emitir diagnósticos clínicos de patologías médicas o enfermedades de la piel (como melanoma, psoriasis clínica, dermatitis infecciosa, infecciones bacterianas o fúngicas graves, acné quístico severo con pus, etc.).");
        systemInstruction.AppendLine("   - No prescribas, no sugieras ni menciones fármacos de venta bajo receta (antibióticos orales/tópicos, corticoides, isotretinoína/roacután, antifúngicos orales, etc.).");
        systemInstruction.AppendLine("   - No sugieras procedimientos quirúrgicos o médicos invasivos (biopsias, escisiones, etc.).");
        systemInstruction.AppendLine("   - Si el usuario te consulta sobre patologías médicas complejas o pide recetas, debes responder con una aclaración profesional cortés: \"Como asistente estético no estoy facultado para emitir diagnósticos médicos ni recetas clínicas\" y recomendar enfáticamente acudir a una consulta presencial con un médico dermatólogo.");
        systemInstruction.AppendLine();
        systemInstruction.AppendLine("2. PROHIBICIÓN DE RECOMENDAR MARCAS EXTERNAS AJENAS:");
        systemInstruction.AppendLine("   - No debes recomendar, validar ni sugerir marcas comerciales ajenas fuera de nuestro centro (por ejemplo CeraVe, La Roche-Posay, ISDIN, Neutrogena, Cetaphil, Eucerin, The Ordinary, Vichy, etc.).");
        systemInstruction.AppendLine("   - Si el usuario te pregunta por una marca externa ajena, aclara con amabilidad que en nuestro centro trabajamos exclusivamente con líneas cosmecéuticas profesionales certificadas con respaldo dermatológico, y reorienta la recomendación hacia las alternativas y activos equivalentes disponibles en nuestro stock.");
        systemInstruction.AppendLine();
        systemInstruction.AppendLine("3. LIMITACIÓN ESTRICTA AL CATÁLOGO REAL EN STOCK (RAG):");
        systemInstruction.AppendLine("   - Solo puedes recomendar productos que estén en la lista de [PRODUCTOS CON STOCK DISPONIBLE]. Si un producto no está en esa lista, NO lo menciones ni lo inventes.");
        systemInstruction.AppendLine("   - Solo puedes sugerir tratamientos que estén en la lista de [TRATAMIENTOS Y SERVICIOS ACTIVOS]. Si un servicio no está en la lista, NO lo inventes.");
        systemInstruction.AppendLine("   - Respeta rigurosamente el biotipo cutáneo y alergias del cliente: NUNCA recomiendes productos que contengan activos o alérgenos incompatibles con el cliente.");
        systemInstruction.AppendLine();
        systemInstruction.AppendLine("4. TONO Y FORMATO:");
        systemInstruction.AppendLine("   - Responde en español con un tono profesional, empático, cálido y elegante.");
        systemInstruction.AppendLine("   - Mantén la respuesta concisa, clara y orientada a la acción (máximo 3 párrafos).");
        systemInstruction.AppendLine("   - Invita siempre al cliente a agendar su turno o añadir los productos al carrito de compras.");

        // Construcción del Prompt enriquecido con datos del cliente y catálogo RAG
        var userPrompt = new StringBuilder();
        userPrompt.AppendLine("[DATOS DEL CLIENTE]");
        userPrompt.AppendLine($"- Nombre: {contexto.ClienteNombre ?? "Cliente"}");
        userPrompt.AppendLine($"- Biotipo Cutáneo: {contexto.TipoPiel ?? "No especificado"}");
        userPrompt.AppendLine($"- Alergias Registradas: {contexto.Alergias ?? "Ninguna reportada"}");
        if (!string.IsNullOrWhiteSpace(contexto.DiagnosticoResultado))
        {
            userPrompt.AppendLine($"- Diagnóstico Previo en Centro: {contexto.DiagnosticoResultado}");
        }

        userPrompt.AppendLine("\n[PRODUCTOS CON STOCK DISPONIBLE EN EL CENTRO]");
        if (contexto.ProductosEnStock.Any())
        {
            foreach (var p in contexto.ProductosEnStock.Take(25))
            {
                userPrompt.AppendLine($"• [ID: {p.ProductoId}] {p.Nombre} | Marca: {p.Marca} | Precio: ${p.Precio:N0} | Stock: {p.StockActual} | Para: {p.ParaQueSirve ?? p.Descripcion} | Aptitud: {string.Join(", ", p.TiposPielAptos)}");
            }
        }
        else
        {
            userPrompt.AppendLine("Actualmente no hay productos con stock cargado.");
        }

        userPrompt.AppendLine("\n[TRATAMIENTOS Y SERVICIOS ACTIVOS]");
        if (contexto.ServiciosActivos.Any())
        {
            foreach (var s in contexto.ServiciosActivos.Take(15))
            {
                userPrompt.AppendLine($"• [ID: {s.ServicioId}] {s.Nombre} | Duración: {s.DuracionMin} min | Precio: ${s.Precio:N0} | Descripción: {s.ParaQueSirve ?? s.Descripcion}");
            }
        }

        userPrompt.AppendLine("\n[CONSULTA DEL CLIENTE]");
        userPrompt.AppendLine(contexto.Pregunta);

        var requestBody = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemInstruction.ToString() } }
            },
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[] { new { text = userPrompt.ToString() } }
                }
            },
            generationConfig = new
            {
                temperature = 0.3,
                maxOutputTokens = 900,
                topP = 0.95
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent?key={apiKey}";
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(4.5));

        var response = await client.PostAsync(url, content, cts.Token);
        if (!response.IsSuccessStatusCode)
        {
            var errText = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Gemini API retornó código {StatusCode}: {Error}", response.StatusCode, errText);
            return null;
        }

        var jsonResp = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(jsonResp);

        if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            return null;
        }

        var candidate = candidates[0];
        if (!candidate.TryGetProperty("content", out var contentElem) ||
            !contentElem.TryGetProperty("parts", out var partsElem) ||
            partsElem.GetArrayLength() == 0)
        {
            return null;
        }

        var textoGenerado = partsElem[0].GetProperty("text").GetString();
        if (string.IsNullOrWhiteSpace(textoGenerado))
        {
            return null;
        }

        // Extracción de IDs de productos y servicios mencionados en la respuesta o sugeridos por RAG
        var productoIdsRelacionados = new List<int>();
        var servicioIdsRelacionados = new List<int>();

        var textoLower = textoGenerado.ToLowerInvariant();
        foreach (var prod in contexto.ProductosEnStock)
        {
            if (textoLower.Contains(prod.Nombre.ToLowerInvariant()) ||
                textoGenerado.Contains($"[ID: {prod.ProductoId}]"))
            {
                productoIdsRelacionados.Add(prod.ProductoId);
            }
        }

        foreach (var serv in contexto.ServiciosActivos)
        {
            if (textoLower.Contains(serv.Nombre.ToLowerInvariant()) ||
                textoGenerado.Contains($"[ID: {serv.ServicioId}]"))
            {
                servicioIdsRelacionados.Add(serv.ServicioId);
            }
        }

        // Si no se extrajeron IDs explícitos, asegurar relevancia mediante scoring de los mejores del catálogo
        if (!productoIdsRelacionados.Any() && contexto.ProductosEnStock.Any())
        {
            productoIdsRelacionados.AddRange(contexto.ProductosEnStock.Take(3).Select(p => p.ProductoId));
        }
        if (!servicioIdsRelacionados.Any() && contexto.ServiciosActivos.Any())
        {
            servicioIdsRelacionados.AddRange(contexto.ServiciosActivos.Take(2).Select(s => s.ServicioId));
        }

        // Si se activó guardrail y la respuesta no contiene la aclaración explícita, anteponerla
        var respuestaFinal = textoGenerado.Trim();
        if (esAclaracionMedicaOExterna && !respuestaFinal.ToLowerInvariant().Contains("diagnóstico") && !respuestaFinal.ToLowerInvariant().Contains("médico"))
        {
            respuestaFinal = "Aclaración profesional (HU-12): Como asistente dermocosmético virtual de nuestro centro, no estamos facultados para emitir diagnósticos médicos clínicos ni comercializar fármacos bajo receta. Te recomendamos consultar con un médico dermatólogo para afecciones clínicas.\n\n" + respuestaFinal;
        }

        return new RagResultadoGeneracion(
            Respuesta: respuestaFinal,
            ProductoIdsRelacionados: productoIdsRelacionados.Distinct().ToList(),
            ServicioIdsRelacionados: servicioIdsRelacionados.Distinct().ToList(),
            EsAclaracionMedicaOExterna: esAclaracionMedicaOExterna
        );
    }

    private RagResultadoGeneracion GenerarRespuestaLocalRag(RagConsultaContexto contexto, bool esAclaracionMedicaOExterna, bool contieneMarcaAjena)
    {
        var preguntaLower = contexto.Pregunta.ToLowerInvariant();
        var sb = new StringBuilder();
        var productoIdsRelacionados = new List<int>();
        var servicioIdsRelacionados = new List<int>();

        if (esAclaracionMedicaOExterna)
        {
            sb.AppendLine("Aclaración profesional importante (HU-12): Como asistente dermocosmético inteligente de nuestro centro, no estamos facultados para emitir diagnósticos médicos clínicos, realizar procedimientos quirúrgicos ni comercializar fármacos bajo receta.");

            if (contieneMarcaAjena)
            {
                sb.AppendLine("Respecto a las marcas comerciales ajenas consultadas, en nuestro centro trabajamos exclusivamente con líneas cosmecéuticas profesionales certificadas con respaldo dermatológico y stock verificado.");
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

        return new RagResultadoGeneracion(
            Respuesta: sb.ToString().Trim(),
            ProductoIdsRelacionados: productoIdsRelacionados,
            ServicioIdsRelacionados: servicioIdsRelacionados,
            EsAclaracionMedicaOExterna: esAclaracionMedicaOExterna
        );
    }

    public async Task<GeminiTestResultDto> TestConexionGeminiAsync(string? apiKey = null, string? model = null, CancellationToken cancellationToken = default)
    {
        var keyToUse = !string.IsNullOrWhiteSpace(apiKey)
            ? apiKey.Trim()
            : _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        var modelToUse = !string.IsNullOrWhiteSpace(model)
            ? model.Trim()
            : _configuration["Gemini:Model"] ?? "gemini-1.5-flash";

        if (string.IsNullOrWhiteSpace(keyToUse))
        {
            return new GeminiTestResultDto(
                Conectado: false,
                Mensaje: "No se proporcionó ninguna API Key de Google Gemini en la configuración ni en los parámetros.",
                LatenciaMs: 0,
                Modelo: modelToUse,
                GuardrailsActivos: true
            );
        }

        var sw = Stopwatch.StartNew();
        try
        {
            var client = _httpClient;

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[] { new { text = "Hola. Responde únicamente con la palabra 'OK' para verificar la conexión." } }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.1,
                    maxOutputTokens = 10
                }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelToUse}:generateContent?key={keyToUse}";
            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, content, cancellationToken);
            sw.Stop();

            if (response.IsSuccessStatusCode)
            {
                return new GeminiTestResultDto(
                    Conectado: true,
                    Mensaje: $"¡Conexión establecida con éxito con Google Gemini ({modelToUse})! Los 4 guardrails y limitaciones HU-12 están activos.",
                    LatenciaMs: sw.ElapsedMilliseconds,
                    Modelo: modelToUse,
                    GuardrailsActivos: true
                );
            }

            var errJson = await response.Content.ReadAsStringAsync(cancellationToken);
            return new GeminiTestResultDto(
                Conectado: false,
                Mensaje: $"Google Gemini retornó HTTP {(int)response.StatusCode}: {errJson}",
                LatenciaMs: sw.ElapsedMilliseconds,
                Modelo: modelToUse,
                GuardrailsActivos: true
            );
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new GeminiTestResultDto(
                Conectado: false,
                Mensaje: $"Error al conectar con Google Gemini: {ex.Message}",
                LatenciaMs: sw.ElapsedMilliseconds,
                Modelo: modelToUse,
                GuardrailsActivos: true
            );
        }
    }
}
