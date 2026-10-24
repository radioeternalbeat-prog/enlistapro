// ============================================
// EN LISTA! — Admin Promoters Management
// Altas, bajas lógicas y reactivación de RRPP
// ============================================

import store from '../lib/store.js';
import { showModal, closeModal, showToast, generateId, getInitials } from '../lib/utils.js';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderAdminPromoters(container) {
  const promoters = store.getPromoters();
  const events = store.get('events');
  const activePromoters = promoters.filter(promoter => promoter.active !== false).length;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Promotores</h1>
        <p class="page-subtitle">Administrá tu equipo de RRPP y sus permisos de acceso.</p>
      </div>
      <button class="btn btn-primary" id="add-promoter-btn" type="button">✚ Nuevo promotor</button>
    </div>

    <div class="stats-grid stagger">
      <div class="stat-card stat-primary"><div class="stat-icon">🎤</div><div class="stat-value">${activePromoters}</div><div class="stat-label">RRPP activos</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${promoters.length}</div><div class="stat-label">Perfiles registrados</div></div>
      <div class="stat-card stat-warning"><div class="stat-icon">⏸</div><div class="stat-value">${promoters.length - activePromoters}</div><div class="stat-label">Desactivados</div></div>
    </div>

    <div class="promoters-grid">
      ${promoters.map(promoterCard).join('')}
    </div>
    ${promoters.length === 0 ? `<div class="empty-state"><div class="empty-icon">🎤</div><h4>Sin promotores</h4><p>Agregá el primer RRPP para que pueda gestionar sus listas.</p></div>` : ''}
  `;

  document.getElementById('add-promoter-btn')?.addEventListener('click', () => openCreatePromoterModal(container));
  container.querySelectorAll('[data-promoter-action="toggle"]').forEach(button => {
    button.addEventListener('click', () => togglePromoter(button.dataset.promoterId, container));
  });
}

function promoterCard(promoter) {
  const events = store.get('events');
  let totalGuests = 0;
  let totalCheckedIn = 0;
  events.forEach(event => {
    const guests = store.getGuests(event.id).filter(guest => guest.addedBy === promoter.id);
    totalGuests += guests.length;
    totalCheckedIn += guests.filter(guest => guest.status === 'checked-in').length;
  });

  const active = promoter.active !== false;
  const name = escapeHtml(promoter.displayName || 'Sin nombre');
  const email = escapeHtml(promoter.email || 'Sin email');
  const phone = promoter.phone ? `<span>${escapeHtml(promoter.phone)}</span>` : '';
  const actionLabel = active ? 'Desactivar' : 'Reactivar';
  const actionClass = active ? 'btn-danger' : 'btn-success';

  return `
    <article class="card promoter-card ${active ? '' : 'promoter-card-inactive'}">
      <div class="card-body">
        <div class="promoter-card-header">
          <div class="flex items-center gap-16">
            <div class="user-avatar" style="width:48px;height:48px;font-size:1rem;">${escapeHtml(getInitials(promoter.displayName || '?'))}</div>
            <div>
              <div class="promoter-name">${name}</div>
              <div class="text-sm text-secondary">${email}</div>
              ${phone ? `<div class="text-sm text-secondary">${phone}</div>` : ''}
            </div>
          </div>
          <span class="badge ${active ? 'badge-success' : 'badge-warning'}">${active ? 'Activo' : 'Desactivado'}</span>
        </div>
        <div class="promoter-metrics">
          <div><strong>${totalGuests}</strong><span>Invitados</span></div>
          <div><strong>${totalCheckedIn}</strong><span>Check-ins</span></div>
          <div><strong>${totalGuests > 0 ? Math.round((totalCheckedIn / totalGuests) * 100) : 0}%</strong><span>Efectividad</span></div>
        </div>
        <div class="promoter-card-footer">
          <small>${active ? 'Puede ingresar y gestionar sus listas.' : 'Conserva su historial, pero no puede ingresar.'}</small>
          <button class="btn ${actionClass} btn-sm" type="button" data-promoter-action="toggle" data-promoter-id="${escapeHtml(promoter.id)}">${actionLabel}</button>
        </div>
      </div>
    </article>
  `;
}

function openCreatePromoterModal(container) {
  showModal('Nuevo promotor', `
    <form id="create-promoter-form">
      <div class="form-group"><label for="promoter-name">Nombre completo</label><input type="text" class="form-input" id="promoter-name" placeholder="Nombre y apellido" autocomplete="name" required /></div>
      <div class="form-group"><label for="promoter-email">Email</label><input type="email" class="form-input" id="promoter-email" placeholder="email@ejemplo.com" autocomplete="email" required /></div>
      <div class="form-group"><label for="promoter-phone">Teléfono <span class="text-secondary">(opcional)</span></label><input type="tel" class="form-input" id="promoter-phone" placeholder="+54 11 ..." autocomplete="tel" /></div>
      <div class="promoter-form-note">El nuevo RRPP quedará activo inmediatamente y podrá ingresar con el email registrado.</div>
      <div class="flex gap-12 mt-24"><button type="button" class="btn btn-ghost flex-1" id="cancel-promoter-btn">Cancelar</button><button type="submit" class="btn btn-primary flex-1">Crear promotor</button></div>
    </form>
  `);

  document.getElementById('cancel-promoter-btn')?.addEventListener('click', closeModal);
  document.getElementById('create-promoter-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const displayName = document.getElementById('promoter-name').value.trim();
    const email = document.getElementById('promoter-email').value.trim().toLowerCase();
    const phone = document.getElementById('promoter-phone').value.trim();
    const duplicate = store.get('users').some(user => user.email?.toLowerCase() === email);

    if (duplicate) {
      showToast('Ya existe un usuario con ese email', 'error');
      return;
    }

    store.addUser({
      id: generateId('rrpp'),
      displayName,
      email,
      phone,
      role: 'rrpp',
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: store.get('currentUser')?.id,
    });
    closeModal();
    showToast('Promotor creado y activado', 'success');
    renderAdminPromoters(container);
  });
}

function togglePromoter(promoterId, container) {
  const promoter = store.get('users').find(user => user.id === promoterId);
  if (!promoter) return;

  if (promoter.active !== false) {
    const confirmed = window.confirm(`¿Desactivar a ${promoter.displayName}? Ya no podrá ingresar, pero se conservarán sus listas e historial.`);
    if (!confirmed) return;
    store.deactivateUser(promoterId);
    showToast('Promotor desactivado', 'success');
  } else {
    store.reactivateUser(promoterId);
    showToast('Promotor reactivado', 'success');
  }

  renderAdminPromoters(container);
}
