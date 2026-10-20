namespace Estetica.Application.Interfaces;

public interface IQrCodeGeneratorService
{
    /// <summary>
    /// Genera la representación gráfica del código QR en formato SVG.
    /// </summary>
    string GenerarQrSvg(string contenido);

    /// <summary>
    /// Genera el código QR como un Data URI PNG listo para utilizar en la etiqueta img de HTML / React (data:image/png;base64,...).
    /// </summary>
    string GenerarQrPngDataUri(string contenido);
}
