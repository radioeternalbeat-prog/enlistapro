// ============================================
// EN LISTA! — Gate Mode (Puerta) View
// Optimized for low-light, high-noise environments
// With QR Scanner integration
// ============================================

import store from '../lib/store.js';
import router from '../lib/router.js';
import { searchGuests, debounce, showToast, getCapacityLevel, vibrateDevice, getInitials, generateId } from '../lib/utils.js';

let html5QrCode = null;
let scannerActive = false;

export function renderGate(container, params = {}) {
  const user = store.get('currentUser');
  if (!user) {
    router.navigate('login');
    return;
  }

  const events = store.get('events').filter(e => e.status === 'active' || e.status === 'upcoming');
  const eventId = params.eventId || events[0]?.id;
  const event = store.getEvent(eventId);

  if (!event) {
    container.innerHTML = `
      <div class="gate-mode" style="justify-content: center; align-items: center;">
        <div class="empty-state">
          <div class="empty-icon">🚪</div>
          <h4>No hay evento activo</h4>
          <p>Espera a que el admin active un evento</p>
          <button class="btn btn-ghost mt-24" id="gate-logout">Cerrar Sesion</button>
        </div>
      </div>
    `;
    document.getElementById('gate-logout')?.addEventListener('click', () => {
      store.set('currentUser', null);
      router.navigate('login');
    });
    return;
  }

  const guests = store.getGuests(eventId);
  const checkedIn = guests.filter(g => g.status === 'checked-in').length;
  const capacityLevel = getCapacityLevel(checkedIn, event.maxCapacity);

  container.innerHTML = `
    <div class="gate-mode">
      <!-- Top Bar -->
      <div class="gate-topbar">
        <div class="flex items-center gap-12">
          <span class="gate-logo">🎉 EN LISTA!</span>
          <select class="form-select" id="gate-event-select" style="max-width: 200px; padding: 8px 12px; font-size: 0.85rem;">
            ${events.map(e => `
              <option value="${e.id}" ${e.id === eventId ? 'selected' : ''}>${e.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="flex items-center gap-12">
          <button class="gate-scan-btn" id="gate-scan-qr-btn">
            <span class="scan-icon">📷</span>
            <span>ESCANEAR QR</span>
          </button>
          <div class="gate-capacity" id="gate-capacity">
            <span class="capacity-number" id="capacity-count" style="color: var(--${capacityLevel === 'level-safe' ? 'success' : capacityLevel === 'level-warning' ? 'warning' : 'danger'})">${checkedIn}</span>
            <span class="capacity-sep">/</span>
            <span class="capacity-max">${event.maxCapacity}</span>
          </div>
          <button class="btn btn-ghost btn-sm" id="gate-logout-btn" title="Cerrar sesion">🚪</button>
        </div>
      </div>

      <!-- Capacity Bar -->
      <div class="capacity-bar" style="margin-bottom: 16px; height: 8px;">
        <div class="capacity-fill ${capacityLevel}" id="gate-capacity-bar" style="width: ${Math.min(100, (checkedIn / event.maxCapacity) * 100)}%"></div>
      </div>

      <!-- Search -->
      <div class="gate-search">
        <span class="search-icon">🔍</span>
        <input type="text" id="gate-search-input" placeholder="Buscar por nombre o apellido..." autofocus autocomplete="off" />
      </div>

      <!-- Results -->
      <div class="gate-results" id="gate-results"></div>
    </div>
  `;

  let searchQuery = '';

  function renderResults(query) {
    const allGuests = store.getGuests(eventId);
    const filtered = query ? searchGuests(allGuests, query) : allGuests;
    const resultsContainer = document.getElementById('gate-results');
    if (!resultsContainer) return;

    filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status === 'checked-in') return -1;
      if (a.status === 'checked-in' && b.status === 'pending') return 1;
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
    });

    if (filtered.length === 0 && query) {
      resultsContainer.innerHTML = `
        <div class="empty-state" style="padding: 32px;">
          <div class="empty-icon">🔍</div>
          <h4 style="color: var(--text-primary);">Sin resultados</h4>
          <p>No se encontro "${query}" en la lista</p>
        </div>
      `;
      return;
    }

    if (filtered.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-state" style="padding: 32px;">
          <div class="empty-icon">📋</div>
          <h4>Lista vacia</h4>
          <p>No hay invitados registrados</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = filtered.map(g => `
      <div class="gate-guest-card ${g.status === 'checked-in' ? 'checked-in' : ''} animate-in" id="guest-card-${g.id}">
        <div class="guest-info">
          <h4>${g.firstName} ${g.lastName}</h4>
          <div class="guest-meta">
            <span class="badge ${g.listType === 'VIP' ? 'badge-vip' : g.listType === 'backstage' ? 'badge-warning' : 'badge-primary'}">${g.listType}</span>
            ${g.plusOnes > 0 ? `<span>+${g.plusOnes} acomp.</span>` : ''}
            <span>${g.promoterName}</span>
            ${g.notes ? `<span>📝 ${g.notes}</span>` : ''}
          </div>
        </div>
        ${g.status === 'checked-in' 
          ? `<button class="checkin-btn done" disabled>✓ INGRESO</button>`
          : `<button class="checkin-btn" data-guest-id="${g.id}" data-event-id="${eventId}">CHECK IN</button>`
        }
      </div>
    `).join('');

    attachCheckInHandlers(resultsContainer, eventId, user);
  }

  function attachCheckInHandlers(container, evtId, currentUser) {
    container.querySelectorAll('.checkin-btn:not(.done)').forEach(btn => {
      btn.addEventListener('click', () => {
        performCheckIn(btn.dataset.guestId, evtId, currentUser);
      });
    });
  }

  function performCheckIn(guestId, evtId, currentUser) {
    store.checkInGuest(evtId, guestId, currentUser.id);
    
    const card = document.getElementById(`guest-card-${guestId}`);
    if (card) {
      card.classList.add('checkin-flash');
      const btn = card.querySelector('.checkin-btn');
      setTimeout(() => {
        card.classList.add('checked-in');
        if (btn) {
          btn.className = 'checkin-btn done';
          btn.disabled = true;
          btn.textContent = '✓ INGRESO';
        }
      }, 300);
    }

    vibrateDevice([50, 30, 50]);
    updateCapacityDisplay(evtId);

    const guest = store.getGuests(evtId).find(g => g.id === guestId);
    showToast(`✓ ${guest?.firstName} ${guest?.lastName} — Check-in exitoso`, 'success', 2000);
  }

  function updateCapacityDisplay(evtId) {
    const guests = store.getGuests(evtId);
    const count = guests.filter(g => g.status === 'checked-in').length;
    const evt = store.getEvent(evtId);
    const level = getCapacityLevel(count, evt.maxCapacity);
    const percent = Math.min(100, (count / evt.maxCapacity) * 100);

    const countEl = document.getElementById('capacity-count');
    const barEl = document.getElementById('gate-capacity-bar');

    if (countEl) {
      countEl.textContent = count;
      countEl.style.color = `var(--${level === 'level-safe' ? 'success' : level === 'level-warning' ? 'warning' : 'danger'})`;
    }
    if (barEl) {
      barEl.style.width = `${percent}%`;
      barEl.className = `capacity-fill ${level}`;
    }
  }

  // QR SCANNER
  async function openQRScanner() {
    const overlay = document.createElement('div');
    overlay.className = 'qr-scanner-overlay';
    overlay.id = 'qr-scanner-overlay';
    overlay.innerHTML = `
      <div class="qr-scanner-header">
        <h3>📷 Escanear QR de Invitado</h3>
        <button class="qr-scanner-close" id="qr-scanner-close">✕</button>
      </div>
      <div class="qr-scanner-body">
        <div id="qr-reader"></div>
        <div class="qr-scan-frame">
          <div class="qr-scan-corner-bl"></div>
          <div class="qr-scan-corner-br"></div>
          <div class="qr-scan-laser"></div>
        </div>
      </div>
      <div class="qr-scanner-hint">
        <p class="scan-status scanning" id="scan-status">🔍 Buscando codigo QR...</p>
        <p>Apunta la camara al codigo QR del invitado</p>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('qr-scanner-close').addEventListener('click', closeQRScanner);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrCode = new Html5Qrcode('qr-reader');
      scannerActive = true;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, disableFlip: false },
        (decodedText) => { handleQRScan(decodedText, evtId, user); },
        () => {}
      );
    } catch (err) {
      console.error('QR Scanner error:', err);
      const statusEl = document.getElementById('scan-status');
      if (statusEl) {
        statusEl.className = 'scan-status not-found';
        statusEl.textContent = '⚠️ No se pudo acceder a la camara';
      }
      showManualInput(overlay, evtId, user);
    }
  }

  function showManualInput(overlay, evtId, currentUser) {
    const hintEl = overlay.querySelector('.qr-scanner-hint');
    if (hintEl) {
      hintEl.innerHTML = `
        <p class="scan-status not-found">⚠️ Camara no disponible</p>
        <p style="margin-bottom: 12px;">Ingresa el codigo QR manualmente:</p>
        <div style="display: flex; gap: 8px; max-width: 400px; margin: 0 auto;">
          <input type="text" class="form-input" id="manual-qr-input" placeholder="Codigo QR..." style="flex: 1;" autofocus />
          <button class="btn btn-success" id="manual-qr-submit">Buscar</button>
        </div>
      `;
      
      document.getElementById('manual-qr-submit')?.addEventListener('click', () => {
        const code = document.getElementById('manual-qr-input')?.value.trim();
        if (code) handleQRScan(code, evtId, currentUser);
      });

      document.getElementById('manual-qr-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const code = e.target.value.trim();
          if (code) handleQRScan(code, evtId, currentUser);
        }
      });
    }
  }

  let isProcessingScan = false;

  function handleQRScan(qrCode, evtId, currentUser) {
    if (isProcessingScan) return;
    isProcessingScan = true;

    if (html5QrCode && scannerActive) { html5QrCode.pause(); }
    vibrateDevice([30]);
    
    const allGuests = store.getGuests(evtId);
    const guest = allGuests.find(g => g.qrCode === qrCode);
    const statusEl = document.getElementById('scan-status');

    if (guest) {
      if (statusEl) { statusEl.className = 'scan-status found'; statusEl.textContent = '✓ Invitado encontrado'; }
      showQRResult(guest, evtId, currentUser);
    } else {
      if (statusEl) { statusEl.className = 'scan-status not-found'; statusEl.textContent = '✕ QR no reconocido'; }
      vibrateDevice([100, 50, 100]);
      showQRNotFound(qrCode);
    }
  }

  function showQRResult(guest, evtId, currentUser) {
    document.querySelectorAll('.qr-result-panel').forEach(el => el.remove());
    const isAlreadyIn = guest.status === 'checked-in';
    const initials = getInitials(guest.firstName + ' ' + guest.lastName);
    
    const panel = document.createElement('div');
    panel.className = 'qr-result-panel';
    panel.innerHTML = `
      <div class="qr-result-guest">
        <div class="qr-result-avatar">${initials}</div>
        <div class="qr-result-details">
          <h4>${guest.firstName} ${guest.lastName}</h4>
          <div class="guest-meta">
            <span class="badge ${guest.listType === 'VIP' ? 'badge-vip' : guest.listType === 'backstage' ? 'badge-warning' : 'badge-primary'}">${guest.listType}</span>
            ${guest.plusOnes > 0 ? `<span>+${guest.plusOnes} acomp.</span>` : ''}
            <span>${guest.promoterName || ''}</span>
            ${guest.notes ? `<span>📝 ${guest.notes}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="qr-result-actions">
        ${isAlreadyIn 
          ? `<button class="btn btn-ghost" id="qr-result-close" style="flex: 1; border-color: var(--success); color: var(--success);">✓ YA INGRESO — Cerrar</button>`
          : `<button class="btn btn-ghost" id="qr-result-close">Cancelar</button>
             <button class="btn btn-success" id="qr-result-checkin" style="font-size: 1.1rem; font-weight: 800; letter-spacing: 1px;">✓ CHECK IN</button>`
        }
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('qr-result-checkin')?.addEventListener('click', () => {
      store.checkInGuest(evtId, guest.id, currentUser.id);
      vibrateDevice([50, 30, 50]);
      showToast(`✓ ${guest.firstName} ${guest.lastName} — Check-in exitoso!`, 'success', 2500);
      setTimeout(() => { panel.remove(); closeQRScanner(); updateCapacityDisplay(evtId); renderResults(searchQuery); }, 500);
    });

    document.getElementById('qr-result-close')?.addEventListener('click', () => {
      panel.remove();
      isProcessingScan = false;
      if (html5QrCode && scannerActive) { try { html5QrCode.resume(); } catch (e) {} }
      const statusEl = document.getElementById('scan-status');
      if (statusEl) { statusEl.className = 'scan-status scanning'; statusEl.textContent = '🔍 Buscando codigo QR...'; }
    });
  }

  function showQRNotFound(qrCode) {
    document.querySelectorAll('.qr-result-panel').forEach(el => el.remove());
    const panel = document.createElement('div');
    panel.className = 'qr-result-panel error';
    const qrSnippet = qrCode.substring(0, 24) + (qrCode.length > 24 ? '...' : '');

    panel.innerHTML = `
      <div id="qr-notfound-view">
        <div class="qr-result-guest">
          <div class="qr-result-avatar" style="background: var(--warning);">?</div>
          <div class="qr-result-details">
            <h4>QR Externo Detectado</h4>
            <div class="guest-meta">
              <span>Codigo: ${qrSnippet}</span>
              <span style="color: var(--warning); margin-top: 4px;">No registrado en sistema</span>
            </div>
          </div>
        </div>
        <div class="qr-result-actions" style="flex-direction: column; gap: 8px;">
          <button class="btn btn-primary" id="qr-register-external" style="width: 100%;">Asociar Ticketeria Externa</button>
          <button class="btn btn-ghost" id="qr-notfound-close" style="width: 100%;">Escanear Otro</button>
        </div>
      </div>
      <div id="qr-external-form" style="display: none; padding: 16px; width: 100%;">
        <h4 style="margin-bottom: 12px;">Registrar Ticket Externo</h4>
        <input type="text" id="ext-guest-name" class="form-input" placeholder="Nombre completo" style="margin-bottom: 8px;" />
        <select id="ext-guest-type" class="form-select" style="margin-bottom: 16px;">
          <option value="general">Entrada General Web</option>
          <option value="VIP">Entrada VIP Web</option>
        </select>
        <div class="flex gap-8">
          <button class="btn btn-ghost btn-sm" id="qr-ext-cancel" style="flex: 1;">Cancelar</button>
          <button class="btn btn-success btn-sm" id="qr-ext-save" style="flex: 1;">Registrar & Check-in</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    const closeScanParams = () => {
      panel.remove();
      isProcessingScan = false;
      if (html5QrCode && scannerActive) { try { html5QrCode.resume(); } catch (e) {} }
      const statusEl = document.getElementById('scan-status');
      if (statusEl) { statusEl.className = 'scan-status scanning'; statusEl.textContent = '🔍 Buscando codigo QR...'; }
    };

    document.getElementById('qr-notfound-close')?.addEventListener('click', closeScanParams);
    document.getElementById('qr-register-external')?.addEventListener('click', () => {
      document.getElementById('qr-notfound-view').style.display = 'none';
      document.getElementById('qr-external-form').style.display = 'block';
    });
    document.getElementById('qr-ext-cancel')?.addEventListener('click', () => {
      document.getElementById('qr-external-form').style.display = 'none';
      document.getElementById('qr-notfound-view').style.display = 'block';
    });
    document.getElementById('qr-ext-save')?.addEventListener('click', () => {
      const name = document.getElementById('ext-guest-name').value.trim();
      const type = document.getElementById('ext-guest-type').value;
      if (!name) { showToast('Debes ingresar un nombre', 'error'); return; }
      const newGuest = { id: generateId(), firstName: name, lastName: '(Ext)', phone: '', status: 'pending', listType: type, plusOnes: 0, addedBy: store.get('currentUser').id, promoterName: 'Ticketeria Web', qrCode: qrCode, selfRegistered: false, registeredAt: new Date().toISOString(), notes: 'Codigo QR Externo homologado' };
      store.addGuest(eventId, newGuest);
      store.checkInGuest(eventId, newGuest.id, store.get('currentUser').id);
      showToast('✓ Entrada externa registrada e ingresada', 'success');
      vibrateDevice([50, 30, 50]);
      closeScanParams();
      updateCapacityDisplay(eventId);
      renderResults(searchQuery);
    });
  }

  async function closeQRScanner() {
    isProcessingScan = false;
    if (html5QrCode && scannerActive) { try { await html5QrCode.stop(); } catch (e) {} scannerActive = false; html5QrCode = null; }
    const overlay = document.getElementById('qr-scanner-overlay');
    if (overlay) { overlay.style.animation = 'fadeIn 0.2s ease reverse forwards'; setTimeout(() => overlay.remove(), 200); }
    document.querySelectorAll('.qr-result-panel').forEach(el => el.remove());
  }

  // EVENT LISTENERS
  document.getElementById('gate-scan-qr-btn')?.addEventListener('click', openQRScanner);
  const searchInput = document.getElementById('gate-search-input');
  searchInput?.addEventListener('input', debounce((e) => { searchQuery = e.target.value; renderResults(searchQuery); }, 150));
  document.getElementById('gate-event-select')?.addEventListener('change', (e) => { renderGate(container, { eventId: e.target.value }); });
  document.getElementById('gate-logout-btn')?.addEventListener('click', () => { store.set('currentUser', null); router.navigate('login'); });

  const evtId = eventId;
  renderResults('');
  window.testQR = (code) => handleQRScan(code, evtId, store.get('currentUser'));
  setTimeout(() => searchInput?.focus(), 100);
}
