// ============================================
// EN LISTA! — Admin Closing Report
// ============================================

import store from '../lib/store.js';
import { formatDate } from '../lib/utils.js';

export function renderAdminReport(container) {
  const events = store.get('events');
  const closedEvents = events.filter(e => e.status === 'closed' || e.status === 'active');
  
  container.innerHTML = `
    <div class="page-header"><div><h1 class="page-title">Reporte de Cierre</h1><p class="page-subtitle">Metricas finales de cada evento</p></div></div>
    <div id="report-container">
      ${closedEvents.length > 0 ? closedEvents.map(event => renderEventReport(event)).join('') : `<div class="empty-state"><div class="empty-icon">📋</div><h4>Sin reportes disponibles</h4><p>Los reportes se generan cuando un evento se cierra o esta activo</p></div>`}
    </div>
  `;
}

function renderEventReport(event) {
  const metrics = store.getEventMetrics(event.id);
  return `
    <div class="card mb-24 animate-in">
      <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
        <div style="flex: 1;"><div class="flex items-center gap-12" style="margin-bottom: 4px;"><h3 style="margin: 0">${event.name}</h3><span class="badge ${event.status === 'active' ? 'badge-success' : 'badge-danger'}">${event.status === 'active' ? '● En vivo' : '○ Cerrado'}</span></div><span class="text-sm text-secondary">${event.venue} — ${formatDate(event.date)}</span></div>
      </div>
      <div class="card-body" id="report-content-${event.id}">
        <div class="stats-grid" style="margin-bottom: 24px;">
          <div class="stat-card stat-primary"><div class="stat-value">${metrics.total}</div><div class="stat-label">Total en Lista</div></div>
          <div class="stat-card stat-success"><div class="stat-value">${metrics.checkedIn}</div><div class="stat-label">Ingresados</div></div>
          <div class="stat-card stat-warning"><div class="stat-value">${metrics.totalExpected}</div><div class="stat-label">Esperados (+ acomp.)</div></div>
          <div class="stat-card"><div class="stat-value">${metrics.occupancyPercent}%</div><div class="stat-label">Ocupacion</div></div>
        </div>
        <h4 style="font-family: var(--font-display); margin-bottom: 16px;">📊 Desempeno por Promotor</h4>
        <table class="data-table"><thead><tr><th>Promotor</th><th>Invitados Totales</th><th>Check-ins</th><th>No Shows</th><th>Tasa de Asistencia</th></tr></thead><tbody>
          ${Object.entries(metrics.byPromoter).map(([name, data]) => { const noShows = data.total - data.checkedIn; const rate = data.total > 0 ? Math.round((data.checkedIn / data.total) * 100) : 0; return `<tr><td style="font-weight: 600">${name}</td><td>${data.total}</td><td><span class="badge badge-success">${data.checkedIn}</span></td><td><span class="badge badge-danger">${noShows}</span></td><td><div class="flex items-center gap-8"><div style="width: 60px; height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;"><div style="width: ${rate}%; height: 100%; background: ${rate >= 60 ? 'var(--success)' : rate >= 30 ? 'var(--warning)' : 'var(--danger)'}; border-radius: 3px;"></div></div><span style="font-weight: 600">${rate}%</span></div></td></tr>`; }).join('')}
        </tbody></table>
        <h4 style="font-family: var(--font-display); margin-top: 32px; margin-bottom: 16px;">📈 Curva de Llegada</h4>
        <div class="arrival-chart" style="height: 100px;">${metrics.arrivalCurve.map(point => { const maxCount = Math.max(...metrics.arrivalCurve.map(p => p.count), 1); const height = Math.max(4, (point.count / maxCount) * 100); return `<div class="arrival-bar" style="height: ${height}%"><span class="bar-value">${point.count}</span><span class="bar-label">${point.hour}</span></div>`; }).join('')}</div>
      </div>
    </div>
  `;
}
