// ============================================
// EN LISTA! — Admin Global Stats Component
// ============================================

import store from '../lib/store.js';
import { formatDate, animateCounter } from '../lib/utils.js';

export function renderAdminGlobalStats(container) {
  const events = store.get('events');
  const allGuests = store.get('guests');
  const now = new Date();
  
  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const getWeek = (d) => { const date = new Date(d.getTime()); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7); const week1 = new Date(date.getFullYear(), 0, 4); return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7); };
  const isSameWeek = (d1, d2) => d1.getFullYear() === d2.getFullYear() && getWeek(d1) === getWeek(d2);
  const isSameMonth = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  const isSameYear = (d1, d2) => d1.getFullYear() === d2.getFullYear();

  container.innerHTML = `
    <div class="page-header"><div><h1 class="page-title">Resumen Global & Base de Datos</h1><p class="page-subtitle">Supervision total de las noches (Dia, Sem, Mes, Ano)</p></div>
      <div class="flex gap-8"><select class="form-select" id="time-filter" style="max-width: 200px;"><option value="all">Historico (Todo)</option><option value="day">Noche / Hoy</option><option value="week">Esta Semana</option><option value="month">Este Mes</option><option value="year">Este Ano</option></select></div>
    </div>
    <div id="global-stats-content"></div>
  `;

  const renderContent = (filter) => {
    let filteredEvents = events;
    if (filter === 'day') filteredEvents = events.filter(e => isSameDay(new Date(e.date), now));
    else if (filter === 'week') filteredEvents = events.filter(e => isSameWeek(new Date(e.date), now));
    else if (filter === 'month') filteredEvents = events.filter(e => isSameMonth(new Date(e.date), now));
    else if (filter === 'year') filteredEvents = events.filter(e => isSameYear(new Date(e.date), now));

    let fCapacity = 0, fCheckedIn = 0, fLists = 0, fPending = 0;
    let allGuestsList = [];
    filteredEvents.forEach(e => { fCapacity += parseInt(e.maxCapacity) || 0; const gList = allGuests[e.id] || []; allGuestsList = allGuestsList.concat(gList.map(g => ({...g, eventName: e.name, eventDate: e.date}))); fLists += gList.length; fCheckedIn += gList.filter(g => g.status === 'checked-in').length; fPending += gList.filter(g => g.status === 'pending').length; });
    const fOccupancyPercent = fCapacity > 0 ? Math.round((fCheckedIn / fCapacity) * 100) : 0;

    document.getElementById('global-stats-content').innerHTML = `
      <div class="stats-grid stagger mb-32">
        <div class="stat-card stat-primary animate-in"><div class="stat-icon">📅</div><div class="stat-value" data-counter="${filteredEvents.length}">0</div><div class="stat-label">Eventos Totales</div></div>
        <div class="stat-card stat-success animate-in"><div class="stat-icon">✅</div><div class="stat-value" data-counter="${fCheckedIn}">0</div><div class="stat-label">Ingresos Globales</div></div>
        <div class="stat-card stat-warning animate-in"><div class="stat-icon">📋</div><div class="stat-value" data-counter="${fLists}">0</div><div class="stat-label">Total en Listas</div></div>
        <div class="stat-card animate-in"><div class="stat-icon">🏟️</div><div class="stat-value">${fOccupancyPercent}%</div><div class="stat-label">Aforo Promedio Usado</div></div>
      </div>
      <div class="card animate-in"><div class="card-header"><h3>🗄️ Base de Datos de Asistentes</h3></div><div class="card-body">
        ${allGuestsList.length > 0 ? `<table class="data-table"><thead><tr><th>Nombre</th><th>Evento</th><th>Fecha</th><th>Tipo</th><th>Promotor</th><th>Estado</th></tr></thead><tbody>${allGuestsList.sort((a,b) => new Date(b.eventDate) - new Date(a.eventDate)).slice(0, 150).map(g => `<tr><td style="font-weight: 600">${g.firstName} ${g.lastName}</td><td>${g.eventName}</td><td class="text-secondary">${formatDate(g.eventDate)}</td><td><span class="badge ${g.listType === 'VIP' ? 'badge-vip' : 'badge-primary'}">${g.listType}</span></td><td class="text-secondary">${g.promoterName}</td><td><span class="badge ${g.status === 'checked-in' ? 'badge-success' : 'badge-warning'}">${g.status === 'checked-in' ? '✓ Ingreso' : '⏳ Pendiente'}</span></td></tr>`).join('')}</tbody></table>${allGuestsList.length > 150 ? `<p class="text-center text-sm text-secondary mt-16">Mostrando los ultimos 150 registros.</p>` : ''}` : `<div class="empty-state"><p>No hay registros en la base de datos para este periodo.</p></div>`}
      </div></div>
    `;
    setTimeout(() => { document.querySelectorAll('#global-stats-content [data-counter]').forEach(el => { animateCounter(el, parseInt(el.dataset.counter)); }); }, 50);
  };

  renderContent('all');
  document.getElementById('time-filter')?.addEventListener('change', (e) => { renderContent(e.target.value); });
}
