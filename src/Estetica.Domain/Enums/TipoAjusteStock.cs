namespace Estetica.Domain.Enums;

public enum TipoAjusteStock
{
    IngresoMercaderia,      // Recepción de productos de proveedores (+Cantidad)
    AjusteManualPositivo,   // Incremento por corrección de inventario (+Cantidad)
    AjusteManualNegativo,   // Disminución por corrección de inventario (-Cantidad)
    MermaODaño,             // Disminución por rotura, daño o vencimiento (-Cantidad)
    InventarioFisicoTotal   // Seteo del valor absoluto exacto tras arqueo general (=Cantidad)
}
