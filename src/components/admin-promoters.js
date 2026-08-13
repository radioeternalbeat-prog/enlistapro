// ============================================
// EN LISTA! — Admin Promoters Management
// ============================================

import store from '../lib/store.js';
import { showModal, closeModal, showToast, generateId, getInitials } from '../lib/utils.js';

export function renderAdminPromoters(container) {
  const promoters = store.getPromoters();
  const events = store.get('events');

  container.innerHTML = `
    <div class="page-header"><div><h1 class="page-title">Promotores</h1><p class="page-subtitle">Gestiona tu equipo de RRPP</p></div><button class="btn btn-primary" id="add-promoter-btn">✚ Nuevo Promotor</button></div>
    <div class="stats-grid stagger">
      ${promoters.map(p => { let totalGuests = 0; let totalCheckedIn = 0; events.forEach(event => { const guests = store.getGuests(event.id).filter(g => g.addedBy === p.id); totalGuests += guests.length; totalCheckedIn += guests.filter(g => g.status === 'checked-in').length; }); return `<div class="card animate-in" style="padding: 0;"><div class="card-body" style="padding: 24px;"><div class="flex items-center gap-16 mb-16"><div class="user-avatar" style="width: 48px; height: 48px; font-size: 1rem;">${getInitials(p.displayName)}</div><div><div style="font-weight: 700; font-size: 1.05rem;">${p.displayName}</div><div class="text-sm text-secondary">${p.email}</div></div></div><div class="flex gap-16"><div><div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">${totalGuests}</div><div class="text-sm text-secondary">Invitados</div></div><div><div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${totalCheckedIn}</div><div class="text-sm text-secondary">Check-ins</div></div><div><div style="font-size: 1.5rem; font-weight: 700; color: var(--warning);">${totalGuests > 0 ? Math.round((totalCheckedIn / totalGuests) * 100) : 0}%</div><div class="text-sm text-secondary">Efectividad</div></div></div></div></div>`; }).join('')}
    </div>
    ${promoters.length === 0 ? `<div class="empty-state"><div class="empty-icon">🎤</div><h4>Sin promotores</h4><p>Anade promotores para que gestionen sus listas de invitados</p></div>` : ''}
  `;

  document.getElementById('add-promoter-btn')?.addEventListener('click', () => {
    showModal('Nuevo Promotor', `<form id="create-promoter-form"><div class="form-group"><label>Nombre Completo</label><input type="text" class="form-input" id="promoter-name" placeholder="Nombre y Apellido" required /></div><div class="form-group"><label>Email</label><input type="email" class="form-input" id="promoter-email" placeholder="email@ejemplo.com" required /></div><div class="form-group"><label>Telefono</label><input type="tel" class="form-input" id="promoter-phone" placeholder="+54 11 ..." /></div><div class="flex gap-12 mt-24"><button type="button" class="btn btn-ghost flex-1" onclick="document.getElementById('modal-container').innerHTML=''">Cancelar</button><button type="submit" class="btn btn-primary flex-1">Crear</button></div></form>`);
    document.getElementById('create-promoter-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = { id: generateId('rrpp'), displayName: document.getElementById('promoter-name').value, email: document.getElementById('promoter-email').value, phone: document.getElementById('promoter-phone')?.value || '', role: 'rrpp', active: true, createdAt: new Date().toISOString(), createdBy: store.get('currentUser')?.id };
      store.addUser(user); closeModal(); showToast('Promotor creado', 'success'); renderAdminPromoters(container);
    });
  });
}
