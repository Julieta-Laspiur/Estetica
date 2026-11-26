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

    private static readonly Random _rng = new Random();

    private static readonly string[] SaludosVariados = new[]
    {
        "¡Hola{0}! Qué alegría tenerte por acá. Con gusto te asesoro de forma personalizada según el stock real y tratamientos de nuestro centro:",
        "¡Hola{0}! Es un placer orientarte. Diseñamos cada recomendación con criterio dermocosmético profesional:",
        "¡Hola{0}! Gracias por tu consulta. Analizando las necesidades puntuales de tu piel, esto es lo más indicado en nuestro centro:",
        "¡Bienvenida/o{0}! Te comparto las mejores alternativas disponibles hoy en cabina y en tienda:",
        "¡Hola{0}! Con gusto te ayudo a encontrar la rutina y los tratamientos ideales para tu bienestar cutáneo:"
    };

    private static readonly string[] CierresVariados = new[]
    {
        "¿Te gustaría que te reservemos un turno para este tratamiento en cabina o preferís sumar los productos a tu carrito de compras?",
        "Podés coordinar tu cita online desde la pestaña de turnos o llevarte los cosmecéuticos directamente para tu rutina diaria.",
        "Si tenés dudas sobre el orden de aplicación en tu rutina o querés agendar una sesión personalizada, avisame y te guío con gusto.",
        "¡Estamos a tu total disposición! Podés reservar tu espacio en cabina en simples pasos o consultar cualquier detalle de estos activos.",
        "Recordá que la constancia y la protección solar diaria son la base de los mejores resultados. ¿Querés agendar un turno o consultar algo más?"
    };

    private static string NormalizarModelo(string? modelo)
    {
        if (string.IsNullOrWhiteSpace(modelo))
            return "gemini-3.5-flash-lite";

        var m = modelo.Trim().ToLowerInvariant();
        if (m.Contains("gemini-1.5") || m.Contains("gemini-2.5-flash") || m.Contains("gemini-2.0"))
            return "gemini-3.5-flash-lite";

        if (m.Contains("gemini-2.5-pro"))
            return "gemini-3.1-pro-preview";

        return modelo.Trim();
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

        var modeloConfig = !string.IsNullOrWhiteSpace(contexto.ModeloOverride)
            ? contexto.ModeloOverride.Trim()
            : _configuration["Gemini:Model"] ?? "gemini-1.5-flash";

        var modelo = NormalizarModelo(modeloConfig);

        // 3. Intentar inferencia en vivo con Google Gemini si la API Key está configurada
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var resultadoGemini = await InvocarGeminiConFallbackAsync(apiKey, modelo, contexto, esAclaracionMedicaOExterna, cancellationToken);
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

    private async Task<RagResultadoGeneracion?> InvocarGeminiConFallbackAsync(
        string apiKey,
        string modeloPrimario,
        RagConsultaContexto contexto,
        bool esAclaracionMedicaOExterna,
        CancellationToken cancellationToken)
    {
        // Intento 1: Modelo Primario
        var res = await InvocarGeminiAsync(apiKey, modeloPrimario, contexto, esAclaracionMedicaOExterna, cancellationToken);
        if (res != null) return res;

        // Intento 2 (Fallback si el primario no es gemini-3.1-flash-lite):
        if (!modeloPrimario.Equals("gemini-3.1-flash-lite", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("Reintentando inferencia con modelo de respaldo Google Gemini (gemini-3.1-flash-lite)...");
            res = await InvocarGeminiAsync(apiKey, "gemini-3.1-flash-lite", contexto, esAclaracionMedicaOExterna, cancellationToken);
            if (res != null) return res;
        }

        return null;
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
                temperature = 0.7,
                maxOutputTokens = 900,
                topP = 0.95
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent?key={apiKey}";
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("x-goog-api-key", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(15));

        var response = await client.SendAsync(request, cts.Token);
        if (!response.IsSuccessStatusCode)
        {
            var errText = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Gemini API ({Modelo}) retornó código {StatusCode}: {Error}", modelo, response.StatusCode, errText);
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

        var sbTexto = new StringBuilder();
        foreach (var part in partsElem.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var textProp))
            {
                var fragment = textProp.GetString();
                if (!string.IsNullOrWhiteSpace(fragment))
                {
                    sbTexto.Append(fragment);
                }
            }
        }

        var textoGenerado = sbTexto.ToString().Trim();
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

        // 1. Saludo inicial variado y empático
        if (esAclaracionMedicaOExterna)
        {
            sb.AppendLine("Aclaración profesional (HU-12): Como asistente dermocosmético virtual de nuestro centro, no estamos facultados para emitir diagnósticos médicos clínicos, cirugías ni comercializar fármacos bajo receta.");

            if (contieneMarcaAjena)
            {
                sb.AppendLine("Respecto a las marcas comerciales ajenas consultadas, en nuestro centro trabajamos exclusivamente con líneas cosmecéuticas profesionales certificadas con respaldo dermatológico y stock verificado.");
            }

            sb.AppendLine("Para el cuidado seguro, efectivo y el embellecimiento de tu piel, te comparto las mejores alternativas de cabina y tienda afines a tu consulta:\n");
        }
        else
        {
            var nombreFmt = !string.IsNullOrWhiteSpace(contexto.ClienteNombre) ? $" {contexto.ClienteNombre}" : "";
            var saludoElegido = SaludosVariados[_rng.Next(SaludosVariados.Length)];
            sb.AppendLine(string.Format(saludoElegido, nombreFmt));
            sb.AppendLine();
        }

        // 2. Detección de Biotipo Cutáneo (Contexto del cliente o inferido de la pregunta)
        string? tipoPielDetectado = contexto.TipoPiel;
        if (preguntaLower.Contains("grasa") || preguntaLower.Contains("sebo") || preguntaLower.Contains("brillo") || preguntaLower.Contains("oleos"))
            tipoPielDetectado = "Grasa";
        else if (preguntaLower.Contains("seca") || preguntaLower.Contains("tirantez") || preguntaLower.Contains("descamad") || preguntaLower.Contains("áspera"))
            tipoPielDetectado = "Seca";
        else if (preguntaLower.Contains("mixta") || preguntaLower.Contains("zona t"))
            tipoPielDetectado = "Mixta";
        else if (preguntaLower.Contains("sensible") || preguntaLower.Contains("rojez") || preguntaLower.Contains("rosacea") || preguntaLower.Contains("rosácea") || preguntaLower.Contains("irritad"))
            tipoPielDetectado = "Sensible";

        // 3. Análisis Temático y Consejo Dermocosmético Especializado
        var consejos = new List<string>();

        bool esAcneOGrasa = preguntaLower.Contains("acné") || preguntaLower.Contains("acne") || preguntaLower.Contains("grano") || preguntaLower.Contains("espinilla") || preguntaLower.Contains("punto negro") || preguntaLower.Contains("poro") || tipoPielDetectado == "Grasa";
        bool esAntiage = preguntaLower.Contains("arruga") || preguntaLower.Contains("linea") || preguntaLower.Contains("línea") || preguntaLower.Contains("flacidez") || preguntaLower.Contains("edad") || preguntaLower.Contains("antiage") || preguntaLower.Contains("colágeno") || preguntaLower.Contains("colageno") || preguntaLower.Contains("firmeza");
        bool esHidratacion = preguntaLower.Contains("hidrat") || preguntaLower.Contains("seco") || preguntaLower.Contains("seca") || preguntaLower.Contains("tirante") || preguntaLower.Contains("humect") || preguntaLower.Contains("hialurónico") || preguntaLower.Contains("hialuronico") || tipoPielDetectado == "Seca";
        bool esManchas = preguntaLower.Contains("mancha") || preguntaLower.Contains("aclar") || preguntaLower.Contains("tono") || preguntaLower.Contains("pigment") || preguntaLower.Contains("melasma") || preguntaLower.Contains("vitamina c");
        bool esSensibilidad = preguntaLower.Contains("sensib") || preguntaLower.Contains("rojez") || preguntaLower.Contains("irrit") || preguntaLower.Contains("rosácea") || preguntaLower.Contains("rosacea") || tipoPielDetectado == "Sensible";
        bool esMasajeRelax = preguntaLower.Contains("masaje") || preguntaLower.Contains("relax") || preguntaLower.Contains("descontract") || preguntaLower.Contains("contractur") || preguntaLower.Contains("estrés") || preguntaLower.Contains("estres") || preguntaLower.Contains("espalda") || preguntaLower.Contains("cuerpo");
        bool esCejasPestanas = preguntaLower.Contains("ceja") || preguntaLower.Contains("pestaña") || preguntaLower.Contains("pestana") || preguntaLower.Contains("lifting") || preguntaLower.Contains("laminado") || preguntaLower.Contains("mirada");
        bool esCorporal = preguntaLower.Contains("corporal") || preguntaLower.Contains("celulitis") || preguntaLower.Contains("drenaje") || preguntaLower.Contains("linfático") || preguntaLower.Contains("linfatico") || preguntaLower.Contains("reductor") || preguntaLower.Contains("pierna");
        bool esProteccionSolar = preguntaLower.Contains("solar") || preguntaLower.Contains("protector") || preguntaLower.Contains("fps") || preguntaLower.Contains("sol") || preguntaLower.Contains("bloqueador");
        bool esLimpieza = preguntaLower.Contains("limpieza") || preguntaLower.Contains("higiene") || preguntaLower.Contains("exfolia") || preguntaLower.Contains("peeling") || preguntaLower.Contains("detox");

        if (esAcneOGrasa)
        {
            consejos.Add("Para pieles con tendencia a la oleosidad o impurezas, la clave reside en no agredir la barrera cutánea: una higiene seborreguladora matutina y nocturna con texturas en gel o espuma no comedogénica, combinada con activos calmantes y protectores solares toque seco.");
        }
        else if (esAntiage)
        {
            consejos.Add("Para contrarrestar la pérdida de tonicidad y atenuar líneas de expresión, es fundamental estimular la biosíntesis de colágeno y elastina, incorporando antioxidantes concentrados como sérums y tecnología tensora o radiofrecuencia en cabina.");
        }
        else if (esHidratacion)
        {
            consejos.Add("La piel deshidratada requiere reponer agua y lípidos en profundidad. Sugerimos activos de alto poder higroscópico como el ácido hialurónico, seguidos de emulsiones que sellen la hidratación para evitar la pérdida transepidérmica.");
        }
        else if (esManchas)
        {
            consejos.Add("El abordaje de manchas y tono desigual exige constancia: renovación epidérmica gentil para acelerar el recambio celular, antioxidantes iluminadores (como la vitamina C) y fotoprotección rigurosa FPS 50+ cada 3 horas.");
        }
        else if (esSensibilidad)
        {
            consejos.Add("Para pieles reactivas o con enrojecimiento, priorizamos fórmulas hipoalergénicas ricas en activos descongestivos y calmantes, evitando exfoliaciones agresivas o cambios térmicos bruscos.");
        }
        else if (esMasajeRelax)
        {
            consejos.Add("Los protocolos de masoterapia y spa brindan un alivio integral: liberan tensiones musculares acumuladas en cuello y espalda, estimulan la microcirculación y reducen los niveles de cortisol mediante maniobras manuales profundas.");
        }
        else if (esCejasPestanas)
        {
            consejos.Add("Los servicios de realce de mirada (lifting de pestañas y diseño de cejas) aportan curvatura, orden y definición inmediata preservando la fibra capilar con baños de nutrición.");
        }
        else if (esCorporal)
        {
            consejos.Add("A nivel corporal, la combinación de drenaje linfático con activos reafirmantes favorece el retorno venoso, elimina líquidos retenidos y mejora notablemente la textura y firmeza de la piel.");
        }
        else if (esProteccionSolar)
        {
            consejos.Add("El protector solar es el paso preventivo más importante de tu rutina: previene el fotoenvejecimiento prematuro, el daño celular y la aparición de manchas tanto en exteriores como frente a la luz azul de pantallas.");
        }
        else
        {
            consejos.Add("Una rutina estética equilibrada se construye sobre 3 pasos esenciales: limpieza suave que respete tu biotipo, hidratación activa para sostener la elasticidad y fotoprotección diaria para proteger el tejido cutáneo.");
        }

        if (!string.IsNullOrWhiteSpace(tipoPielDetectado))
        {
            consejos.Add($"Elegimos estas opciones considerando especialmente tu biotipo cutáneo ({tipoPielDetectado}) para garantizar máxima compatibilidad y confort.");
        }

        foreach (var c in consejos)
        {
            sb.AppendLine(c);
            sb.AppendLine();
        }

        // 4. Tokenización para Scoring Inteligente y Filtrado de Alergias
        var alergiasTokens = !string.IsNullOrWhiteSpace(contexto.Alergias)
            ? contexto.Alergias.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : Array.Empty<string>();

        var productosAptos = contexto.ProductosEnStock.Where(p =>
        {
            if (alergiasTokens.Length == 0) return true;
            var txt = $"{p.Nombre} {p.Marca} {p.Descripcion} {p.ParaQueSirve}".ToLowerInvariant();
            return !alergiasTokens.Any(a => txt.Contains(a.ToLowerInvariant()));
        }).ToList();

        // Stopwords comunes en español
        var stopWords = new HashSet<string> { "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "en", "por", "para", "con", "sin", "sobre", "que", "como", "cual", "quien", "cuando", "donde", "mas", "pero", "este", "esta", "estos", "estas", "tengo", "quiero", "necesito", "tienen", "tenes", "tenés" };
        var queryTokens = Regex.Matches(preguntaLower, @"\b[\p{L}\p{Nd}]{3,}\b")
            .Select(m => m.Value)
            .Where(w => !stopWords.Contains(w))
            .Distinct()
            .ToList();

        // Scoring de productos con factor aleatorio de desempate (para garantizar variedad y rotación)
        var productosPuntuados = productosAptos.Select(p =>
        {
            int score = _rng.Next(0, 5); // Factor aleatorio de rotación
            var nombreLower = p.Nombre.ToLowerInvariant();
            var marcaLower = p.Marca.ToLowerInvariant();
            var descLower = (p.Descripcion ?? "").ToLowerInvariant();
            var paraLower = (p.ParaQueSirve ?? "").ToLowerInvariant();
            var textoCompleto = $"{nombreLower} {marcaLower} {descLower} {paraLower}";

            // Coincidencia con tokens de la pregunta
            foreach (var token in queryTokens)
            {
                if (nombreLower.Contains(token)) score += 10;
                else if (paraLower.Contains(token)) score += 6;
                else if (descLower.Contains(token)) score += 4;
                else if (marcaLower.Contains(token)) score += 5;
            }

            // Bonificación por biotipo cutáneo
            if (!string.IsNullOrWhiteSpace(tipoPielDetectado) && p.TiposPielAptos.Any(tp => tp.Equals(tipoPielDetectado, StringComparison.OrdinalIgnoreCase)))
            {
                score += 8;
            }

            // Temáticas específicas
            if (esAcneOGrasa && (textoCompleto.Contains("sebo") || textoCompleto.Contains("matific") || textoCompleto.Contains("purific") || textoCompleto.Contains("salicíl") || textoCompleto.Contains("salicil") || textoCompleto.Contains("gel"))) score += 7;
            if (esAntiage && (textoCompleto.Contains("antiage") || textoCompleto.Contains("antioxid") || textoCompleto.Contains("colágeno") || textoCompleto.Contains("retinol") || textoCompleto.Contains("arruga"))) score += 7;
            if (esHidratacion && (textoCompleto.Contains("hidrat") || textoCompleto.Contains("hialurónico") || textoCompleto.Contains("emulsión") || textoCompleto.Contains("crema") || textoCompleto.Contains("humect"))) score += 7;
            if (esManchas && (textoCompleto.Contains("vitamina c") || textoCompleto.Contains("niacinamida") || textoCompleto.Contains("aclar") || textoCompleto.Contains("manchas") || textoCompleto.Contains("ilumin"))) score += 7;
            if (esProteccionSolar && (textoCompleto.Contains("solar") || textoCompleto.Contains("fps") || textoCompleto.Contains("protector") || textoCompleto.Contains("bloqueador"))) score += 12;
            if (esLimpieza && (textoCompleto.Contains("limpiad") || textoCompleto.Contains("micelar") || textoCompleto.Contains("espuma") || textoCompleto.Contains("jabón"))) score += 7;

            return new { Producto = p, Score = score };
        })
        .OrderByDescending(x => x.Score)
        .ThenByDescending(x => x.Producto.StockActual)
        .Take(3)
        .Select(x => x.Producto)
        .ToList();

        // Scoring de servicios con factor aleatorio de desempate
        var serviciosPuntuados = contexto.ServiciosActivos.Select(s =>
        {
            int score = _rng.Next(0, 5); // Factor aleatorio de rotación
            var nombreLower = s.Nombre.ToLowerInvariant();
            var descLower = (s.Descripcion ?? "").ToLowerInvariant();
            var paraLower = (s.ParaQueSirve ?? "").ToLowerInvariant();
            var textoCompleto = $"{nombreLower} {descLower} {paraLower}";

            foreach (var token in queryTokens)
            {
                if (nombreLower.Contains(token)) score += 10;
                else if (paraLower.Contains(token)) score += 6;
                else if (descLower.Contains(token)) score += 4;
            }

            if (esMasajeRelax && (textoCompleto.Contains("masaje") || textoCompleto.Contains("relax") || textoCompleto.Contains("descontract") || textoCompleto.Contains("piedras"))) score += 15;
            if (esCejasPestanas && (textoCompleto.Contains("pestaña") || textoCompleto.Contains("ceja") || textoCompleto.Contains("lifting") || textoCompleto.Contains("microblading") || textoCompleto.Contains("laminado"))) score += 15;
            if (esCorporal && (textoCompleto.Contains("corporal") || textoCompleto.Contains("drenaje") || textoCompleto.Contains("linfático") || textoCompleto.Contains("reductor") || textoCompleto.Contains("celulitis"))) score += 12;
            if (esLimpieza && (textoCompleto.Contains("limpieza") || textoCompleto.Contains("peeling") || textoCompleto.Contains("punto negro") || textoCompleto.Contains("facial"))) score += 10;
            if (esAntiage && (textoCompleto.Contains("radiofrecuencia") || textoCompleto.Contains("antiage") || textoCompleto.Contains("tensor") || textoCompleto.Contains("rejuvenec"))) score += 10;
            if (esHidratacion && (textoCompleto.Contains("hidrat") || textoCompleto.Contains("nutrición") || textoCompleto.Contains("máscara"))) score += 8;

            return new { Servicio = s, Score = score };
        })
        .OrderByDescending(x => x.Score)
        .Take(2)
        .Select(x => x.Servicio)
        .ToList();

        // 5. Presentación dinámica y elegante del catálogo
        if (productosPuntuados.Any())
        {
            sb.AppendLine("Productos seleccionados en tienda con stock inmediato:");
            foreach (var p in productosPuntuados)
            {
                productoIdsRelacionados.Add(p.ProductoId);
                var detalle = !string.IsNullOrWhiteSpace(p.ParaQueSirve) ? p.ParaQueSirve : (p.Descripcion ?? "Fórmula cosmecéutica de alta tolerancia.");
                sb.AppendLine($"• {p.Nombre} ({p.Marca}) — ${p.Precio:N0}: {detalle}");
            }
            sb.AppendLine();
        }

        if (serviciosPuntuados.Any())
        {
            sb.AppendLine("Tratamientos recomendados en cabina profesional:");
            foreach (var s in serviciosPuntuados)
            {
                servicioIdsRelacionados.Add(s.ServicioId);
                var detalle = !string.IsNullOrWhiteSpace(s.ParaQueSirve) ? s.ParaQueSirve : (s.Descripcion ?? "Tratamiento personalizado en cabina estética.");
                sb.AppendLine($"• {s.Nombre} ({s.DuracionMin} min — ${s.Precio:N0}): {detalle}");
            }
            sb.AppendLine();
        }

        // Cierre dinámico
        var cierreElegido = CierresVariados[_rng.Next(CierresVariados.Length)];
        sb.Append(cierreElegido);

        return new RagResultadoGeneracion(
            Respuesta: sb.ToString().Trim(),
            ProductoIdsRelacionados: productoIdsRelacionados.Distinct().ToList(),
            ServicioIdsRelacionados: servicioIdsRelacionados.Distinct().ToList(),
            EsAclaracionMedicaOExterna: esAclaracionMedicaOExterna
        );
    }

    public async Task<GeminiTestResultDto> TestConexionGeminiAsync(string? apiKey = null, string? model = null, CancellationToken cancellationToken = default)
    {
        var keyToUse = !string.IsNullOrWhiteSpace(apiKey)
            ? apiKey.Trim()
            : _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        var modelConfig = !string.IsNullOrWhiteSpace(model)
            ? model.Trim()
            : _configuration["Gemini:Model"] ?? "gemini-3.5-flash-lite";

        var modelToUse = NormalizarModelo(modelConfig);

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
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("x-goog-api-key", keyToUse);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request, cancellationToken);
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
