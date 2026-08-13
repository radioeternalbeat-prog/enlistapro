// ============================================
// EN LISTA! — RRPP (Promoter) View
// ============================================

import store from '../lib/store.js';
import router from '../lib/router.js';
import { renderSidebar } from '../components/sidebar.js';
import { showModal, closeModal, showToast, generateId, generateQRValue, formatDate, searchGuests, debounce } from '../lib/utils.js';
import QRCode from 'qrcode';

export function renderRRPP(container) {
  const user = store.get('currentUser');
  if (!user || user.role !== 'rrpp') { router.navigate('login'); return; }

  container.innerHTML = `
    <div class="dashboard">
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <aside class="sidebar" id="sidebar"></aside>
      <main class="main-content" id="main-content">
        <div style="display:flex; align-items:center; gap: 12px; margin-bottom: 8px;"><button class="hamburger" id="hamburger-btn">☰</button></div>
        <div id="rrpp-view-content"></div>
      </main>
    </div>
  `;

  const navItems = [
    { id: 'my-lists', icon: '📋', label: 'Mis Listas' },
    { id: 'add-guest', icon: '➕', label: 'Anadir Invitado' },
    { id: 'share-link', icon: '🔗', label: 'Link de Registro' },
  ];

  renderSidebar(document.getElementById('sidebar'), navItems, (section) => { store.set('sidebarSection', section); renderRRPPSection(section, user); });
  document.getElementById('hamburger-btn')?.addEventListener('click', () => { document.getElementById('sidebar')?.classList.toggle('open'); document.getElementById('sidebar-overlay')?.classList.toggle('show'); });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => { document.getElementById('sidebar')?.classList.remove('open'); document.getElementById('sidebar-overlay')?.classList.remove('show'); });
  renderRRPPSection(store.get('sidebarSection') || 'my-lists', user);
}

function renderRRPPSection(section, user) {
  const content = document.getElementById('rrpp-view-content');
  if (!content) return;
  document.querySelectorAll('.nav-item').forEach(item => { item.classList.toggle('active', item.dataset.section === section); });
  switch (section) {
    case 'my-lists': renderMyLists(content, user); break;
    case 'add-guest': renderAddGuest(content, user); break;
    case 'share-link': renderShareLink(content, user); break;
    default: renderMyLists(content, user);
  }
}

function renderMyLists(container, user) {
  const events = store.get('events').filter(e => e.status !== 'closed');
  const selectedEventId = events[0]?.id;
  container.innerHTML = `
    <div class="page-header"><div><h1 class="page-title">Mis Listas</h1><p class="page-subtitle">Invitados que has anadido</p></div>
      <select class="form-select" id="rrpp-event-select" style="max-width: 240px;">${events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}</select>
    </div>
    <div class="guest-list-header"><div class="search-bar"><span class="search-icon">🔍</span><input type="text" id="rrpp-search" placeholder="Buscar invitado..." /></div><button class="btn btn-primary btn-sm" id="quick-add-btn">➕ Anadir</button></div>
    <div class="list-type-selector"><button class="list-type-btn active" data-type="all">Todos</button><button class="list-type-btn" data-type="VIP">VIP</button><button class="list-type-btn" data-type="general">General</button><button class="list-type-btn" data-type="backstage">Backstage</button></div>
    <div id="guest-list-container"></div>
  `;
  let currentFilter = 'all'; let searchQuery = '';
  function refreshList() {
    const eventId = document.getElementById('rrpp-event-select')?.value || selectedEventId;
    let guests = store.getGuests(eventId).filter(g => g.addedBy === user.id);
    if (currentFilter !== 'all') guests = guests.filter(g => g.listType === currentFilter);
    guests = searchGuests(guests, searchQuery);
    const listContainer = document.getElementById('guest-list-container');
    if (!listContainer) return;
    if (guests.length === 0) { listContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h4>Lista vacia</h4><p>Aun no has anadido invitados a este evento</p></div>`; return; }
    listContainer.innerHTML = `<div class="card"><table class="data-table"><thead><tr><th>Invitado</th><th>Tipo</th><th>Acomp.</th><th>Estado</th><th>QR</th><th></th></tr></thead><tbody>${guests.map(g => `<tr class="animate-in"><td><div style="font-weight: 600">${g.firstName} ${g.lastName}</div><div class="text-sm text-secondary">${g.phone || 'Sin telefono'}</div></td><td><span class="badge ${g.listType === 'VIP' ? 'badge-vip' : g.listType === 'backstage' ? 'badge-warning' : 'badge-primary'}">${g.listType}</span></td><td class="text-center">+${g.plusOnes}</td><td><span class="badge ${g.status === 'checked-in' ? 'badge-success' : 'badge-warning'}">${g.status === 'checked-in' ? '✓ Ingreso' : 'Pendiente'}</span></td><td><button class="btn btn-ghost btn-sm show-qr" data-guest='${JSON.stringify(g)}'>📱</button></td><td>${g.status !== 'checked-in' ? `<button class="btn btn-ghost btn-sm remove-guest" data-event="${document.getElementById('rrpp-event-select')?.value || selectedEventId}" data-guest="${g.id}">🗑️</button>` : ''}</td></tr>`).join('')}</tbody></table></div><p class="text-sm text-secondary mt-8">${guests.length} invitado(s) en tu lista</p>`;
    listContainer.querySelectorAll('.show-qr').forEach(btn => { btn.addEventListener('click', async () => { const guest = JSON.parse(btn.dataset.guest); await showQRModal(guest); }); });
    listContainer.querySelectorAll('.remove-guest').forEach(btn => { btn.addEventListener('click', () => { store.removeGuest(btn.dataset.event, btn.dataset.guest); showToast('Invitado eliminado', 'info'); refreshList(); }); });
  }
  document.getElementById('rrpp-search')?.addEventListener('input', debounce((e) => { searchQuery = e.target.value; refreshList(); }, 200));
  container.querySelectorAll('.list-type-btn').forEach(btn => { btn.addEventListener('click', () => { container.querySelectorAll('.list-type-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentFilter = btn.dataset.type; refreshList(); }); });
  document.getElementById('rrpp-event-select')?.addEventListener('change', refreshList);
  document.getElementById('quick-add-btn')?.addEventListener('click', () => { store.set('sidebarSection', 'add-guest'); renderRRPPSection('add-guest', user); });
  refreshList();
}

function renderAddGuest(container, user) {
  const events = store.get('events').filter(e => e.status !== 'closed');
  container.innerHTML = `
    <div class="page-header"><div><h1 class="page-title">Anadir Invitado</h1><p class="page-subtitle">Agrega personas a tu lista</p></div></div>
    <div class="card" style="max-width: 500px;"><div class="card-body"><form id="add-guest-form">
      <div class="form-group"><label>Evento</label><select class="form-select" id="guest-event" required>${events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}</select></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;"><div class="form-group"><label>Nombre</label><input type="text" class="form-input" id="guest-first" placeholder="Nombre" required /></div><div class="form-group"><label>Apellido</label><input type="text" class="form-input" id="guest-last" placeholder="Apellido" required /></div></div>
      <div class="form-group"><label>Telefono (opcional)</label><input type="tel" class="form-input" id="guest-phone" placeholder="+54 11 ..." /></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;"><div class="form-group"><label>Tipo de Lista</label><select class="form-select" id="guest-type"><option value="general">General</option><option value="VIP">VIP</option><option value="backstage">Backstage</option></select></div><div class="form-group"><label>Acompanantes</label><input type="number" class="form-input" id="guest-plus" value="0" min="0" max="10" /></div></div>
      <div class="form-group"><label>Notas (opcional)</label><input type="text" class="form-input" id="guest-notes" placeholder="Ej: Mesa reservada, cumpleanos..." /></div>
      <button type="submit" class="btn btn-primary btn-block btn-lg mt-16">✚ Anadir a la Lista</button>
    </form></div></div>
  `;
  document.getElementById('add-guest-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const guestId = generateId('g');
    const guest = { id: guestId, firstName: document.getElementById('guest-first').value.trim(), lastName: document.getElementById('guest-last').value.trim(), phone: document.getElementById('guest-phone').value.trim(), status: 'pending', listType: document.getElementById('guest-type').value, plusOnes: parseInt(document.getElementById('guest-plus').value) || 0, addedBy: user.id, promoterName: user.displayName, qrCode: generateQRValue(guestId), selfRegistered: false, registeredAt: new Date().toISOString(), notes: document.getElementById('guest-notes').value.trim() };
    const eventId = document.getElementById('guest-event').value;
    store.addGuest(eventId, guest);
    showToast(`${guest.firstName} ${guest.lastName} anadido a la lista`, 'success');
    await showQRModal(guest);
    document.getElementById('add-guest-form').reset();
  });
}

function renderShareLink(container, user) {
  const events = store.get('events').filter(e => e.status !== 'closed');
  container.innerHTML = `
    <div class="page-header"><div><h1 class="page-title">Link de Auto-Registro</h1><p class="page-subtitle">Genera un link para que tus invitados se registren solos</p></div></div>
    <div class="card" style="max-width: 500px;"><div class="card-body"><form id="gen-link-form">
      <div class="form-group"><label>Evento</label><select class="form-select" id="link-event" required>${events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}</select></div>
      <div class="form-group"><label>Tipo de Lista</label><select class="form-select" id="link-type"><option value="general">General</option><option value="VIP">VIP</option></select></div>
      <div class="form-group"><label>Maximo de Registros</label><input type="number" class="form-input" id="link-max" value="50" min="1" /></div>
      <button type="submit" class="btn btn-primary btn-block btn-lg mt-16">🔗 Generar Link</button>
    </form><div id="generated-link" class="hidden mt-24"><div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 20px; text-align: center;"><p class="text-sm text-secondary mb-8">Comparte este link con tus invitados:</p><div class="share-link-box"><input type="text" id="share-link-input" readonly /><button class="btn btn-primary btn-sm" id="copy-link-btn">Copiar</button></div><div id="link-qr" class="mt-16"></div></div></div></div></div>
  `;
  document.getElementById('gen-link-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const linkId = generateId('link');
    const eventId = document.getElementById('link-event').value;
    const selectedEvent = store.getEvent(eventId);
    const link = { id: linkId, eventId, promoterId: user.id, promoterName: user.displayName, listType: document.getElementById('link-type').value, maxRegistrations: parseInt(document.getElementById('link-max').value), currentRegistrations: 0, active: true, createdAt: new Date().toISOString() };
    store.addRegistrationLink(link);
    const linkData = { id: linkId, eid: eventId, en: selectedEvent?.name || 'Evento', ev: selectedEvent?.venue || '', ed: selectedEvent?.date || '', pid: user.id, pn: user.displayName, lt: link.listType, mx: link.maxRegistrations };
    const encoded = btoa(encodeURIComponent(JSON.stringify(linkData)));
    const baseUrl = window.location.origin;
    const regUrl = `${baseUrl}/#register/${encoded}`;
    const linkContainer = document.getElementById('generated-link');
    linkContainer.classList.remove('hidden');
    document.getElementById('share-link-input').value = regUrl;
    const qrContainer = document.getElementById('link-qr');
    qrContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, regUrl, { width: 180, color: { dark: '#000000', light: '#ffffff' } });
    qrContainer.appendChild(canvas);
    showToast('Link generado exitosamente', 'success');
  });
  document.addEventListener('click', (e) => {
    if (e.target.id === 'copy-link-btn') {
      const input = document.getElementById('share-link-input');
      navigator.clipboard?.writeText(input.value).then(() => { showToast('Link copiado al portapapeles', 'success'); }).catch(() => { input.select(); document.execCommand('copy'); showToast('Link copiado', 'success'); });
    }
  });
}

async function showQRModal(guest) {
  const qrValue = guest.qrCode || generateQRValue(guest.id);
  showModal('Codigo QR', `<div class="qr-container" id="qr-render"><div class="spinner"></div></div><div class="qr-guest-name">${guest.firstName} ${guest.lastName}</div><div class="qr-guest-meta">${guest.listType}${guest.plusOnes > 0 ? ` · +${guest.plusOnes} acomp.` : ''}</div><p class="text-sm text-secondary text-center mt-8">${qrValue}</p>`);
  setTimeout(async () => {
    const qrContainer = document.getElementById('qr-render');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrValue, { width: 200, color: { dark: '#000000', light: '#ffffff' }, margin: 2 });
      canvas.style.borderRadius = '12px';
      qrContainer.appendChild(canvas);
    }
  }, 100);
}
