import { generateNewLicense, saveLicenseKey } from '../lib/license.js';
import router from '../lib/router.js';

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
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 40px; display: flex; flex-direction: column; md:flex-row; gap: 40px; box-shadow: var(--shadow-lg);">
          
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
            
            <div id="payment-step-1">
              <input type="email" id="buyer-email" class="form-input" placeholder="Tu correo electronico" style="margin-bottom: 16px; background: var(--bg-surface);" required>
              
              <button id="mp-btn" class="btn btn-block" style="background: #00B1EA; color: white; border: none; font-size: 1.1rem; padding: 16px; border-radius: var(--radius-md); box-shadow: 0 4px 15px rgba(0, 177, 234, 0.3); transition: all 0.2s;">
                🛒 Pagar via Mercado Pago
              </button>
              <p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 12px;">Al hacer clic, seras redirigido a realizar el pago. Tu codigo se generara automaticamente.</p>
            </div>

            <div id="payment-step-2" style="display: none; text-align: center;">
              <h3 style="color: #00B1EA; margin-bottom: 8px;">Completa el pago en la nueva pestana</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 24px;">Una vez que hayas realizado el pago en Mercado Pago, haz clic en el boton de abajo para generar tu licencia.</p>
              
              <button id="confirm-payment-btn" class="btn btn-block" style="background: var(--success); color: #000; font-weight: bold; border: none; font-size: 1.1rem; padding: 16px; border-radius: var(--radius-md); box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3); transition: all 0.2s;">
                ✅ Ya realice el pago
              </button>
            </div>

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

          </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
           <button id="back-btn" class="btn btn-ghost">← Volver al Login/Activacion</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => {
    router.navigate('activate');
  });

  document.getElementById('mp-btn').addEventListener('click', () => {
    const email = document.getElementById('buyer-email').value.trim();
    if (!email || !email.includes('@')) {
      alert("Por favor ingresa un email valido para asociar a tu licencia.");
      return;
    }

    // Abrimos el link real de Mercado Pago en una nueva pestana
    window.open('https://link.mercadopago.cl/happybeatcl', '_blank');

    // Cambiamos al paso 2 (esperar confirmacion manual del usuario para el MVP)
    document.getElementById('payment-step-1').style.display = 'none';
    document.getElementById('payment-step-2').style.display = 'block';
  });

  // Logica de confirmacion de pago
  document.getElementById('confirm-payment-btn').addEventListener('click', async () => {
    const email = document.getElementById('buyer-email').value.trim();
    const btn = document.getElementById('confirm-payment-btn');
    
    btn.disabled = true;
    btn.innerHTML = 'Generando tu licencia...';

    try {
      const newKey = await generateNewLicense(email, 'PRO');
      
      // Mostrar pantalla de exito
      document.getElementById('payment-step-2').style.display = 'none';
      document.getElementById('payment-step-3').style.display = 'block';
      document.getElementById('generated-key').innerText = newKey;

      // Configuramos el boton de auto-activacion
      document.getElementById('auto-activate-btn').addEventListener('click', () => {
        saveLicenseKey(newKey);
        window.location.reload();
      });

    } catch (error) {
      alert("Error creando la licencia. Verifica tu conexion a internet.");
      btn.disabled = false;
      btn.innerHTML = '✅ Ya realice el pago';
    }
  });
}
