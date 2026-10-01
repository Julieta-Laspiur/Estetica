namespace Estetica.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUsuarioRepository Usuarios { get; }
    IProfesionalRepository Profesionales { get; }
    ITurnoRepository Turnos { get; }
    IServicioRepository Servicios { get; }
    ICabinaRepository Cabinas { get; }
    IProductoRepository Productos { get; }
    ITipoPielRepository TiposPiel { get; }
    ICarritoRepository Carritos { get; }
    IOrdenCompraRepository OrdenesCompra { get; }
    IPagoRepository Pagos { get; }
    ICuponRepository Cupones { get; }
    IFidelizacionRepository Fidelizaciones { get; }
    IDiagnosticoPielRepository DiagnosticosPiel { get; }
    INotificacionRepository Notificaciones { get; }
    IConversacionIARepository ConversacionesIA { get; }
    IHistorialTratamientoRepository HistorialesTratamiento { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
