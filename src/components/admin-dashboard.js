// ============================================
// EN LISTA! — Admin Dashboard Component
// ============================================

import store from '../lib/store.js';
import { formatDate, getCapacityLevel, animateCounter } from '../lib/utils.js';

export function renderAdminDashboard(container) {
  const events = store.get('events');
  const activeEvent = events.find(e => e.status === 'active') || events[0];
  const metrics = activeEvent ? store.getEventMetrics(activeEvent.id) : null;

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Dashboard</h1><p class="page-subtitle">Vista general en tiempo real</p></div>
      <div class="flex gap-8">
        <select class="form-select" id="event-selector" style="max-width: 260px;">
          ${events.map(e => `<option value="${e.id}" ${e.id === activeEvent?.id ? 'selected' : ''}>${e.name} — ${formatDate(e.date)}</option>`).join('')}
        </select>
      </div>
    </div>
    ${activeEvent ? renderEventDashboard(activeEvent, metrics) : `<div class="empty-state"><div class="empty-icon">📅</div><h4>No hay eventos</h4><p>Crea tu primer evento para ver las metricas</p></div>`}
  `;

  document.getElementById('event-selector')?.addEventListener('change', () => { renderAdminDashboard(container); });
  setTimeout(() => { document.querySelectorAll('[data-counter]').forEach(el => { animateCounter(el, parseInt(el.dataset.counter)); }); }, 100);
}

function renderEventDashboard(event, metrics) {
  if (!metrics) return '';
  const capacityLevel = getCapacityLevel(metrics.checkedIn, metrics.maxCapacity);
  const capacityPercent = Math.min(100, metrics.occupancyPercent);

  return `
    <div class="capacity-bar-container animate-in">
      <div class="capacity-header"><h3>🏟️ Aforo — ${event.name}</h3><div class="capacity-count"><span data-counter="${metrics.checkedIn}" style="color: var(--success)">0</span><span style="color: var(--text-tertiary)"> / </span><span>${metrics.maxCapacity}</span></div></div>
      <div class="capacity-bar"><div class="capacity-fill ${capacityLevel}" style="width: ${capacityPercent}%"></div></div>
      <div class="flex justify-between mt-8"><span class="text-sm text-secondary">${capacityPercent}% ocupado</span><span class="text-sm text-secondary">${metrics.maxCapacity - metrics.checkedIn} lugares disponibles</span></div>
    </div>
    <div class="stats-grid stagger">
      <div class="stat-card stat-primary animate-in"><div class="stat-icon">📋</div><div class="stat-value" data-counter="${metrics.total}">0</div><div class="stat-label">Total en Lista</div></div>
      <div class="stat-card stat-success animate-in"><div class="stat-icon">✅</div><div class="stat-value" data-counter="${metrics.checkedIn}">0</div><div class="stat-label">Ingresados</div></div>
      <div class="stat-card stat-warning animate-in"><div class="stat-icon">⏳</div><div class="stat-value" data-counter="${metrics.pending}">0</div><div class="stat-label">Pendientes</div></div>
      <div class="stat-card animate-in"><div class="stat-icon">⭐</div><div class="stat-value" data-counter="${metrics.vip}">0</div><div class="stat-label">VIP</div></div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div class="card animate-in"><div class="card-header"><h3>🎤 Desempeno Promotores</h3></div><div class="card-body">
        ${Object.keys(metrics.byPromoter).length > 0 ? `<table class="data-table"><thead><tr><th>Promotor</th><th>Invitados</th><th>Check-in</th><th>Tasa</th></tr></thead><tbody>${Object.entries(metrics.byPromoter).map(([name, data]) => `<tr><td style="font-weight: 600">${name}</td><td>${data.total}</td><td><span class="badge badge-success">${data.checkedIn}</span></td><td>${data.total > 0 ? Math.round((data.checkedIn / data.total) * 100) : 0}%</td></tr>`).join('')}</tbody></table>` : `<div class="empty-state"><p>Sin datos de promotores</p></div>`}
      </div></div>
      <div class="card animate-in"><div class="card-header"><h3>📈 Curva de Llegada</h3></div><div class="card-body"><div class="arrival-chart">
        ${metrics.arrivalCurve.map(point => { const maxCount = Math.max(...metrics.arrivalCurve.map(p => p.count), 1); const height = Math.max(4, (point.count / maxCount) * 100); return `<div class="arrival-bar" style="height: ${height}%"><span class="bar-value">${point.count}</span><span class="bar-label">${point.hour}</span></div>`; }).join('')}
      </div></div></div>
    </div>
    <div class="card mt-24 animate-in"><div class="card-header"><h3>🕐 Actividad Reciente</h3></div><div class="card-body">${renderRecentActivity(event.id)}</div></div>
  `;
}

function renderRecentActivity(eventId) {
  const guests = store.getGuests(eventId);
  const checkedIn = guests.filter(g => g.status === 'checked-in').sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt)).slice(0, 5);
  if (checkedIn.length === 0) return `<div class="empty-state"><p>No hay actividad reciente</p></div>`;
  return `<table class="data-table"><thead><tr><th>Invitado</th><th>Tipo</th><th>Promotor</th><th>Estado</th></tr></thead><tbody>${checkedIn.map(g => `<tr><td style="font-weight: 600">${g.firstName} ${g.lastName}</td><td><span class="badge ${g.listType === 'VIP' ? 'badge-vip' : 'badge-primary'}">${g.listType}</span></td><td class="text-secondary">${g.promoterName}</td><td><span class="badge badge-success">✓ Check-in</span></td></tr>`).join('')}</tbody></table>`;
}
