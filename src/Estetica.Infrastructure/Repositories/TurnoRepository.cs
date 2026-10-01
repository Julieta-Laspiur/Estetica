using Estetica.Application.Interfaces;
using Estetica.Domain.Entities;
using Estetica.Domain.Enums;
using Estetica.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Estetica.Infrastructure.Repositories;

public class TurnoRepository : Repository<Turno>, ITurnoRepository
{
    public TurnoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Turno>> GetByFechaRangeAsync(DateTime inicio, DateTime fin, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(t => t.Usuario)
            .Include(t => t.Profesional).ThenInclude(p => p.Usuario)
            .Include(t => t.Cabina)
            .Include(t => t.TurnoServicios).ThenInclude(ts => ts.Servicio)
            .Where(t => t.FechaHoraInicio >= inicio && t.FechaHoraFin <= fin)
            .OrderBy(t => t.FechaHoraInicio)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Turno>> GetByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(t => t.Profesional).ThenInclude(p => p.Usuario)
            .Include(t => t.Cabina)
            .Include(t => t.TurnoServicios).ThenInclude(ts => ts.Servicio)
            .Where(t => t.UsuarioId == usuarioId)
            .OrderByDescending(t => t.FechaHoraInicio)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Turno>> GetByProfesionalIdAsync(int profesionalId, DateTime? fecha = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(t => t.Usuario)
            .Include(t => t.Cabina)
            .Include(t => t.TurnoServicios).ThenInclude(ts => ts.Servicio)
            .Where(t => t.ProfesionalId == profesionalId);

        if (fecha.HasValue)
        {
            var inicioDia = fecha.Value.Date;
            var finDia = inicioDia.AddDays(1);
            query = query.Where(t => t.FechaHoraInicio >= inicioDia && t.FechaHoraInicio < finDia);
        }

        return await query.OrderBy(t => t.FechaHoraInicio).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Turno>> GetByCabinaIdAsync(int cabinaId, DateTime? fecha = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(t => t.Usuario)
            .Include(t => t.Profesional).ThenInclude(p => p.Usuario)
            .Include(t => t.TurnoServicios).ThenInclude(ts => ts.Servicio)
            .Where(t => t.CabinaId == cabinaId);

        if (fecha.HasValue)
        {
            var inicioDia = fecha.Value.Date;
            var finDia = inicioDia.AddDays(1);
            query = query.Where(t => t.FechaHoraInicio >= inicioDia && t.FechaHoraInicio < finDia);
        }

        return await query.OrderBy(t => t.FechaHoraInicio).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Turno>> GetByEstadoAsync(EstadoTurno estado, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(t => t.Usuario)
            .Include(t => t.Profesional).ThenInclude(p => p.Usuario)
            .Include(t => t.Cabina)
            .Where(t => t.Estado == estado)
            .OrderByDescending(t => t.FechaHoraInicio)
            .ToListAsync(cancellationToken);
    }

    public async Task<Turno?> GetWithDetailsAsync(int turnoId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(t => t.Usuario)
            .Include(t => t.Profesional).ThenInclude(p => p.Usuario)
            .Include(t => t.Cabina)
            .Include(t => t.TurnoServicios).ThenInclude(ts => ts.Servicio)
            .Include(t => t.Pagos)
            .Include(t => t.HistorialesTratamiento)
            .FirstOrDefaultAsync(t => t.TurnoId == turnoId, cancellationToken);
    }

    public async Task<bool> IsCabinaAvailableAsync(int cabinaId, DateTime inicio, DateTime fin, int? excludeTurnoId = null, CancellationToken cancellationToken = default)
    {
        return !await _dbSet.AnyAsync(t =>
            t.CabinaId == cabinaId &&
            t.Estado != EstadoTurno.Cancelado &&
            t.FechaHoraInicio < fin &&
            t.FechaHoraFin > inicio &&
            (!excludeTurnoId.HasValue || t.TurnoId != excludeTurnoId.Value),
            cancellationToken);
    }

    public async Task<bool> IsProfesionalAvailableAsync(int profesionalId, DateTime inicio, DateTime fin, int? excludeTurnoId = null, CancellationToken cancellationToken = default)
    {
        return !await _dbSet.AnyAsync(t =>
            t.ProfesionalId == profesionalId &&
            t.Estado != EstadoTurno.Cancelado &&
            t.FechaHoraInicio < fin &&
            t.FechaHoraFin > inicio &&
            (!excludeTurnoId.HasValue || t.TurnoId != excludeTurnoId.Value),
            cancellationToken);
    }
}
