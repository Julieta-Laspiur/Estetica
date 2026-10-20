using Estetica.Application.Interfaces;
using QRCoder;

namespace Estetica.Infrastructure.Services;

public class QrCodeGeneratorService : IQrCodeGeneratorService
{
    public string GenerarQrSvg(string contenido)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.Q);
        var svgQrCode = new SvgQRCode(qrCodeData);
        return svgQrCode.GetGraphic(20);
    }

    public string GenerarQrPngDataUri(string contenido)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.Q);
        var pngByteQrCode = new PngByteQRCode(qrCodeData);
        var qrCodeBytes = pngByteQrCode.GetGraphic(20);
        var base64 = Convert.ToBase64String(qrCodeBytes);
        return $"data:image/png;base64,{base64}";
    }
}
