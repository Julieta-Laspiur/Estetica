using Estetica.Application.Common.Exceptions;
using Estetica.Application.Interfaces;
using Estetica.Application.UseCases.Productos.DTOs;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using MediatR;

namespace Estetica.Application.UseCases.Productos.Commands.AjustarStockGerencial;

public class AjustarStockGerencialCommandHandler : IRequestHandler<AjustarStockGerencialCommand, StockMovimientoResultadoDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public AjustarStockGerencialCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<StockMovimientoResultadoDto> Handle(AjustarStockGerencialCommand request, CancellationToken cancellationToken)
    {
        if (request.Cantidad < 0)
        {
            throw new BusinessRuleException("La cantidad indicada para el movimiento no puede ser negativa.");
        }

        var producto = await _unitOfWork.Productos.GetByIdAsync(request.ProductoId, cancellationToken);
        if (producto == null)
        {
            throw new NotFoundException("Producto", request.ProductoId);
        }

        var stockAnterior = producto.StockActual;
        int nuevoStock;
        string tipoDescripcion;

        switch (request.TipoAjuste)
        {
            case TipoAjusteStock.IngresoMercaderia:
                nuevoStock = stockAnterior + request.Cantidad;
                tipoDescripcion = "Ingreso de Mercadería (+ Proveedores)";
                break;

            case TipoAjusteStock.AjusteManualPositivo:
                nuevoStock = stockAnterior + request.Cantidad;
                tipoDescripcion = "Ajuste Manual Positivo (+ Conteo)";
                break;

            case TipoAjusteStock.AjusteManualNegativo:
                nuevoStock = stockAnterior - request.Cantidad;
                tipoDescripcion = "Ajuste Manual Negativo (- Conteo)";
                break;

            case TipoAjusteStock.MermaODaño:
                nuevoStock = stockAnterior - request.Cantidad;
                tipoDescripcion = "Merma o Daño (- Descarte/Vencimiento)";
                break;

            case TipoAjusteStock.InventarioFisicoTotal:
                nuevoStock = request.Cantidad;
                tipoDescripcion = "Ajuste por Inventario Físico Total (= Conteo General)";
                break;

            default:
                throw new BusinessRuleException($"Tipo de ajuste de stock '{request.TipoAjuste}' no reconocido.");
        }

        // Regla de Negocio HU-10: No se permiten cantidades negativas de stock
        if (nuevoStock < 0)
        {
            throw new BusinessRuleException($"Operación inválida: El stock resultante ({nuevoStock}) no puede ser negativo. Stock actual: {stockAnterior}, cantidad indicada: {request.Cantidad}.");
        }

        producto.StockActual = nuevoStock;
        _unitOfWork.Productos.Update(producto);

        var esBajoStock = producto.StockActual <= producto.StockMinimo;
        bool alertaGenerada = false;
        string? mensajeAlerta = null;

        // Criterio de aceptación HU-10: El sistema debe alertar cuando se alcance el stock mínimo
        if (esBajoStock)
        {
            alertaGenerada = true;
            mensajeAlerta = $"ALERTA DE STOCK: El producto '{producto.Nombre}' ha alcanzado el umbral mínimo ({producto.StockActual} unidades restantes, Mínimo configurado: {producto.StockMinimo}). Motivo: {request.Motivo ?? tipoDescripcion}.";

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

        return new StockMovimientoResultadoDto
        {
            ProductoId = producto.ProductoId,
            NombreProducto = producto.Nombre,
            StockAnterior = stockAnterior,
            StockNuevo = nuevoStock,
            StockMinimo = producto.StockMinimo,
            TipoAjuste = request.TipoAjuste,
            TipoAjusteDescripcion = tipoDescripcion,
            CantidadAjustada = request.Cantidad,
            Motivo = request.Motivo,
            EsBajoStock = esBajoStock,
            AlertaGenerada = alertaGenerada,
            MensajeAlerta = mensajeAlerta,
            FechaMovimiento = DateTime.UtcNow
        };
    }
}
