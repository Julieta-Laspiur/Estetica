using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.ConfigurarStockMinimo;

public class ConfigurarStockMinimoCommandHandler : IRequestHandler<ConfigurarStockMinimoCommand, StockAlertaDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public ConfigurarStockMinimoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StockAlertaDto> Handle(ConfigurarStockMinimoCommand request, CancellationToken cancellationToken)
    {
        if (request.NuevoStockMinimo < 0)
        {
            throw new BusinessRuleException("El umbral de stock mínimo no puede ser un valor negativo.");
        }

        var producto = await _unitOfWork.Productos.GetByIdAsync(request.ProductoId, cancellationToken);
        if (producto == null)
        {
            throw new NotFoundException("Producto", request.ProductoId);
        }

        producto.StockMinimo = request.NuevoStockMinimo;
        _unitOfWork.Productos.Update(producto);

        var esBajoStock = producto.StockActual <= producto.StockMinimo;
        string? mensajeAlerta = null;

        if (esBajoStock)
        {
            mensajeAlerta = $"ALERTA DE STOCK: Se ha configurado el stock mínimo de '{producto.Nombre}' en {producto.StockMinimo} unidades y el stock actual ({producto.StockActual}) se encuentra en o por debajo del umbral de seguridad.";

            var admins = await _unitOfWork.Usuarios.GetByRolAsync(RolUsuario.Administrador, cancellationToken);
            foreach (var admin in admins)
            {
                await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                {
                    UsuarioId = admin.UsuarioId,
                    Mensaje = mensajeAlerta,
                    Tipo = TipoNotificacion.AlertaStock,
                    Leida = false,
                    Fecha = DateTime.UtcNow
                }, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new StockAlertaDto
        {
            ProductoId = producto.ProductoId,
            NombreProducto = producto.Nombre,
            StockActual = producto.StockActual,
            StockMinimo = producto.StockMinimo,
            EsBajoStock = esBajoStock,
            MensajeAlerta = mensajeAlerta
        };
    }
}
