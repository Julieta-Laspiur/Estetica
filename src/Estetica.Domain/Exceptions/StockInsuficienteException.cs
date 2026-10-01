namespace Estetica.Domain.Exceptions;

public class StockInsuficienteException : DomainException
{
    public int ProductoId { get; }
    public string NombreProducto { get; }
    public int StockDisponible { get; }
    public int CantidadSolicitada { get; }

    public StockInsuficienteException(int productoId, string nombreProducto, int stockDisponible, int cantidadSolicitada)
        : base($"Stock insuficiente para el producto '{nombreProducto}' (ID: {productoId}). Disponible: {stockDisponible}, solicitado: {cantidadSolicitada}.")
    {
        ProductoId = productoId;
        NombreProducto = nombreProducto;
        StockDisponible = stockDisponible;
        CantidadSolicitada = cantidadSolicitada;
    }
}
