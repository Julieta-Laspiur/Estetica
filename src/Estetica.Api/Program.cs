using System.Text;
using Estetica.Api.Middleware;
using Estetica.Api.OpenApi;
using Estetica.Api.Services;
using Estetica.Application;
using Estetica.Application.Interfaces;
using Estetica.Infrastructure;
using Estetica.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Carga opcional de secretos locales privados (ignorado en Git para máxima seguridad)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Configuración de Base de Datos PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Registro de Repositorios, Servicios de Infraestructura y Casos de Uso (MediatR)
builder.Services.AddHttpClient();
builder.Services.AddInfrastructureRepositories();
builder.Services.AddApplicationServices();

// Contexto HTTP y Servicio de Usuario Actual
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Configuración de Autenticación con JWT Bearer
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "SuperSecretKeyForEsteticaApplication2026!WithEnoughBitsForHmacSha256";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "EsteticaApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "EsteticaApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

// Configuración de Autorización y Políticas de Roles
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Administrador"));
    options.AddPolicy("RequireStaff", policy => policy.RequireRole("Administrador", "Recepcionista", "Profesional"));
    options.AddPolicy("RequireRecepcionOAdmin", policy => policy.RequireRole("Administrador", "Recepcionista"));
});

// Configuración de CORS para el Frontend (React + Vite local y despliegues en la nube)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Controladores y documentación OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

var app = builder.Build();

// Inicializar y sembrar datos de prueba en PostgreSQL si está vacía
await DbSeeder.SeedAsync(app.Services);

// Middleware global de manejo de excepciones
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Habilitar CORS antes de Autenticación
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseStaticFiles();

// Pipeline de Seguridad: Autenticación SIEMPRE antes de Autorización
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
