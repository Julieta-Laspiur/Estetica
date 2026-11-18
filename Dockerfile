# =======================================================
# 1. Base Runtime Stage (.NET 10 ASP.NET Core)
# =======================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# =======================================================
# 2. Build Stage (.NET 10 SDK)
# =======================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar archivos de proyectos para aprovechar el caché de capas de Docker
COPY ["src/Estetica.Api/Estetica.Api.csproj", "src/Estetica.Api/"]
COPY ["src/Estetica.Application/Estetica.Application.csproj", "src/Estetica.Application/"]
COPY ["src/Estetica.Domain/Estetica.Domain.csproj", "src/Estetica.Domain/"]
COPY ["src/Estetica.Infrastructure/Estetica.Infrastructure.csproj", "src/Estetica.Infrastructure/"]

# Restaurar dependencias NuGet
RUN dotnet restore "src/Estetica.Api/Estetica.Api.csproj"

# Copiar todo el código fuente del backend
COPY src/ src/

# Compilar y publicar la aplicación en modo Release
WORKDIR "/src/src/Estetica.Api"
RUN dotnet publish "Estetica.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# =======================================================
# 3. Final Production Stage
# =======================================================
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

# Crear estructura de carpetas para subidas de archivos estáticos
RUN mkdir -p wwwroot/uploads/productos wwwroot/uploads/servicios

ENTRYPOINT ["dotnet", "Estetica.Api.dll"]
