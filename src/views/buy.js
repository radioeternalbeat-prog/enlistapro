// ============================================
// EN LISTA! — Buy View (Secure Payment Flow)
// Uses Firebase Cloud Functions + Mercado Pago
// ============================================

import { saveLicenseKey } from '../lib/license.js';
import router from '../lib/router.js';

// URL of your deployed Cloud Functions (update after deploy)
const FUNCTIONS_BASE_URL = 'https://us-central1-app-happybeat.cloudfunctions.net';

export function renderBuy(container) {
  container.innerHTML = `
    <div style="min-height: 100dvh; background: var(--bg-primary); padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
      
      <!-- Blob background -->
      <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: rgba(0, 177, 234, 0.15); border-radius: 50%; filter: blur(60px);"></div>
      <div style="position: absolute; bottom: -100px; left: -100px; width: 300px; height: 300px; background: rgba(123, 47, 255, 0.15); border-radius: 50%; filter: blur(60px);"></div>

      <div style="max-width: 800px; width: 100%; z-index: 1;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; margin-bottom: 12px;">Desbloquea EN LISTA<span style="color:var(--accent-primary)">!</span> PRO</h1>
          <p style="color: var(--text-secondary); font-size: 1.1rem; max-width: 500px; margin: 0 auto;">La herramienta definitiva para el control de aforo y listas de invitados en tu club, sin limites.</p>
        </div>

        <!-- Pricing Card -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 40px; display: flex; flex-direction: column; gap: 40px; box-shadow: var(--shadow-lg);">
          
          <!-- Features -->
          <div style="flex: 1;">
            <h3 style="font-size: 1.2rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px;">Licencia Unica</h3>
            
            <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px;">
              <li style="display: flex; align-items: center; gap: 12px;">
                <div style="background: var(--success-bg); color: var(--success); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✓</div>
                <span>Instalacion hasta en <strong>3 dispositivos</strong> simultaneos.</span>
              </li>
              <li style="display: flex; align-items: center; gap: 12px;">
                <div style="background: var(--success-bg); color: var(--success); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✓</div>
                <span>Escaner de QR de alta velocidad integrado.</span>
              </li>
              <li style="display: flex; align-items: center; gap: 12px;">
                <div style="background: var(--success-bg); color: var(--success); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✓</div>
                <span>Dashboard Admin con estadisticas globales.</span>
              </li>
              <li style="display: flex; align-items: center; gap: 12px;">
                <div style="background: var(--success-bg); color: var(--success); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✓</div>
                <span>Invitados y eventos ilimitados.</span>
              </li>
            </ul>
          </div>

          <!-- Payment Area -->
          <div style="flex: 1; background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 32px; border: 1px solid rgba(0, 177, 234, 0.2); text-align: center;">
            <div style="font-size: 3rem; font-family: var(--font-display); font-weight: 800; color: #fff; margin-bottom: 8px;">$35<span style="font-size: 1rem; color: var(--text-secondary);"> USD</span></div>
            <p style="color: var(--text-secondary); margin-bottom: 32px; font-size: 0.9rem;">Pago unico por licencia</p>
            
            <!-- STEP 1: Enter email and pay -->
            <div id="payment-step-1">
              <input type="email" id="buyer-email" class="form-input" placeholder="Tu correo electronico" style="margin-bottom: 16px; background: var(--bg-surface);" required>
              
              <button id="mp-btn" class="btn btn-block" style="background: #00B1EA; color: white; border: none; font-size: 1.1rem; padding: 16px; border-radius: var(--radius-md); box-shadow: 0 4px 15px rgba(0, 177, 234, 0.3); transition: all 0.2s;">
                🛒 Pagar con Mercado Pago
              </button>
              <p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 12px;">Seras redirigido a Mercado Pago. Tu licencia se genera automaticamente al confirmar el pago.</p>
            </div>

            <!-- STEP 2: Waiting for payment confirmation -->
            <div id="payment-step-2" style="display: none; text-align: center;">
              <div style="margin-bottom: 20px;">
                <div class="spinner" style="width: 40px; height: 40px; border-width: 3px; margin: 0 auto 16px;"></div>
                <h3 style="color: #00B1EA; margin-bottom: 8px;">Esperando confirmacion de pago...</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">Completa el pago en Mercado Pago. Esta pantalla se actualizara automaticamente cuando se confirme.</p>
              </div>
              
              <div style="background: rgba(255, 184, 0, 0.08); border: 1px solid rgba(255, 184, 0, 0.2); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
                <p style="color: var(--warning); font-size: 0.85rem; margin: 0;">⏳ Verificando pago... Esto puede tomar unos segundos despues de pagar.</p>
              </div>

              <p id="poll-status" style="color: var(--text-tertiary); font-size: 0.75rem;"></p>
            </div>

            <!-- STEP 3: Payment confirmed! -->
            <div id="payment-step-3" style="display: none; text-align: center;">
              <div style="background: var(--success-bg); color: var(--success); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 16px;">✓</div>
              <h3 style="color: var(--success); margin-bottom: 16px; font-size: 1.4rem;">Pago Confirmado!</h3>
              <p style="color: var(--text-primary); margin-bottom: 8px;">Aqui tienes tu Codigo de Licencia:</p>
              
              <div id="generated-key" style="background: var(--bg-surface); border: 2px dashed var(--success); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 1.5rem; letter-spacing: 2px; color: #fff; font-weight: bold; margin-bottom: 24px; user-select: all;">
                ENLS-XXXX-XXXX
              </div>
              
              <button id="auto-activate-btn" class="btn btn-primary btn-block">
                Activar Esta App Ahora
              </button>
            </div>

            <!-- ERROR state -->
            <div id="payment-error" style="display: none; text-align: center;">
              <div style="background: var(--danger-bg); color: var(--danger); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 16px;">✕</div>
              <h3 style="color: var(--danger); margin-bottom: 16px;">Error en el pago</h3>
              <p id="error-message" style="color: var(--text-secondary); margin-bottom: 16px;"></p>
              <button id="retry-btn" class="btn btn-primary">Intentar de nuevo</button>
            </div>

          </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
           <button id="back-btn" class="btn btn-ghost">← Volver al Login/Activacion</button>
        </div>
      </div>
    </div>
  `;

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  document.getElementById('back-btn').addEventListener('click', () => {
    router.navigate('activate');
  });

  document.getElementById('retry-btn')?.addEventListener('click', () => {
    document.getElementById('payment-error').style.display = 'none';
    document.getElementById('payment-step-1').style.display = 'block';
  });

  // ==========================================
  // MAIN PAYMENT FLOW
  // ==========================================
  document.getElementById('mp-btn').addEventListener('click', async () => {
    const email = document.getElementById('buyer-email').value.trim();
    if (!email || !email.includes('@')) {
      alert("Por favor ingresa un email valido para asociar a tu licencia.");
      return;
    }

    const btn = document.getElementById('mp-btn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Creando enlace de pago...';

    try {
      // 1. Call Cloud Function to create payment preference
      const response = await fetch(`${FUNCTIONS_BASE_URL}/createPayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el pago');
      }

      const { initPoint, externalReference } = await response.json();

      // 2. Show waiting step
      document.getElementById('payment-step-1').style.display = 'none';
      document.getElementById('payment-step-2').style.display = 'block';

      // 3. Open Mercado Pago in new tab
      window.open(initPoint, '_blank');

      // 4. Start polling for payment confirmation
      startPolling(externalReference);

    } catch (error) {
      console.error('Payment creation error:', error);
      btn.disabled = false;
      btn.innerHTML = '🛒 Pagar con Mercado Pago';
      showError('No se pudo conectar con el sistema de pagos. Verifica tu conexion a internet.');
    }
  });

  // ==========================================
  // POLL FOR PAYMENT STATUS
  // ==========================================
  let pollInterval = null;
  let pollCount = 0;
  const MAX_POLLS = 120; // 10 minutes (every 5 seconds)

  function startPolling(externalReference) {
    pollCount = 0;

    pollInterval = setInterval(async () => {
      pollCount++;
      
      const statusEl = document.getElementById('poll-status');
      if (statusEl) {
        statusEl.textContent = `Verificacion #${pollCount}...`;
      }

      try {
        const response = await fetch(
          `${FUNCTIONS_BASE_URL}/checkPaymentStatus?externalReference=${externalReference}`
        );

        if (!response.ok) {
          console.warn('Poll error, retrying...');
          return;
        }

        const data = await response.json();

        if (data.status === 'approved' && data.licenseKey) {
          // PAYMENT CONFIRMED!
          clearInterval(pollInterval);
          showSuccess(data.licenseKey);
          return;
        }

        if (data.status === 'rejected' || data.status === 'cancelled') {
          clearInterval(pollInterval);
          showError('El pago fue rechazado o cancelado. Intenta nuevamente.');
          return;
        }

      } catch (error) {
        console.warn('Poll network error, retrying...', error);
      }

      // Stop polling after max attempts
      if (pollCount >= MAX_POLLS) {
        clearInterval(pollInterval);
        showError('Tiempo de espera agotado. Si ya pagaste, contacta a soporte con tu email.');
      }
    }, 5000); // Check every 5 seconds
  }

  // ==========================================
  // SHOW SUCCESS (License generated!)
  // ==========================================
  function showSuccess(licenseKey) {
    document.getElementById('payment-step-2').style.display = 'none';
    document.getElementById('payment-step-3').style.display = 'block';
    document.getElementById('generated-key').innerText = licenseKey;

    // Auto-activate button
    document.getElementById('auto-activate-btn').addEventListener('click', () => {
      saveLicenseKey(licenseKey);
      window.location.reload();
    });
  }

  // ==========================================
  // SHOW ERROR
  // ==========================================
  function showError(message) {
    document.getElementById('payment-step-1').style.display = 'none';
    document.getElementById('payment-step-2').style.display = 'none';
    document.getElementById('payment-step-3').style.display = 'none';
    document.getElementById('payment-error').style.display = 'block';
    document.getElementById('error-message').textContent = message;
  }

  // ==========================================
  // CHECK URL FOR PAYMENT RETURN
  // (When user comes back from Mercado Pago)
  // ==========================================
  const hash = window.location.hash;
  if (hash.startsWith('#payment-success/')) {
    const ref = hash.replace('#payment-success/', '');
    document.getElementById('payment-step-1').style.display = 'none';
    document.getElementById('payment-step-2').style.display = 'block';
    startPolling(ref);
  } else if (hash.startsWith('#payment-pending/')) {
    const ref = hash.replace('#payment-pending/', '');
    document.getElementById('payment-step-1').style.display = 'none';
    document.getElementById('payment-step-2').style.display = 'block';
    startPolling(ref);
  } else if (hash.startsWith('#payment-failure')) {
    showError('El pago no se pudo completar. Intenta nuevamente.');
  }
}
