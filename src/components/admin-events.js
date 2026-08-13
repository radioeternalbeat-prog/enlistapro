// ============================================
// EN LISTA! — Admin Events Management
// ============================================

import store from '../lib/store.js';
import { formatDate, showModal, closeModal, showToast, generateId } from '../lib/utils.js';

export function renderAdminEvents(container) {
  const events = store.get('events');
  container.innerHTML = `
    <div class="page-header"><div><h1 class="page-title">Eventos</h1><p class="page-subtitle">Gestiona los eventos de tu venue</p></div><button class="btn btn-primary" id="create-event-btn">✚ Nuevo Evento</button></div>
    <div class="card">
      ${events.length > 0 ? `<table class="data-table"><thead><tr><th>Evento</th><th>Venue</th><th>Fecha</th><th>Aforo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${events.map(event => { const guests = store.getGuests(event.id); const checkedIn = guests.filter(g => g.status === 'checked-in').length; return `<tr class="animate-in"><td><div style="font-weight: 600">${event.name}</div><div class="text-sm text-secondary">${guests.length} invitados</div></td><td>${event.venue}</td><td>${formatDate(event.date)}</td><td><span style="color: var(--success); font-weight: 600">${checkedIn}</span><span class="text-secondary"> / ${event.maxCapacity}</span></td><td><span class="badge ${getStatusBadge(event.status)}">${getStatusLabel(event.status)}</span></td><td><div class="flex gap-8">${event.status === 'upcoming' ? `<button class="btn btn-success btn-sm activate-event" data-id="${event.id}">Activar</button>` : ''}${event.status === 'active' ? `<button class="btn btn-danger btn-sm close-event" data-id="${event.id}">Cerrar</button>` : ''}<button class="btn btn-ghost btn-sm delete-event" data-id="${event.id}">🗑️</button></div></td></tr>`; }).join('')}</tbody></table>` : `<div class="empty-state"><div class="empty-icon">🎉</div><h4>No hay eventos</h4><p>Crea tu primer evento para comenzar</p></div>`}
    </div>
  `;

  document.getElementById('create-event-btn')?.addEventListener('click', () => { showCreateEventModal(container); });
  container.querySelectorAll('.activate-event').forEach(btn => { btn.addEventListener('click', () => { store.updateEvent(btn.dataset.id, { status: 'active' }); showToast('Evento activado', 'success'); renderAdminEvents(container); }); });
  container.querySelectorAll('.close-event').forEach(btn => { btn.addEventListener('click', () => { store.updateEvent(btn.dataset.id, { status: 'closed' }); showToast('Evento cerrado', 'info'); renderAdminEvents(container); }); });
  container.querySelectorAll('.delete-event').forEach(btn => { btn.addEventListener('click', () => { if (confirm('Eliminar este evento?')) { const events = store.get('events').filter(e => e.id !== btn.dataset.id); store.set('events', events); showToast('Evento eliminado', 'info'); renderAdminEvents(container); } }); });
}

function showCreateEventModal(container) {
  showModal('Nuevo Evento', `<form id="create-event-form"><div class="form-group"><label>Nombre del Evento</label><input type="text" class="form-input" id="event-name" placeholder="Ej: Noche de Techno" required /></div><div class="form-group"><label>Venue</label><input type="text" class="form-input" id="event-venue" placeholder="Ej: Club Zenith" required /></div><div class="form-group"><label>Fecha y Hora</label><input type="datetime-local" class="form-input" id="event-date" required /></div><div class="form-group"><label>Capacidad Maxima</label><input type="number" class="form-input" id="event-capacity" placeholder="500" min="1" required /></div><div class="flex gap-12 mt-24"><button type="button" class="btn btn-ghost flex-1" onclick="document.getElementById('modal-container').innerHTML=''">Cancelar</button><button type="submit" class="btn btn-primary flex-1">Crear Evento</button></div></form>`);
  document.getElementById('create-event-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const event = { id: generateId('evt'), name: document.getElementById('event-name').value, venue: document.getElementById('event-venue').value, date: new Date(document.getElementById('event-date').value).toISOString(), maxCapacity: parseInt(document.getElementById('event-capacity').value), currentCount: 0, status: 'upcoming', createdBy: store.get('currentUser')?.id, createdAt: new Date().toISOString() };
    store.addEvent(event); closeModal(); showToast('Evento creado exitosamente', 'success'); renderAdminEvents(container);
  });
}

function getStatusBadge(status) { switch (status) { case 'active': return 'badge-success'; case 'upcoming': return 'badge-primary'; case 'closed': return 'badge-danger'; default: return ''; } }
function getStatusLabel(status) { switch (status) { case 'active': return '● Activo'; case 'upcoming': return '◐ Proximo'; case 'closed': return '○ Cerrado'; default: return status; } }
