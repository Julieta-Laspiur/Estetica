using Estetica.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Profesional> Profesionales => Set<Profesional>();
    public DbSet<Cabina> Cabinas => Set<Cabina>();
    public DbSet<Turno> Turnos => Set<Turno>();
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<TurnoServicio> TurnosServicios => Set<TurnoServicio>();
    public DbSet<HistorialTratamiento> HistorialesTratamiento => Set<HistorialTratamiento>();
    public DbSet<TipoPiel> TiposPiel => Set<TipoPiel>();
    public DbSet<DiagnosticoPiel> DiagnosticosPiel => Set<DiagnosticoPiel>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<ProductoTipoPiel> ProductosTiposPiel => Set<ProductoTipoPiel>();
    public DbSet<Carrito> Carritos => Set<Carrito>();
    public DbSet<ItemCarrito> ItemsCarrito => Set<ItemCarrito>();
    public DbSet<OrdenCompra> OrdenesCompra => Set<OrdenCompra>();
    public DbSet<DetalleOrden> DetallesOrden => Set<DetalleOrden>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<QrToken> QrTokens => Set<QrToken>();
    public DbSet<Cupon> Cupones => Set<Cupon>();
    public DbSet<Fidelizacion> Fidelizaciones => Set<Fidelizacion>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<ConversacionIA> ConversacionesIA => Set<ConversacionIA>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        base.ConfigureConventions(configurationBuilder);

        // Almacenar todos los enums como texto (string/varchar) en PostgreSQL
        configurationBuilder.Properties<Enum>().HaveConversion<string>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Claves primarias
        modelBuilder.Entity<Usuario>().HasKey(u => u.UsuarioId);
        modelBuilder.Entity<Profesional>().HasKey(p => p.ProfesionalId);
        modelBuilder.Entity<Cabina>().HasKey(c => c.CabinaId);
        modelBuilder.Entity<Turno>().HasKey(t => t.TurnoId);
        modelBuilder.Entity<Servicio>().HasKey(s => s.ServicioId);
        modelBuilder.Entity<HistorialTratamiento>().HasKey(h => h.HistorialId);
        modelBuilder.Entity<DiagnosticoPiel>().HasKey(d => d.DiagnosticoId);
        modelBuilder.Entity<TipoPiel>().HasKey(t => t.TipoPielId);
        modelBuilder.Entity<Producto>().HasKey(p => p.ProductoId);
        modelBuilder.Entity<Carrito>().HasKey(c => c.CarritoId);
        modelBuilder.Entity<ItemCarrito>().HasKey(i => i.ItemCarritoId);
        modelBuilder.Entity<OrdenCompra>().HasKey(o => o.OrdenId);
        modelBuilder.Entity<DetalleOrden>().HasKey(d => d.DetalleId);
        modelBuilder.Entity<Pago>().HasKey(p => p.PagoId);
        modelBuilder.Entity<QrToken>().HasKey(q => q.QrTokenId);
        modelBuilder.Entity<Cupon>().HasKey(c => c.CuponId);
        modelBuilder.Entity<Fidelizacion>().HasKey(f => f.FidelizacionId);
        modelBuilder.Entity<Notificacion>().HasKey(n => n.NotificacionId);
        modelBuilder.Entity<ConversacionIA>().HasKey(c => c.ConversacionId);

        // Claves primarias compuestas
        modelBuilder.Entity<TurnoServicio>()
            .HasKey(ts => new { ts.TurnoId, ts.ServicioId });

        modelBuilder.Entity<ProductoTipoPiel>()
            .HasKey(pt => new { pt.ProductoId, pt.TipoPielId });

        // Configuración de longitud para columnas de Enums almacenadas como texto
        modelBuilder.Entity<Usuario>()
            .Property(u => u.Rol)
            .HasMaxLength(50);

        modelBuilder.Entity<Cabina>()
            .Property(c => c.Estado)
            .HasMaxLength(50);

        modelBuilder.Entity<Turno>()
            .Property(t => t.Estado)
            .HasMaxLength(50);

        modelBuilder.Entity<Carrito>()
            .Property(c => c.Estado)
            .HasMaxLength(50);

        modelBuilder.Entity<OrdenCompra>()
            .Property(o => o.Estado)
            .HasMaxLength(50);

        modelBuilder.Entity<Pago>()
            .Property(p => p.Estado)
            .HasMaxLength(50);

        modelBuilder.Entity<Pago>()
            .Property(p => p.Proveedor)
            .HasMaxLength(50);

        modelBuilder.Entity<Cupon>()
            .Property(c => c.Estado)
            .HasMaxLength(50);

        modelBuilder.Entity<Notificacion>()
            .Property(n => n.Tipo)
            .HasMaxLength(50);

        modelBuilder.Entity<TipoPiel>()
            .Property(tp => tp.Nombre)
            .HasMaxLength(50);

        // Precisión para columnas decimales
        modelBuilder.Entity<Servicio>()
            .Property(s => s.Precio)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Turno>()
            .Property(t => t.Total)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Producto>()
            .Property(p => p.Precio)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ItemCarrito>()
            .Property(i => i.PrecioUnitario)
            .HasPrecision(18, 2);

        modelBuilder.Entity<OrdenCompra>()
            .Property(o => o.Total)
            .HasPrecision(18, 2);

        modelBuilder.Entity<DetalleOrden>()
            .Property(d => d.PrecioUnitario)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Pago>()
            .Property(p => p.Monto)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Cupon>()
            .Property(c => c.Descuento)
            .HasPrecision(18, 2);

        // Índices únicos
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Cupon>()
            .HasIndex(c => c.Codigo)
            .IsUnique();

        // Relaciones: Usuario - Profesional (1 a 0..1)
        modelBuilder.Entity<Profesional>()
            .HasOne(p => p.Usuario)
            .WithOne(u => u.Profesional)
            .HasForeignKey<Profesional>(p => p.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relaciones: Usuario - Fidelizacion (1 a 0..1)
        modelBuilder.Entity<Fidelizacion>()
            .HasOne(f => f.Usuario)
            .WithOne(u => u.Fidelizacion)
            .HasForeignKey<Fidelizacion>(f => f.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relaciones: Turno
        modelBuilder.Entity<Turno>()
            .HasOne(t => t.Usuario)
            .WithMany(u => u.Turnos)
            .HasForeignKey(t => t.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Turno>()
            .HasOne(t => t.Profesional)
            .WithMany(p => p.Turnos)
            .HasForeignKey(t => t.ProfesionalId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Turno>()
            .HasOne(t => t.Cabina)
            .WithMany(c => c.Turnos)
            .HasForeignKey(t => t.CabinaId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relaciones: TurnoServicio
        modelBuilder.Entity<TurnoServicio>()
            .HasOne(ts => ts.Turno)
            .WithMany(t => t.TurnoServicios)
            .HasForeignKey(ts => ts.TurnoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TurnoServicio>()
            .HasOne(ts => ts.Servicio)
            .WithMany(s => s.TurnoServicios)
            .HasForeignKey(ts => ts.ServicioId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relaciones: HistorialTratamiento
        modelBuilder.Entity<HistorialTratamiento>()
            .HasOne(h => h.Usuario)
            .WithMany(u => u.HistorialesTratamiento)
            .HasForeignKey(h => h.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<HistorialTratamiento>()
            .HasOne(h => h.Profesional)
            .WithMany(p => p.HistorialesTratamiento)
            .HasForeignKey(h => h.ProfesionalId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<HistorialTratamiento>()
            .HasOne(h => h.Turno)
            .WithMany(t => t.HistorialesTratamiento)
            .HasForeignKey(h => h.TurnoId)
            .OnDelete(DeleteBehavior.SetNull);

        // Relaciones: DiagnosticoPiel
        modelBuilder.Entity<DiagnosticoPiel>()
            .HasOne(d => d.Usuario)
            .WithMany(u => u.DiagnosticosPiel)
            .HasForeignKey(d => d.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DiagnosticoPiel>()
            .HasOne(d => d.TipoPiel)
            .WithMany(t => t.DiagnosticosPiel)
            .HasForeignKey(d => d.TipoPielId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relaciones: ProductoTipoPiel
        modelBuilder.Entity<ProductoTipoPiel>()
            .HasOne(pt => pt.Producto)
            .WithMany(p => p.ProductoTiposPiel)
            .HasForeignKey(pt => pt.ProductoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProductoTipoPiel>()
            .HasOne(pt => pt.TipoPiel)
            .WithMany(t => t.ProductoTiposPiel)
            .HasForeignKey(pt => pt.TipoPielId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relaciones: Carrito e ItemCarrito
        modelBuilder.Entity<Carrito>()
            .HasOne(c => c.Usuario)
            .WithMany(u => u.Carritos)
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemCarrito>()
            .HasOne(i => i.Carrito)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CarritoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemCarrito>()
            .HasOne(i => i.Producto)
            .WithMany(p => p.ItemsCarrito)
            .HasForeignKey(i => i.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relaciones: OrdenCompra y DetalleOrden
        modelBuilder.Entity<OrdenCompra>()
            .HasOne(o => o.Usuario)
            .WithMany(u => u.OrdenesCompra)
            .HasForeignKey(o => o.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DetalleOrden>()
            .HasOne(d => d.OrdenCompra)
            .WithMany(o => o.Detalles)
            .HasForeignKey(d => d.OrdenId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DetalleOrden>()
            .HasOne(d => d.Producto)
            .WithMany(p => p.DetallesOrden)
            .HasForeignKey(d => d.ProductoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relaciones: Pago y QrToken
        modelBuilder.Entity<Pago>()
            .HasOne(p => p.OrdenCompra)
            .WithMany(o => o.Pagos)
            .HasForeignKey(p => p.OrdenId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Pago>()
            .HasOne(p => p.Turno)
            .WithMany(t => t.Pagos)
            .HasForeignKey(p => p.TurnoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Pago>()
            .HasOne(p => p.QrToken)
            .WithOne(q => q.Pago)
            .HasForeignKey<QrToken>(q => q.PagoId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relaciones: Cupon, Notificacion, ConversacionIA
        modelBuilder.Entity<Cupon>()
            .HasOne(c => c.Usuario)
            .WithMany(u => u.Cupones)
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Notificacion>()
            .HasOne(n => n.Usuario)
            .WithMany(u => u.Notificaciones)
            .HasForeignKey(n => n.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ConversacionIA>()
            .HasOne(ci => ci.Usuario)
            .WithMany(u => u.ConversacionesIA)
            .HasForeignKey(ci => ci.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        // Permite aplicar configuraciones adicionales vía IEntityTypeConfiguration
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}