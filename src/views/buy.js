// ============================================
// EN LISTA! — Landing de compra
// Conversión: propuesta clara, demostración, precio y objeciones
// ============================================

import { saveLicenseKey } from '../lib/license.js';
import router from '../lib/router.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const MIN_WAIT_SECONDS = 120;

export function renderBuy(container) {
  container.innerHTML = `
    <main class="purchase-page">
      <div class="purchase-glow purchase-glow-cyan" aria-hidden="true"></div>
      <div class="purchase-glow purchase-glow-purple" aria-hidden="true"></div>

      <nav class="purchase-nav" aria-label="Navegación principal">
        <button class="brand-lockup" id="brand-top-btn" type="button" aria-label="Ir a activar licencia">
          <span class="brand-mark">✓</span>
          <span>EN LISTA<span class="brand-accent">!</span></span>
        </button>
        <button class="btn btn-ghost btn-sm" id="top-activate-btn" type="button">Ya tengo una licencia</button>
      </nav>

      <section class="purchase-hero" aria-labelledby="purchase-title">
        <div class="hero-copy">
          <div class="eyebrow"><span class="eyebrow-dot"></span> Control de acceso para eventos nocturnos</div>
          <h1 id="purchase-title">Menos filas.<br><span class="gradient-text">Más control en la puerta.</span></h1>
          <p class="hero-lead">Organizá tus listas, generá códigos QR y validá cada ingreso desde tu celular. EN LISTA! te ayuda a recibir a tus invitados sin planillas ni búsquedas interminables.</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" id="hero-buy-btn" type="button">Comprar licencia <span aria-hidden="true">→</span></button>
            <a class="btn btn-ghost btn-lg" href="#how-it-works">Ver cómo funciona</a>
          </div>
          <div class="trust-row" aria-label="Beneficios de la licencia">
            <span>✓ Pago único</span>
            <span>✓ Hasta 3 dispositivos</span>
            <span>✓ Eventos ilimitados</span>
          </div>
        </div>

        <div class="product-preview" aria-label="Vista previa del panel de control">
          <div class="preview-topbar"><span class="preview-brand">EN LISTA<span>!</span></span><span class="preview-live"><i></i> En vivo</span></div>
          <div class="preview-heading"><div><small>EVENTO ACTIVO</small><strong>Noche Electrónica</strong></div><span class="preview-date">HOY · 23:00</span></div>
          <div class="preview-stats">
            <div><span>Ingresos</span><strong>248</strong><em>↑ 12%</em></div>
            <div><span>En lista</span><strong>386</strong><em class="preview-muted">invitados</em></div>
            <div><span>Aforo</span><strong>72%</strong><em class="preview-green">Disponible</em></div>
          </div>
          <div class="preview-capacity"><div><span>Capacidad del evento</span><strong>248 / 350</strong></div><div class="capacity-track"><i></i></div></div>
          <div class="preview-checkins"><div class="checkin-title"><span>Últimos ingresos</span><span>Ver todos →</span></div><div class="checkin-row"><b>MA</b><span>María A. · VIP</span><i>✓ Validado</i></div><div class="checkin-row"><b>JP</b><span>Juan P. · General</span><i>✓ Validado</i></div></div>
        </div>
      </section>

      <section class="benefit-strip" aria-label="Beneficios principales">
        <article><span class="benefit-icon">⌁</span><div><h2>Ingresos más rápidos</h2><p>Escaneá el QR y validá en segundos.</p></div></article>
        <article><span class="benefit-icon">◉</span><div><h2>Todo bajo control</h2><p>Consultá el aforo y los accesos en vivo.</p></div></article>
        <article><span class="benefit-icon">∞</span><div><h2>Sin mensualidad</h2><p>Una licencia para todos tus eventos.</p></div></article>
      </section>

      <section class="section-block" id="how-it-works" aria-labelledby="how-title">
        <div class="section-heading"><span class="section-kicker">Así de simple</span><h2 id="how-title">Del registro al ingreso en tres pasos</h2><p>Una experiencia clara para tu equipo y tus invitados.</p></div>
        <div class="steps-grid">
          <article class="step-card"><span class="step-number">01</span><h3>Creá tu evento</h3><p>Configurá el evento y cargá la lista de invitados desde el dashboard.</p></article>
          <article class="step-card"><span class="step-number">02</span><h3>Compartí los accesos</h3><p>Cada invitado recibe su código QR para presentar en la puerta.</p></article>
          <article class="step-card"><span class="step-number">03</span><h3>Escaneá y controlá</h3><p>Validá cada ingreso y seguí el aforo en tiempo real desde tu celular.</p></article>
        </div>
      </section>

      <section class="purchase-section" id="buy-section" aria-labelledby="license-title">
        <div class="license-summary">
          <span class="section-kicker">Una licencia, todos tus eventos</span>
          <h2 id="license-title">EN LISTA! PRO</h2>
          <p>Todo lo que necesitás para organizar el acceso de tu club, bar o evento.</p>
          <ul class="feature-list">
            <li><span>✓</span><div><strong>Hasta 3 dispositivos</strong><small>Activá la licencia en tu equipo de administración y puerta.</small></div></li>
            <li><span>✓</span><div><strong>Escáner QR integrado</strong><small>Validá invitados sin buscar nombres manualmente.</small></div></li>
            <li><span>✓</span><div><strong>Dashboard en tiempo real</strong><small>Visualizá listas, accesos y capacidad desde un solo lugar.</small></div></li>
            <li><span>✓</span><div><strong>Invitados y eventos ilimitados</strong><small>Usá tu licencia en cada fecha que organices.</small></div></li>
          </ul>
        </div>

        <div class="payment-card" id="payment-card">
          <div class="price-line"><span class="price">$35</span><span class="currency">USD</span></div>
          <p class="price-note">Pago único · Sin suscripción mensual</p>

          <div id="payment-step-1">
            <label class="payment-label" for="buyer-email">¿A qué correo enviamos las instrucciones?</label>
            <input type="email" id="buyer-email" class="form-input" placeholder="tu@club.com" autocomplete="email" required>
            <button id="mp-btn" class="btn btn-primary btn-lg btn-block payment-cta" type="button">Continuar con Mercado Pago <span aria-hidden="true">→</span></button>
            <p class="payment-helper">Serás redirigido a Mercado Pago para completar el pago de forma segura.</p>
          </div>

          <div id="payment-step-2" class="payment-step" style="display: none;">
            <div class="payment-status"><span>02</span><div><strong>Completá tu pago</strong><p>Volvé a esta ventana después de pagar en Mercado Pago.</p></div></div>
            <div id="timer-container" class="timer-container"><p>Tiempo de procesamiento</p><strong id="countdown"></strong><div class="timer-track"><i id="timer-bar"></i></div></div>
            <div id="verify-section" style="display: none;">
              <label class="payment-label" for="operation-number">Número de operación de Mercado Pago</label>
              <input type="text" id="operation-number" class="form-input" placeholder="Ej: 12345678901" inputmode="numeric" required>
              <p class="payment-helper">Encontralo en el comprobante o en el correo de confirmación del pago.</p>
              <button id="confirm-payment-btn" class="btn btn-success btn-lg btn-block" type="button">Continuar con la activación <span aria-hidden="true">→</span></button>
              <p class="verification-note">Procesaremos tu solicitud y te mostraremos la licencia cuando esté lista.</p>
            </div>
          </div>

          <div id="payment-step-3" class="payment-step payment-success" style="display: none;">
            <div class="success-icon">✓</div><h3>Solicitud recibida</h3><p>Guardá este código para activar tus dispositivos:</p>
            <div id="generated-key" class="generated-key">ENLS-XXXX-XXXX</div>
            <p class="payment-helper">Podés activarlo ahora o copiarlo para usarlo en otro dispositivo.</p>
            <button id="auto-activate-btn" class="btn btn-primary btn-lg btn-block" type="button">Activar esta app ahora</button>
          </div>

          <p class="secure-note">🔒 Procesamiento mediante Mercado Pago · Licencia para hasta 3 dispositivos</p>
        </div>
      </section>

      <section class="faq-section section-block" aria-labelledby="faq-title">
        <div class="section-heading"><span class="section-kicker">Preguntas frecuentes</span><h2 id="faq-title">Antes de empezar</h2></div>
        <div class="faq-list">
          <details><summary>¿Hay un pago mensual?</summary><p>No. La licencia cuesta US$35 por única vez y está pensada para acompañar todos tus eventos.</p></details>
          <details><summary>¿En cuántos dispositivos puedo usarla?</summary><p>Podés activarla en hasta 3 dispositivos: por ejemplo, administración y dos puestos de puerta.</p></details>
          <details><summary>¿Necesito instalar una aplicación?</summary><p>EN LISTA! funciona desde el navegador y puede instalarse como una app en celulares y tablets compatibles.</p></details>
          <details><summary>¿Puedo usarla para varios eventos?</summary><p>Sí. La licencia incluye invitados y eventos ilimitados, según las condiciones del servicio.</p></details>
        </div>
      </section>

      <footer class="purchase-footer"><strong>EN LISTA<span class="brand-accent">!</span></strong><span>Control de acceso simple para la noche.</span><button id="footer-activate-btn" class="btn btn-ghost btn-sm" type="button">Activar una licencia</button></footer>
    </main>
  `;

  document.getElementById('brand-top-btn')?.addEventListener('click', () => router.navigate('activate'));
  document.getElementById('top-activate-btn')?.addEventListener('click', () => router.navigate('activate'));
  document.getElementById('footer-activate-btn')?.addEventListener('click', () => router.navigate('activate'));
  document.getElementById('hero-buy-btn')?.addEventListener('click', () => document.getElementById('buy-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  document.getElementById('mp-btn').addEventListener('click', () => {
    const email = document.getElementById('buyer-email').value.trim();
    if (!email || !email.includes('@')) { alert('Por favor ingresá un email válido para asociarlo a tu licencia.'); return; }
    window.open('https://link.mercadopago.cl/happybeatcl', '_blank');
    document.getElementById('payment-step-1').style.display = 'none';
    document.getElementById('payment-step-2').style.display = 'block';
    startCountdown();
  });

  function startCountdown() {
    let secondsLeft = MIN_WAIT_SECONDS;
    const countdownEl = document.getElementById('countdown');
    const timerBar = document.getElementById('timer-bar');
    const verifySection = document.getElementById('verify-section');
    const timerContainer = document.getElementById('timer-container');
    function updateTimer() {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      timerBar.style.width = `${((MIN_WAIT_SECONDS - secondsLeft) / MIN_WAIT_SECONDS) * 100}%`;
      if (secondsLeft <= 0) {
        timerContainer.innerHTML = '<div class="timer-done">✓ Ya podés ingresar el número de operación</div>';
        verifySection.style.display = 'block';
        return;
      }
      secondsLeft -= 1;
      setTimeout(updateTimer, 1000);
    }
    updateTimer();
  }

  document.getElementById('confirm-payment-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('buyer-email').value.trim();
    const operationNumber = document.getElementById('operation-number').value.trim();
    if (!operationNumber || operationNumber.length < 5) { alert('Por favor ingresá un número de operación válido.'); return; }
    const btn = document.getElementById('confirm-payment-btn');
    btn.disabled = true;
    btn.innerHTML = 'Procesando solicitud...';
    try {
      const newKey = 'ENLS-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
      await setDoc(doc(db, 'payment_records', newKey), { licenseKey: newKey, email, operationNumber, plan: 'PRO', maxDevices: 3, verified: false, createdAt: serverTimestamp(), userAgent: navigator.userAgent });
      await setDoc(doc(db, 'licenses', newKey), { key: newKey, email, plan: 'PRO', maxDevices: 3, devices: [], status: 'active', operationNumber, createdAt: serverTimestamp() });
      document.getElementById('payment-step-2').style.display = 'none';
      document.getElementById('payment-step-3').style.display = 'block';
      document.getElementById('generated-key').innerText = newKey;
      document.getElementById('auto-activate-btn').addEventListener('click', () => { saveLicenseKey(newKey); window.location.reload(); });
    } catch (error) {
      console.error('Error generating license:', error);
      alert('No pudimos procesar la solicitud. Verificá tu conexión e intentá de nuevo.');
      btn.disabled = false;
      btn.innerHTML = 'Continuar con la activación <span aria-hidden="true">→</span>';
    }
  });
}
