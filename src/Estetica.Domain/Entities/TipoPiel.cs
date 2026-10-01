using Estetica.Domain.Enums;

namespace Estetica.Domain.Entities;

public class TipoPiel
{
    public int TipoPielId { get; set; }
    public TipoPielEnum Nombre { get; set; } = TipoPielEnum.Normal;

    // Relaciones de navegación
    public ICollection<DiagnosticoPiel> DiagnosticosPiel { get; set; } = new List<DiagnosticoPiel>();
    public ICollection<ProductoTipoPiel> ProductoTiposPiel { get; set; } = new List<ProductoTipoPiel>();
}
