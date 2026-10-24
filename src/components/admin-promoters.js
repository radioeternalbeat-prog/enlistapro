// ============================================
// EN LISTA! — Admin Promoters Management
// Altas, bajas lógicas y gestión de listas por RRPP
// ============================================

import store from '../lib/store.js';
import { showModal, closeModal, showToast, generateId, getInitials, generateQRValue } from '../lib/utils.js';

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function renderAdminPromoters(container, selectedPromoterId = store.get('adminSelectedPromoterId') || '') {
  const promoters = store.getPromoters();
  const events = store.get('events');
  const openEvents = events.filter(event => event.status !== 'closed');
  const activePromotersList = promoters.filter(promoter => promoter.active !== false);
  const activePromoters = activePromotersList.length;
  const selectedPromoter = activePromotersList.find(promoter => promoter.id === selectedPromoterId);

  container.innerHTML = `
    <div class="page-header">
      <div><h1 class="page-title">Promotores</h1><p class="page-subtitle">Administrá tu equipo de RRPP y sus listas.</p></div>
      <button class="btn btn-primary" id="add-promoter-btn" type="button">✚ Nuevo promotor</button>
    </div>

    <div class="stats-grid stagger">
      <div class="stat-card stat-primary"><div class="stat-icon">🎤</div><div class="stat-value">${activePromoters}</div><div class="stat-label">RRPP activos</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${promoters.length}</div><div class="stat-label">Perfiles registrados</div></div>
      <div class="stat-card stat-warning"><div class="stat-icon">⏸</div><div class="stat-value">${promoters.length - activePromoters}</div><div class="stat-label">Desactivados</div></div>
    </div>

    <div class="card admin-list-builder animate-in">
      <div class="card-header"><div><h3>Crear lista de invitados</h3><p class="text-sm text-secondary">Elegí el promotor responsable antes de cargar cada invitado.</p></div><span class="badge badge-primary">Atribución manual</span></div>
      <div class="card-body">
        ${activePromotersList.length === 0 ? `<div class="empty-state"><p>Necesitás tener al menos un promotor activo para crear una lista.</p></div>` : openEvents.length === 0 ? `<div class="empty-state"><p>Creá o activá un evento antes de cargar invitados.</p></div>` : `
          <div class="form-group"><label for="admin-promoter-select">Promotor / RRPP</label><select class="form-select" id="admin-promoter-select"><option value="">Seleccioná un promotor</option>${activePromotersList.map(promoter => `<option value="${escapeHtml(promoter.id)}" ${promoter.id === selectedPromoterId ? 'selected' : ''}>${escapeHtml(promoter.displayName)} — ${escapeHtml(promoter.email)}</option>`).join('')}</select></div>
          <form id="admin-add-guest-form" class="admin-guest-form ${selectedPromoter ? '' : 'is-disabled'}">
          <div class="form-group"><label for="admin-guest-event">Evento</label><select class="form-select" id="admin-guest-event" required ${selectedPromoter ? '' : 'disabled'}>${openEvents.map(event => `<option value="${escapeHtml(event.id)}">${escapeHtml(event.name)}</option>`).join('')}</select></div>
            <div class="admin-guest-fields"><div class="form-group"><label for="admin-guest-first">Nombre</label><input type="text" class="form-input" id="admin-guest-first" placeholder="Nombre" required ${selectedPromoter ? '' : 'disabled'} /></div><div class="form-group"><label for="admin-guest-last">Apellido</label><input type="text" class="form-input" id="admin-guest-last" placeholder="Apellido" required ${selectedPromoter ? '' : 'disabled'} /></div></div>
            <div class="admin-guest-fields"><div class="form-group"><label for="admin-guest-type">Tipo de lista</label><select class="form-select" id="admin-guest-type" ${selectedPromoter ? '' : 'disabled'}><option value="general">General</option><option value="VIP">VIP</option><option value="backstage">Backstage</option></select></div><div class="form-group"><label for="admin-guest-plus">Acompañantes</label><input type="number" class="form-input" id="admin-guest-plus" value="0" min="0" max="10" ${selectedPromoter ? '' : 'disabled'} /></div></div>
            <div class="form-group"><label for="admin-guest-phone">Teléfono <span class="text-secondary">(opcional)</span></label><input type="tel" class="form-input" id="admin-guest-phone" placeholder="+56 ..." ${selectedPromoter ? '' : 'disabled'} /></div>
            <button type="submit" class="btn btn-primary" ${selectedPromoter ? '' : 'disabled'}>✚ Agregar a la lista de ${selectedPromoter ? escapeHtml(selectedPromoter.displayName) : 'un promotor'}</button>
          </form>`}
      </div>
    </div>

    <div class="promoters-grid">${promoters.map(promoterCard).join('')}</div>
    ${promoters.length === 0 ? `<div class="empty-state"><div class="empty-icon">🎤</div><h4>Sin promotores</h4><p>Agregá el primer RRPP para que pueda gestionar sus listas.</p></div>` : ''}
  `;

  document.getElementById('add-promoter-btn')?.addEventListener('click', () => openCreatePromoterModal(container));
  document.getElementById('admin-promoter-select')?.addEventListener('change', (event) => {
    store.set('adminSelectedPromoterId', event.target.value);
    renderAdminPromoters(container, event.target.value);
  });
  document.getElementById('admin-add-guest-form')?.addEventListener('submit', event => addAdminGuest(event, container, selectedPromoterId));
  container.querySelectorAll('[data-promoter-action="toggle"]').forEach(button => button.addEventListener('click', () => togglePromoter(button.dataset.promoterId, container)));
  container.querySelectorAll('[data-promoter-action="delete"]').forEach(button => button.addEventListener('click', () => deletePromoter(button.dataset.promoterId, container)));
}

function addAdminGuest(event, container, promoterId) {
  event.preventDefault();
  const promoter = store.getPromoters().find(user => user.id === promoterId && user.active !== false);
  if (!promoter) { showToast('Seleccioná un promotor activo antes de crear la lista', 'error'); return; }
  const guestId = generateId('g');
  const guest = {
    id: guestId,
    firstName: document.getElementById('admin-guest-first').value.trim(),
    lastName: document.getElementById('admin-guest-last').value.trim(),
    phone: document.getElementById('admin-guest-phone').value.trim(),
    status: 'pending',
    listType: document.getElementById('admin-guest-type').value,
    plusOnes: parseInt(document.getElementById('admin-guest-plus').value, 10) || 0,
    addedBy: promoter.id,
    promoterName: promoter.displayName,
    qrCode: generateQRValue(guestId),
    selfRegistered: false,
    registeredAt: new Date().toISOString(),
    notes: '',
  };
  store.addGuest(document.getElementById('admin-guest-event').value, guest);
  store.set('adminSelectedPromoterId', promoter.id);
  showToast(`${guest.firstName} ${guest.lastName} agregado a la lista de ${promoter.displayName}`, 'success');
  renderAdminPromoters(container, promoter.id);
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
    <article class="card promoter-card ${active ? '' : 'promoter-card-inactive'}"><div class="card-body">
      <div class="promoter-card-header"><div class="flex items-center gap-16"><div class="user-avatar" style="width:48px;height:48px;font-size:1rem;">${escapeHtml(getInitials(promoter.displayName || '?'))}</div><div><div class="promoter-name">${name}</div><div class="text-sm text-secondary">${email}</div>${phone ? `<div class="text-sm text-secondary">${phone}</div>` : ''}</div></div><span class="badge ${active ? 'badge-success' : 'badge-warning'}">${active ? 'Activo' : 'Desactivado'}</span></div>
      <div class="promoter-metrics"><div><strong>${totalGuests}</strong><span>Invitados</span></div><div><strong>${totalCheckedIn}</strong><span>Check-ins</span></div><div><strong>${totalGuests > 0 ? Math.round((totalCheckedIn / totalGuests) * 100) : 0}%</strong><span>Efectividad</span></div></div>
      <div class="promoter-card-footer"><small>${active ? 'Puede ingresar y gestionar sus listas.' : 'Conserva su historial, pero no puede ingresar.'}</small><div class="promoter-actions"><button class="btn ${actionClass} btn-sm" type="button" data-promoter-action="toggle" data-promoter-id="${escapeHtml(promoter.id)}">${actionLabel}</button>${active ? '' : `<button class="icon-btn icon-btn-danger" type="button" title="Eliminar promotor permanentemente" aria-label="Eliminar ${name}" data-promoter-action="delete" data-promoter-id="${escapeHtml(promoter.id)}">🗑️</button>`}</div></div>
    </div></article>`;
}

function openCreatePromoterModal(container) {
  showModal('Nuevo promotor', `<form id="create-promoter-form"><div class="form-group"><label for="promoter-name">Nombre completo</label><input type="text" class="form-input" id="promoter-name" placeholder="Nombre y apellido" autocomplete="name" required /></div><div class="form-group"><label for="promoter-email">Email</label><input type="email" class="form-input" id="promoter-email" placeholder="email@ejemplo.com" autocomplete="email" required /></div><div class="form-group"><label for="promoter-phone">Teléfono <span class="text-secondary">(opcional)</span></label><input type="tel" class="form-input" id="promoter-phone" placeholder="+54 11 ..." autocomplete="tel" /></div><div class="promoter-form-note">El nuevo RRPP quedará activo inmediatamente y podrá ingresar con el email registrado.</div><div class="flex gap-12 mt-24"><button type="button" class="btn btn-ghost flex-1" id="cancel-promoter-btn">Cancelar</button><button type="submit" class="btn btn-primary flex-1">Crear promotor</button></div></form>`);
  document.getElementById('cancel-promoter-btn')?.addEventListener('click', closeModal);
  document.getElementById('create-promoter-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const displayName = document.getElementById('promoter-name').value.trim();
    const email = document.getElementById('promoter-email').value.trim().toLowerCase();
    const phone = document.getElementById('promoter-phone').value.trim();
    if (store.get('users').some(user => user.email?.toLowerCase() === email)) { showToast('Ya existe un usuario con ese email', 'error'); return; }
    store.addUser({ id: generateId('rrpp'), displayName, email, phone, role: 'rrpp', active: true, createdAt: new Date().toISOString(), createdBy: store.get('currentUser')?.id });
    closeModal(); showToast('Promotor creado y activado', 'success'); renderAdminPromoters(container);
  });
}

function togglePromoter(promoterId, container) {
  const promoter = store.get('users').find(user => user.id === promoterId);
  if (!promoter) return;
  if (promoter.active !== false) {
    if (!window.confirm(`¿Desactivar a ${promoter.displayName}? Ya no podrá ingresar, pero se conservarán sus listas e historial.`)) return;
    store.deactivateUser(promoterId); showToast('Promotor desactivado', 'success');
  } else { store.reactivateUser(promoterId); showToast('Promotor reactivado', 'success'); }
  renderAdminPromoters(container);
}

function deletePromoter(promoterId, container) {
  const promoter = store.get('users').find(user => user.id === promoterId);
  if (!promoter || promoter.active !== false) return;
  if (!window.confirm(`¿Eliminar permanentemente a ${promoter.displayName}? Se quitará el perfil, pero sus invitados e historial se conservarán.`)) return;
  store.removeUser(promoterId); showToast('Promotor eliminado', 'success'); renderAdminPromoters(container);
}
