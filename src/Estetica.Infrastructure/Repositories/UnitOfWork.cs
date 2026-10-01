using Estetica.Application.Interfaces;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace Estetica.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _currentTransaction;

    private IUsuarioRepository? _usuarios;
    private IProfesionalRepository? _profesionales;
    private ITurnoRepository? _turnos;
    private IServicioRepository? _servicios;
    private ICabinaRepository? _cabinas;
    private IProductoRepository? _productos;
    private ITipoPielRepository? _tiposPiel;
    private ICarritoRepository? _carritos;
    private IOrdenCompraRepository? _ordenesCompra;
    private IPagoRepository? _pagos;
    private ICuponRepository? _cupones;
    private IFidelizacionRepository? _fidelizaciones;
    private IDiagnosticoPielRepository? _diagnosticosPiel;
    private INotificacionRepository? _notificaciones;
    private IConversacionIARepository? _conversacionesIA;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUsuarioRepository Usuarios => _usuarios ??= new UsuarioRepository(_context);
    public IProfesionalRepository Profesionales => _profesionales ??= new ProfesionalRepository(_context);
    public ITurnoRepository Turnos => _turnos ??= new TurnoRepository(_context);
    public IServicioRepository Servicios => _servicios ??= new ServicioRepository(_context);
    public ICabinaRepository Cabinas => _cabinas ??= new CabinaRepository(_context);
    public IProductoRepository Productos => _productos ??= new ProductoRepository(_context);
    public ITipoPielRepository TiposPiel => _tiposPiel ??= new TipoPielRepository(_context);
    public ICarritoRepository Carritos => _carritos ??= new CarritoRepository(_context);
    public IOrdenCompraRepository OrdenesCompra => _ordenesCompra ??= new OrdenCompraRepository(_context);
    public IPagoRepository Pagos => _pagos ??= new PagoRepository(_context);
    public ICuponRepository Cupones => _cupones ??= new CuponRepository(_context);
    public IFidelizacionRepository Fidelizaciones => _fidelizaciones ??= new FidelizacionRepository(_context);
    public IDiagnosticoPielRepository DiagnosticosPiel => _diagnosticosPiel ??= new DiagnosticoPielRepository(_context);
    public INotificacionRepository Notificaciones => _notificaciones ??= new NotificacionRepository(_context);
    public IConversacionIARepository ConversacionesIA => _conversacionesIA ??= new ConversacionIARepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction != null)
        {
            return;
        }

        _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            if (_currentTransaction != null)
            {
                await _currentTransaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.RollbackAsync(cancellationToken);
            }
        }
        finally
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }
    }

    public void Dispose()
    {
        _currentTransaction?.Dispose();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
