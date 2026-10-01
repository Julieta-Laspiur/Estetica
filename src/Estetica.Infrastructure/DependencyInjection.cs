using Estetica.Application.Interfaces;
using Estetica.Infrastructure.Repositories;
using Estetica.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Estetica.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureRepositories(this IServiceCollection services)
    {
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IProfesionalRepository, ProfesionalRepository>();
        services.AddScoped<ITurnoRepository, TurnoRepository>();
        services.AddScoped<IServicioRepository, ServicioRepository>();
        services.AddScoped<ICabinaRepository, CabinaRepository>();
        services.AddScoped<IProductoRepository, ProductoRepository>();
        services.AddScoped<ITipoPielRepository, TipoPielRepository>();
        services.AddScoped<ICarritoRepository, CarritoRepository>();
        services.AddScoped<IOrdenCompraRepository, OrdenCompraRepository>();
        services.AddScoped<IPagoRepository, PagoRepository>();
        services.AddScoped<ICuponRepository, CuponRepository>();
        services.AddScoped<IFidelizacionRepository, FidelizacionRepository>();
        services.AddScoped<IDiagnosticoPielRepository, DiagnosticoPielRepository>();
        services.AddScoped<INotificacionRepository, NotificacionRepository>();
        services.AddScoped<IConversacionIARepository, ConversacionIARepository>();
        services.AddScoped<IHistorialTratamientoRepository, HistorialTratamientoRepository>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Servicios externos y transversales
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IPasarelaPagoService, PasarelaPagoService>();
        services.AddScoped<IIAService, IAService>();

        return services;
    }
}
