using Estetica.Domain.Entities;
using Estetica.Domain.Enums;

namespace Estetica.Application.UseCases.Notificaciones.DTOs;

public static class NotificacionMappingExtensions
{
    public static NotificacionDto ToDto(this Notificacion n)
    {
        var tipoDesc = n.Tipo switch
        {
            TipoNotificacion.AlertaPago => "Alerta de Pago Aprobado",
            TipoNotificacion.AlertaStock => "Alerta de Stock Crítico",
            TipoNotificacion.ConfirmacionTurno => "Confirmación de Turno",
            TipoNotificacion.RecordatorioTurno => "Recordatorio de Turno",
            TipoNotificacion.ActualizacionOrden => "Actualización de Orden",
            TipoNotificacion.Promocion => "Beneficio / Fidelización",
            _ => "Sistema General"
        };

        var categoria = n.Tipo switch
        {
            TipoNotificacion.AlertaPago => "Pago Aprobado",
            TipoNotificacion.AlertaStock => "Stock Crítico",
            TipoNotificacion.ConfirmacionTurno or TipoNotificacion.RecordatorioTurno => "Agenda y Turnos",
            _ => "Administración General"
        };

        var esCritica = n.Tipo == TipoNotificacion.AlertaPago || n.Tipo == TipoNotificacion.AlertaStock;

        return new NotificacionDto
        {
            NotificacionId = n.NotificacionId,
            UsuarioId = n.UsuarioId,
            DestinatarioNombre = n.Usuario != null ? $"{n.Usuario.Nombre} {n.Usuario.Apellido}".Trim() : null,
            DestinatarioEmail = n.Usuario?.Email,
            Mensaje = n.Mensaje,
            Tipo = n.Tipo,
            TipoDescripcion = tipoDesc,
            CategoriaAlerta = categoria,
            EsAlertaCritica = esCritica,
            Leida = n.Leida,
            Fecha = n.Fecha,
            FechaFormateada = n.Fecha.ToString("dd/MM/yyyy"),
            HoraFormateada = n.Fecha.ToString("HH:mm:ss")
        };
    }
}
