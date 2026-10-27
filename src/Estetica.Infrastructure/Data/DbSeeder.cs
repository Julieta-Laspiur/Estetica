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
            // 0. Asegurar columnas de Productos si no existen
            try
            {
                await context.Database.ExecuteSqlRawAsync(
                    "ALTER TABLE \"Productos\" ADD COLUMN IF NOT EXISTS \"ParaQueSirve\" text; " +
                    "ALTER TABLE \"Productos\" ADD COLUMN IF NOT EXISTS \"ImagenUrl\" text;");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Aviso de inicialización de columnas opcionales en Productos.");
            }

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

            // Actualizar ParaQueSirve e ImagenUrl para productos existentes que tengan null
            var productosSinDetalle = await context.Productos.Where(p => p.ParaQueSirve == null).ToListAsync();
            foreach (var prod in productosSinDetalle)
            {
                if (prod.Nombre.Contains("Hidratante"))
                {
                    prod.ParaQueSirve = "Hidratación profunda, restauración de la barrera cutánea y prevención de tirantez.";
                    prod.ImagenUrl ??= "https://images.unsplash.com/photo-1608248597359-242858b2e1bf?w=500&auto=format&fit=crop&q=80";
                }
                else if (prod.Nombre.Contains("Vitamina C"))
                {
                    prod.ParaQueSirve = "Aporta luminosidad, combate manchas superficiales, unifica el tono y protege del fotoenvejecimiento.";
                    prod.ImagenUrl ??= "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80";
                }
                else if (prod.Nombre.Contains("Solar"))
                {
                    prod.ParaQueSirve = "Protección solar diaria de amplio espectro para prevenir manchas solares, arrugas y daño celular.";
                    prod.ImagenUrl ??= "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80";
                }
                else if (prod.Nombre.Contains("Lavanda"))
                {
                    prod.ParaQueSirve = "Alivio de tensiones, relajación muscular y efecto calmante sobre pieles irritadas o reactivas.";
                    prod.ImagenUrl ??= "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=80";
                }
                else if (prod.Nombre.Contains("Exfoliante"))
                {
                    prod.ParaQueSirve = "Elimina células muertas, suaviza la textura de la piel corporal y estimula la renovación celular.";
                    prod.ImagenUrl ??= "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80";
                }
                else
                {
                    prod.ParaQueSirve = "Cuidado dermoestético avanzado, nutrición y purificación cutánea profunda.";
                    prod.ImagenUrl ??= "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80";
                }
            }
            if (productosSinDetalle.Count > 0)
            {
                await context.SaveChangesAsync();
            }

            // 6. Clientes adicionales para pruebas
            var clientesNuevos = new[]
            {
                new { Nombre = "María", Apellido = "González", Email = "maria.gonzalez@email.com", Tel = "+5491123456789" },
                new { Nombre = "Ana", Apellido = "Rodríguez", Email = "ana.rodriguez@email.com", Tel = "+5491134567890" },
                new { Nombre = "Laura", Apellido = "Fernández", Email = "laura.fernandez@email.com", Tel = "+5491145678901" },
                new { Nombre = "Sofía", Apellido = "Pérez", Email = "sofia.perez@email.com", Tel = "+5491156789012" }
            };

            foreach (var cl in clientesNuevos)
            {
                if (!await context.Usuarios.AnyAsync(u => u.Email == cl.Email))
                {
                    var u = new Usuario
                    {
                        Nombre = cl.Nombre,
                        Apellido = cl.Apellido,
                        Email = cl.Email,
                        Telefono = cl.Tel,
                        Rol = RolUsuario.Cliente,
                        PasswordHash = passwordHasher.Hash("Cliente123!"),
                        Activo = true,
                        FechaRegistro = DateTime.UtcNow.AddDays(-15)
                    };
                    await context.Usuarios.AddAsync(u);
                    await context.SaveChangesAsync();

                    await context.Fidelizaciones.AddAsync(new Fidelizacion
                    {
                        UsuarioId = u.UsuarioId,
                        EstampitasActuales = 4,
                        UltimaActualizacion = DateTime.UtcNow
                    });
                    await context.SaveChangesAsync();
                }
            }

            // 7. Turnos de ejemplo para agenda y métricas
            if (!await context.Turnos.AnyAsync())
            {
                var prof = await context.Profesionales.Include(p => p.Usuario).FirstOrDefaultAsync();
                var cabinasList = await context.Cabinas.ToListAsync();
                var serviciosList = await context.Servicios.ToListAsync();
                var clientesList = await context.Usuarios.Where(u => u.Rol == RolUsuario.Cliente).ToListAsync();

                if (prof != null && cabinasList.Count > 0 && serviciosList.Count > 0 && clientesList.Count > 0)
                {
                    var c1 = clientesList.First();
                    var c2 = clientesList.Skip(1).FirstOrDefault() ?? c1;
                    var c3 = clientesList.Skip(2).FirstOrDefault() ?? c1;

                    var hoy = DateTime.UtcNow.Date;

                    var t1 = new Turno
                    {
                        UsuarioId = c1.UsuarioId,
                        ProfesionalId = prof.ProfesionalId,
                        CabinaId = cabinasList[0].CabinaId,
                        FechaHoraInicio = hoy.AddHours(10),
                        FechaHoraFin = hoy.AddHours(11),
                        Estado = EstadoTurno.Confirmado,
                        Total = serviciosList[0].Precio,
                        FechaCreacion = hoy.AddDays(-1),
                    };
                    t1.TurnoServicios.Add(new TurnoServicio { ServicioId = serviciosList[0].ServicioId, Turno = t1 });

                    var t2 = new Turno
                    {
                        UsuarioId = c2.UsuarioId,
                        ProfesionalId = prof.ProfesionalId,
                        CabinaId = cabinasList[Math.Min(1, cabinasList.Count - 1)].CabinaId,
                        FechaHoraInicio = hoy.AddHours(11).AddMinutes(30),
                        FechaHoraFin = hoy.AddHours(12).AddMinutes(30),
                        Estado = EstadoTurno.Pendiente,
                        Total = serviciosList[Math.Min(1, serviciosList.Count - 1)].Precio,
                        FechaCreacion = hoy.AddHours(-1),
                    };
                    t2.TurnoServicios.Add(new TurnoServicio { ServicioId = serviciosList[Math.Min(1, serviciosList.Count - 1)].ServicioId, Turno = t2 });

                    var t3 = new Turno
                    {
                        UsuarioId = c3.UsuarioId,
                        ProfesionalId = prof.ProfesionalId,
                        CabinaId = cabinasList[0].CabinaId,
                        FechaHoraInicio = hoy.AddHours(14),
                        FechaHoraFin = hoy.AddHours(15),
                        Estado = EstadoTurno.Confirmado,
                        Total = serviciosList[Math.Min(2, serviciosList.Count - 1)].Precio,
                        FechaCreacion = hoy.AddDays(-2),
                    };
                    t3.TurnoServicios.Add(new TurnoServicio { ServicioId = serviciosList[Math.Min(2, serviciosList.Count - 1)].ServicioId, Turno = t3 });

                    var t4 = new Turno
                    {
                        UsuarioId = c1.UsuarioId,
                        ProfesionalId = prof.ProfesionalId,
                        CabinaId = cabinasList[Math.Min(2, cabinasList.Count - 1)].CabinaId,
                        FechaHoraInicio = hoy.AddDays(1).AddHours(15),
                        FechaHoraFin = hoy.AddDays(1).AddHours(16),
                        Estado = EstadoTurno.Confirmado,
                        Total = serviciosList[Math.Min(3, serviciosList.Count - 1)].Precio,
                        FechaCreacion = hoy.AddDays(-1),
                    };
                    t4.TurnoServicios.Add(new TurnoServicio { ServicioId = serviciosList[Math.Min(3, serviciosList.Count - 1)].ServicioId, Turno = t4 });

                    await context.Turnos.AddRangeAsync(t1, t2, t3, t4);
                    await context.SaveChangesAsync();
                }
            }

            logger.LogInformation("Base de datos inicializada y sembrada con datos de prueba exitosamente.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Ocurrió un error al sembrar los datos iniciales en la base de datos.");
        }
    }
}
