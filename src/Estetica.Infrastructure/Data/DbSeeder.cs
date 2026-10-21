using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Estetica.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            // 1. Tipos de Piel
            if (!await context.TiposPiel.AnyAsync())
            {
                var tipos = new[]
                {
                    new TipoPiel { Nombre = TipoPielEnum.Normal },
                    new TipoPiel { Nombre = TipoPielEnum.Seca },
                    new TipoPiel { Nombre = TipoPielEnum.Grasa },
                    new TipoPiel { Nombre = TipoPielEnum.Mixta },
                    new TipoPiel { Nombre = TipoPielEnum.Sensible }
                };
                await context.TiposPiel.AddRangeAsync(tipos);
                await context.SaveChangesAsync();
            }

            // 2. Cabinas
            if (!await context.Cabinas.AnyAsync())
            {
                var cabinas = new[]
                {
                    new Cabina { Nombre = "Cabina 1 - Facial", Descripcion = "Equipada con vaporizador de ozono y radiofrecuencia", Estado = EstadoCabina.Disponible },
                    new Cabina { Nombre = "Cabina 2 - Corporal", Descripcion = "Equipada para masajes, drenaje y aparatología corporal", Estado = EstadoCabina.Disponible },
                    new Cabina { Nombre = "Cabina 3 - Spa Relax", Descripcion = "Ambiente holístico para aromaterapia y relajación", Estado = EstadoCabina.Disponible }
                };
                await context.Cabinas.AddRangeAsync(cabinas);
                await context.SaveChangesAsync();
            }

            // 3. Usuarios base (Admin, Profesional, Cliente)
            Usuario? adminUser = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "admin@estetica.com");
            if (adminUser == null)
            {
                adminUser = new Usuario
                {
                    Nombre = "Administradora",
                    Apellido = "Principal",
                    Email = "admin@estetica.com",
                    Telefono = "+5491112345678",
                    Rol = RolUsuario.Administrador,
                    PasswordHash = passwordHasher.Hash("Admin123!"),
                    Activo = true,
                    FechaRegistro = DateTime.UtcNow
                };
                await context.Usuarios.AddAsync(adminUser);
                await context.SaveChangesAsync();
            }

            Usuario? profUser = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "profesional@estetica.com");
            if (profUser == null)
            {
                profUser = new Usuario
                {
                    Nombre = "Dra. Camila",
                    Apellido = "Rossi",
                    Email = "profesional@estetica.com",
                    Telefono = "+5491122334455",
                    Rol = RolUsuario.Profesional,
                    PasswordHash = passwordHasher.Hash("Pro123!"),
                    Activo = true,
                    FechaRegistro = DateTime.UtcNow
                };
                await context.Usuarios.AddAsync(profUser);
                await context.SaveChangesAsync();

                var profesional = new Profesional
                {
                    UsuarioId = profUser.UsuarioId,
                    Especialidad = "Dermatocosmiatría y Estética Avanzada",
                    Activo = true
                };
                await context.Profesionales.AddAsync(profesional);
                await context.SaveChangesAsync();
            }

            Usuario? clienteUser = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "cliente@estetica.com");
            if (clienteUser == null)
            {
                clienteUser = new Usuario
                {
                    Nombre = "Valentina",
                    Apellido = "Gómez",
                    Email = "cliente@estetica.com",
                    Telefono = "+5491199887766",
                    Rol = RolUsuario.Cliente,
                    PasswordHash = passwordHasher.Hash("Cliente123!"),
                    Activo = true,
                    FechaRegistro = DateTime.UtcNow
                };
                await context.Usuarios.AddAsync(clienteUser);
                await context.SaveChangesAsync();

                // Tarjeta de fidelización inicial con 3 estampitas
                var fidelizacion = new Fidelizacion
                {
                    UsuarioId = clienteUser.UsuarioId,
                    EstampitasActuales = 3,
                    UltimaActualizacion = DateTime.UtcNow
                };
                await context.Fidelizaciones.AddAsync(fidelizacion);
                await context.SaveChangesAsync();
            }

            // 4. Servicios estéticos
            if (!await context.Servicios.AnyAsync())
            {
                var servicios = new[]
                {
                    new Servicio
                    {
                        Nombre = "Limpieza Facial Profunda",
                        Descripcion = "Higiene cutánea completa con punta de diamante, extracción suave y máscara descongestiva.",
                        Precio = 4500m,
                        DuracionMin = 60,
                        Activo = true
                    },
                    new Servicio
                    {
                        Nombre = "Masaje Relajante & Descontracturante",
                        Descripcion = "Sesión corporal con aceites esenciales botánicos y piedras calientes para aliviar tensiones.",
                        Precio = 5200m,
                        DuracionMin = 50,
                        Activo = true
                    },
                    new Servicio
                    {
                        Nombre = "Drenaje Linfático Manual",
                        Descripcion = "Técnica manual especializada para reducir retención de líquidos y mejorar circulación.",
                        Precio = 4800m,
                        DuracionMin = 45,
                        Activo = true
                    },
                    new Servicio
                    {
                        Nombre = "Radiofrecuencia Facial Tensora",
                        Descripcion = "Estímulo térmico de colágeno y elastina para efecto lifting no invasivo y luminosidad.",
                        Precio = 6500m,
                        DuracionMin = 45,
                        Activo = true
                    },
                    new Servicio
                    {
                        Nombre = "Peeling Químico Renovador",
                        Descripcion = "Exfoliación química adaptada a cada biotipo cutáneo para unificar tono y textura.",
                        Precio = 5800m,
                        DuracionMin = 40,
                        Activo = true
                    }
                };
                await context.Servicios.AddRangeAsync(servicios);
                await context.SaveChangesAsync();
            }

            // 5. Productos de catálogo
            if (!await context.Productos.AnyAsync())
            {
                var p1 = new Producto
                {
                    Nombre = "Crema Hidratante Premium",
                    Marca = "La Roche-Posay",
                    Descripcion = "Crema hidratante intensiva con ácido hialurónico y ceramidas para restaurar la barrera cutánea.",
                    Precio = 2500m,
                    StockActual = 45,
                    StockMinimo = 10,
                    Activo = true
                };

                var p2 = new Producto
                {
                    Nombre = "Sérum Vitamina C Pura",
                    Marca = "Vichy",
                    Descripcion = "Sérum antioxidante concentrado con 15% de vitamina C para iluminar y combatir radicales libres.",
                    Precio = 3200m,
                    StockActual = 28,
                    StockMinimo = 8,
                    Activo = true
                };

                var p3 = new Producto
                {
                    Nombre = "Protector Solar FPS 50+ Toque Seco",
                    Marca = "Eucerin",
                    Descripcion = "Fotoprotección de amplio espectro contra rayos UVA/UVB con acabado mate no graso.",
                    Precio = 1800m,
                    StockActual = 62,
                    StockMinimo = 15,
                    Activo = true
                };

                var p4 = new Producto
                {
                    Nombre = "Aceite Esencial Puro Lavanda",
                    Marca = "doTERRA",
                    Descripcion = "Aceite 100% puro de lavanda francesa para aromaterapia, relajación y calmar la piel.",
                    Precio = 1500m,
                    StockActual = 8,
                    StockMinimo = 10,
                    Activo = true
                };

                var p5 = new Producto
                {
                    Nombre = "Exfoliante Corporal Sales Marinas",
                    Marca = "The Body Shop",
                    Descripcion = "Exfoliante revitalizante enriquecido con microcristales marinos y manteca de karité.",
                    Precio = 2100m,
                    StockActual = 33,
                    StockMinimo = 10,
                    Activo = true
                };

                var p6 = new Producto
                {
                    Nombre = "Máscara Facial Arcilla Purificante",
                    Marca = "Natura",
                    Descripcion = "Máscara mineral de arcilla caolín para purificar poros y regular el exceso de sebo.",
                    Precio = 1900m,
                    StockActual = 5,
                    StockMinimo = 8,
                    Activo = true
                };

                await context.Productos.AddRangeAsync(p1, p2, p3, p4, p5, p6);
                await context.SaveChangesAsync();

                // Asociar biotipos de piel a productos
                var tipoSeca = await context.TiposPiel.FirstOrDefaultAsync(t => t.Nombre == TipoPielEnum.Seca);
                var tipoNormal = await context.TiposPiel.FirstOrDefaultAsync(t => t.Nombre == TipoPielEnum.Normal);
                var tipoGrasa = await context.TiposPiel.FirstOrDefaultAsync(t => t.Nombre == TipoPielEnum.Grasa);
                var tipoMixta = await context.TiposPiel.FirstOrDefaultAsync(t => t.Nombre == TipoPielEnum.Mixta);
                var tipoSensible = await context.TiposPiel.FirstOrDefaultAsync(t => t.Nombre == TipoPielEnum.Sensible);

                if (tipoSeca != null && tipoNormal != null)
                {
                    await context.ProductosTiposPiel.AddRangeAsync(
                        new ProductoTipoPiel { ProductoId = p1.ProductoId, TipoPielId = tipoSeca.TipoPielId },
                        new ProductoTipoPiel { ProductoId = p1.ProductoId, TipoPielId = tipoNormal.TipoPielId }
                    );
                }

                if (tipoMixta != null && tipoNormal != null)
                {
                    await context.ProductosTiposPiel.AddRangeAsync(
                        new ProductoTipoPiel { ProductoId = p2.ProductoId, TipoPielId = tipoMixta.TipoPielId },
                        new ProductoTipoPiel { ProductoId = p2.ProductoId, TipoPielId = tipoNormal.TipoPielId }
                    );
                }

                if (tipoGrasa != null && tipoMixta != null)
                {
                    await context.ProductosTiposPiel.AddRangeAsync(
                        new ProductoTipoPiel { ProductoId = p6.ProductoId, TipoPielId = tipoGrasa.TipoPielId },
                        new ProductoTipoPiel { ProductoId = p6.ProductoId, TipoPielId = tipoMixta.TipoPielId }
                    );
                }

                await context.SaveChangesAsync();
            }

            logger.LogInformation("Base de datos inicializada y sembrada con datos de prueba exitosamente.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Ocurrió un error al sembrar los datos iniciales en la base de datos.");
        }
    }
}
