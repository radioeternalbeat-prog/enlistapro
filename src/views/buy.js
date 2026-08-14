// ============================================
// EN LISTA! — Buy View (Improved Payment Flow)
// Requires operation number + timer before license generation
// ============================================

import { saveLicenseKey } from '../lib/license.js';
import router from '../lib/router.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

// Minimum wait time in seconds before allowing license generation
const MIN_WAIT_SECONDS = 120; // 2 minutes

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
              <p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 12px;">Seras redirigido a Mercado Pago para completar el pago.</p>
            </div>

            <!-- STEP 2: Waiting + Operation Number -->
            <div id="payment-step-2" style="display: none; text-align: center;">
              <div style="background: rgba(0, 177, 234, 0.08); border: 1px solid rgba(0, 177, 234, 0.2); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
                <p style="color: #00B1EA; font-weight: 600; margin-bottom: 4px;">📱 Completa el pago en Mercado Pago</p>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0;">Una vez aprobado, Mercado Pago te dara un <strong>numero de operacion</strong>.</p>
              </div>

              <!-- Timer countdown -->
              <div id="timer-container" style="margin-bottom: 20px;">
                <div style="background: var(--bg-surface); border-radius: var(--radius-md); padding: 16px; border: 1px solid var(--border-color);">
                  <p style="color: var(--text-tertiary); font-size: 0.8rem; margin-bottom: 8px;">⏳ Tiempo minimo de verificacion</p>
                  <div id="countdown" style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--warning);"></div>
                  <div style="width: 100%; height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-top: 12px; overflow: hidden;">
                    <div id="timer-bar" style="width: 0%; height: 100%; background: var(--success); border-radius: 2px; transition: width 1s linear;"></div>
                  </div>
                </div>
              </div>

              <!-- Operation number input (appears after timer) -->
              <div id="verify-section" style="display: none;">
                <div class="form-group" style="text-align: left; margin-bottom: 16px;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Numero de Operacion de Mercado Pago *</label>
                  <input type="text" id="operation-number" class="form-input" placeholder="Ej: 12345678901" style="text-align: center; font-weight: 700; letter-spacing: 1px;" required>
                  <p style="color: var(--text-tertiary); font-size: 0.7rem; margin-top: 6px;">Lo encuentras en el comprobante de pago de Mercado Pago o en tu email de confirmacion.</p>
                </div>

                <button id="confirm-payment-btn" class="btn btn-block" style="background: var(--success); color: #000; font-weight: bold; border: none; font-size: 1.1rem; padding: 16px; border-radius: var(--radius-md); box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);">
                  ✅ Verificar y Generar Licencia
                </button>

                <p style="color: var(--text-tertiary); font-size: 0.7rem; margin-top: 12px;">⚠️ Tu numero de operacion sera validado. Licencias generadas sin pago real seran revocadas.</p>
              </div>
            </div>

            <!-- STEP 3: Payment confirmed! -->
            <div id="payment-step-3" style="display: none; text-align: center;">
              <div style="background: var(--success-bg); color: var(--success); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 16px;">✓</div>
              <h3 style="color: var(--success); margin-bottom: 16px; font-size: 1.4rem;">Licencia Generada!</h3>
              <p style="color: var(--text-primary); margin-bottom: 8px;">Aqui tienes tu Codigo de Licencia:</p>
              
              <div id="generated-key" style="background: var(--bg-surface); border: 2px dashed var(--success); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 1.5rem; letter-spacing: 2px; color: #fff; font-weight: bold; margin-bottom: 16px; user-select: all;">
                ENLS-XXXX-XXXX
              </div>

              <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 24px;">Guarda este codigo en un lugar seguro. Lo necesitaras para activar otros dispositivos.</p>
              
              <button id="auto-activate-btn" class="btn btn-primary btn-block" style="font-size: 1.1rem; padding: 18px;">
                🚀 Activar Esta App Ahora
              </button>
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

  // ==========================================
  // STEP 1: Open Mercado Pago
  // ==========================================
  document.getElementById('mp-btn').addEventListener('click', () => {
    const email = document.getElementById('buyer-email').value.trim();
    if (!email || !email.includes('@')) {
      alert("Por favor ingresa un email valido para asociar a tu licencia.");
      return;
    }

    // Open Mercado Pago payment link
    window.open('https://link.mercadopago.cl/happybeatcl', '_blank');

    // Move to step 2 and start timer
    document.getElementById('payment-step-1').style.display = 'none';
    document.getElementById('payment-step-2').style.display = 'block';

    // Start countdown timer
    startCountdown();
  });

  // ==========================================
  // COUNTDOWN TIMER
  // ==========================================
  function startCountdown() {
    let secondsLeft = MIN_WAIT_SECONDS;
    const countdownEl = document.getElementById('countdown');
    const timerBar = document.getElementById('timer-bar');
    const verifySection = document.getElementById('verify-section');
    const timerContainer = document.getElementById('timer-container');

    function updateTimer() {
      const minutes = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      countdownEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
      
      // Update progress bar
      const progress = ((MIN_WAIT_SECONDS - secondsLeft) / MIN_WAIT_SECONDS) * 100;
      timerBar.style.width = `${progress}%`;

      if (secondsLeft <= 0) {
        // Timer complete! Show verification section
        timerContainer.innerHTML = `
          <div style="background: var(--success-bg); border: 1px solid rgba(0, 255, 136, 0.2); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
            <p style="color: var(--success); font-weight: 600; margin: 0;">✓ Tiempo de verificacion completado</p>
          </div>
        `;
        verifySection.style.display = 'block';
        return;
      }

      secondsLeft--;
      setTimeout(updateTimer, 1000);
    }

    updateTimer();
  }

  // ==========================================
  // STEP 2: Verify operation number + Generate License
  // ==========================================
  document.getElementById('confirm-payment-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('buyer-email').value.trim();
    const operationNumber = document.getElementById('operation-number').value.trim();

    if (!operationNumber || operationNumber.length < 5) {
      alert("Por favor ingresa un numero de operacion valido (minimo 5 caracteres).");
      return;
    }

    const btn = document.getElementById('confirm-payment-btn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Verificando...';

    try {
      // Generate license key
      const newKey = 'ENLS-' + 
        Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + 
        Math.random().toString(36).substr(2, 4).toUpperCase();

      // Save payment record + license to Firestore for manual verification
      await setDoc(doc(db, 'payment_records', newKey), {
        licenseKey: newKey,
        email: email,
        operationNumber: operationNumber,
        plan: 'PRO',
        maxDevices: 3,
        verified: false, // Admin can verify manually later
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent,
      });

      // Create the actual license
      await setDoc(doc(db, 'licenses', newKey), {
        key: newKey,
        email: email,
        plan: 'PRO',
        maxDevices: 3,
        devices: [],
        status: 'active',
        operationNumber: operationNumber,
        createdAt: serverTimestamp(),
      });

      // Show success
      document.getElementById('payment-step-2').style.display = 'none';
      document.getElementById('payment-step-3').style.display = 'block';
      document.getElementById('generated-key').innerText = newKey;

      // Auto-activate button
      document.getElementById('auto-activate-btn').addEventListener('click', () => {
        saveLicenseKey(newKey);
        window.location.reload();
      });

    } catch (error) {
      console.error('Error generating license:', error);
      alert("Error de conexion. Verifica tu internet e intenta de nuevo.");
      btn.disabled = false;
      btn.innerHTML = '✅ Verificar y Generar Licencia';
    }
  });
}
