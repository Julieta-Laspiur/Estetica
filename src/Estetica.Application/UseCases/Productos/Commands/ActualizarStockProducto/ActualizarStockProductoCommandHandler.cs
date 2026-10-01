using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.ActualizarStockProducto;

public class ActualizarStockProductoCommandHandler : IRequestHandler<ActualizarStockProductoCommand, StockAlertaDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public ActualizarStockProductoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StockAlertaDto> Handle(ActualizarStockProductoCommand request, CancellationToken cancellationToken)
    {
        var producto = await _unitOfWork.Productos.GetByIdAsync(request.ProductoId, cancellationToken);
        if (producto == null)
        {
            throw new NotFoundException("Producto", request.ProductoId);
        }

        if (producto.StockActual < request.CantidadADescontar)
        {
            throw new BusinessRuleException($"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.StockActual}, solicitado: {request.CantidadADescontar}.");
        }

        producto.StockActual -= request.CantidadADescontar;
        _unitOfWork.Productos.Update(producto);

        var esBajoStock = producto.StockActual <= producto.StockMinimo;
        string? mensajeAlerta = null;

        if (esBajoStock)
        {
            mensajeAlerta = $"¡Alerta de stock! El producto '{producto.Nombre}' alcanzó el nivel mínimo ({producto.StockActual} unidades restantes).";

            // Notificación al rol de Administradores
            var admins = await _unitOfWork.Usuarios.GetByRolAsync(RolUsuario.Administrador, cancellationToken);
            foreach (var admin in admins)
            {
                await _unitOfWork.Notificaciones.AddAsync(new Notificacion
                {
                    UsuarioId = admin.UsuarioId,
                    Mensaje = mensajeAlerta,
                    Tipo = TipoNotificacion.Sistema,
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
