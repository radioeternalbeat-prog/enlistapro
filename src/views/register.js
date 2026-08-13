// ============================================
// EN LISTA! — Public Self-Registration View
// ============================================

import store from '../lib/store.js';
import { generateId, generateQRValue, showToast, formatDate } from '../lib/utils.js';
import QRCode from 'qrcode';

function decodeLinkData(linkId) {
  try {
    const decoded = decodeURIComponent(atob(linkId));
    return JSON.parse(decoded);
  } catch (e) {
    const links = store.get('registrationLinks') || {};
    const link = links[linkId];
    if (link) {
      const event = store.getEvent(link.eventId);
      return { id: linkId, eid: link.eventId, en: event?.name || 'Evento', ev: event?.venue || '', ed: event?.date || '', pid: link.promoterId, pn: link.promoterName, lt: link.listType, mx: link.maxRegistrations };
    }
    return null;
  }
}

export function renderRegister(container, params = {}) {
  const rawLinkId = params.linkId;
  const linkData = decodeLinkData(rawLinkId);

  if (!linkData) {
    container.innerHTML = `<div class="register-page"><div class="login-logo"><span class="logo-icon">🎉</span><h1>EN LISTA!</h1></div><div class="register-card text-center"><div style="font-size: 3rem; margin-bottom: 16px;">😢</div><h2>Link invalido</h2><p class="text-secondary">Este link de registro no existe o ha expirado.</p></div></div>`;
    return;
  }

  const link = { id: linkData.id, eventId: linkData.eid, promoterId: linkData.pid, promoterName: linkData.pn, listType: linkData.lt, maxRegistrations: linkData.mx, active: true };
  const event = { name: linkData.en, venue: linkData.ev, date: linkData.ed };

  const regCounts = JSON.parse(localStorage.getItem('enlista_reg_counts') || '{}');
  const currentRegistrations = regCounts[link.id] || 0;

  if (currentRegistrations >= link.maxRegistrations) {
    container.innerHTML = `<div class="register-page"><div class="login-logo"><span class="logo-icon">🎉</span><h1>EN LISTA!</h1></div><div class="register-card text-center"><div style="font-size: 3rem; margin-bottom: 16px;">⛔</div><h2>Lista completa</h2><p class="text-secondary">Este link ya alcanzo el maximo de registros.</p></div></div>`;
    return;
  }

  const spotsLeft = link.maxRegistrations - currentRegistrations;

  container.innerHTML = `
    <div class="register-page">
      <div class="login-logo"><span class="logo-icon">🎉</span><h1>EN LISTA!</h1></div>
      <div class="register-card animate-in">
        <div class="reg-event-header">
          <h2>${event.name}</h2>
          <div class="reg-event-info"><span>📍 ${event.venue}</span><span>📅 ${event.date ? formatDate(event.date) : ''}</span></div>
          <div class="reg-event-meta">
            <span class="badge ${link.listType === 'VIP' ? 'badge-vip' : 'badge-primary'}">${link.listType}</span>
            <span class="reg-promoter">🎤 Lista de ${link.promoterName}</span>
          </div>
          <div class="reg-spots-left"><span class="spots-number">${spotsLeft}</span> lugar${spotsLeft !== 1 ? 'es' : ''} disponible${spotsLeft !== 1 ? 's' : ''}</div>
        </div>
        <form id="register-form">
          <p class="reg-form-title">📝 Completa tus datos para entrar a la lista</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group"><label>Nombre *</label><input type="text" class="form-input" id="reg-first" placeholder="Tu nombre" required autocomplete="given-name" /></div>
            <div class="form-group"><label>Apellido *</label><input type="text" class="form-input" id="reg-last" placeholder="Tu apellido" required autocomplete="family-name" /></div>
          </div>
          <div class="form-group"><label>Email</label><input type="email" class="form-input" id="reg-email" placeholder="tu@email.com" autocomplete="email" /></div>
          <div class="form-group"><label>Telefono / WhatsApp</label><input type="tel" class="form-input" id="reg-phone" placeholder="+54 11 ..." autocomplete="tel" /></div>
          <div class="form-group"><label>Acompanantes</label><div class="plus-ones-selector"><button type="button" class="plus-btn minus" id="plus-minus">−</button><span id="plus-count">0</span><button type="button" class="plus-btn plus" id="plus-add">+</button></div></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg mt-16" id="submit-btn">✅ Registrarme en la Lista</button>
          <p class="reg-disclaimer">Al registrarte aceptas las condiciones del evento. El QR es personal e intransferible.</p>
        </form>
        <div id="register-success" class="hidden">
          <div class="register-success-content">
            <div class="success-animation"><div class="success-check">✓</div></div>
            <h3>Estas en la lista! 🎉</h3>
            <p class="text-secondary mb-16">Presenta este codigo QR en la puerta del evento</p>
            <div class="qr-pass-card" id="qr-pass-card">
              <div class="qr-pass-header"><span class="qr-pass-logo">🎉 EN LISTA!</span><span class="qr-pass-badge" id="qr-pass-type"></span></div>
              <div class="qr-pass-event" id="qr-pass-event"></div>
              <div class="qr-pass-venue" id="qr-pass-venue"></div>
              <div class="qr-pass-date" id="qr-pass-date"></div>
              <div class="qr-pass-qr" id="reg-qr-container"></div>
              <div class="qr-pass-name" id="reg-name-display"></div>
              <div class="qr-pass-code" id="reg-code-display"></div>
              <div class="qr-pass-plus" id="qr-pass-plus"></div>
            </div>
            <div class="qr-action-buttons">
              <button class="btn btn-success btn-lg btn-block" id="download-qr-btn">📥 Descargar mi QR</button>
              <button class="btn btn-primary btn-lg btn-block" id="share-whatsapp-btn">💬 Compartir por WhatsApp</button>
              <button class="btn btn-ghost btn-block" id="screenshot-hint-btn">📸 O hace una captura de pantalla</button>
            </div>
            <div class="qr-instructions"><h4>📋 Instrucciones</h4><ol><li>Guarda este QR en tu celular (descargalo o hace screenshot)</li><li>Al llegar al evento, mostra el QR en la puerta</li><li>El staff lo escanea y listo, entras!</li></ol></div>
          </div>
        </div>
      </div>
      <p class="reg-footer">Powered by <strong>EN LISTA!</strong> — Control de acceso para eventos</p>
    </div>
  `;

  let plusOnes = 0;
  const maxPlus = 5;
  document.getElementById('plus-minus')?.addEventListener('click', () => { if (plusOnes > 0) { plusOnes--; document.getElementById('plus-count').textContent = plusOnes; } });
  document.getElementById('plus-add')?.addEventListener('click', () => { if (plusOnes < maxPlus) { plusOnes++; document.getElementById('plus-count').textContent = plusOnes; } });

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Registrando...';

    const guestId = generateId('g');
    const qrCode = generateQRValue(guestId);
    const guest = { id: guestId, firstName: document.getElementById('reg-first').value.trim(), lastName: document.getElementById('reg-last').value.trim(), email: document.getElementById('reg-email').value.trim(), phone: document.getElementById('reg-phone').value.trim(), status: 'pending', listType: link.listType, plusOnes: plusOnes, addedBy: link.promoterId, promoterName: link.promoterName, qrCode: qrCode, selfRegistered: true, registeredAt: new Date().toISOString(), registeredViaLink: link.id, notes: '' };

    store.addGuest(link.eventId, guest);
    const counts = JSON.parse(localStorage.getItem('enlista_reg_counts') || '{}');
    counts[link.id] = (counts[link.id] || 0) + 1;
    localStorage.setItem('enlista_reg_counts', JSON.stringify(counts));

    await new Promise(r => setTimeout(r, 600));

    document.getElementById('register-form').classList.add('hidden');
    const successDiv = document.getElementById('register-success');
    successDiv.classList.remove('hidden');
    
    document.getElementById('qr-pass-event').textContent = event.name;
    document.getElementById('qr-pass-venue').textContent = `📍 ${event.venue}`;
    document.getElementById('qr-pass-date').textContent = `📅 ${event.date ? formatDate(event.date) : ''}`;
    document.getElementById('qr-pass-type').textContent = link.listType;
    document.getElementById('qr-pass-type').className = `qr-pass-badge ${link.listType === 'VIP' ? 'vip' : ''}`;
    document.getElementById('reg-name-display').textContent = `${guest.firstName} ${guest.lastName}`;
    document.getElementById('reg-code-display').textContent = qrCode;
    document.getElementById('qr-pass-plus').textContent = plusOnes > 0 ? `+${plusOnes} acompanante${plusOnes > 1 ? 's' : ''}` : '';

    const qrContainer = document.getElementById('reg-qr-container');
    const canvas = document.createElement('canvas');
    canvas.id = 'qr-canvas';
    await QRCode.toCanvas(canvas, qrCode, { width: 240, color: { dark: '#000000', light: '#ffffff' }, margin: 2 });
    canvas.style.borderRadius = '16px';
    qrContainer.appendChild(canvas);

    document.getElementById('download-qr-btn')?.addEventListener('click', async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(qrCode, { width: 300, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `ENLISTA_QR_${guest.firstName}_${guest.lastName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('✅ QR descargado exitosamente', 'success');
      } catch (err) {
        showToast('Error al descargar. Intenta con captura de pantalla.', 'error');
      }
    });

    document.getElementById('share-whatsapp-btn')?.addEventListener('click', () => {
      const message = encodeURIComponent(`🎉 Estoy en la lista!\n\n📍 *${event.name}*\n🏠 ${event.venue}\n🎫 Lista: ${link.listType}\n👤 ${guest.firstName} ${guest.lastName}\n🔑 Codigo: ${qrCode}\n${plusOnes > 0 ? `👥 +${plusOnes} acompanantes\n` : ''}\nPresentar QR en la puerta 🚪`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
    });

    document.getElementById('screenshot-hint-btn')?.addEventListener('click', () => {
      showToast('📸 Hace una captura de pantalla ahora para guardar tu QR', 'info', 4000);
    });
  });
}
