import { validateLicense, saveLicenseKey, removeLicenseLocally, getDeviceId } from '../lib/license.js';
import router from '../lib/router.js';

export function renderActivate(container) {
  // Clear any existing license if user clicked "Change License"
  removeLicenseLocally();
  const deviceId = getDeviceId();

  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo fade-in-up" style="animation-duration: 0.6s">
        <img src="https://i.postimg.cc/85znbhR5/en-lista-logo.png" alt="EN LISTA Logo" class="logo-icon-img" />
        <h1>EN LISTA<span style="color:var(--accent-primary)">!</span></h1>
        <p>Activacion de Licencia</p>
      </div>

      <div class="login-card fade-in-up" style="animation-duration: 0.8s; animation-delay: 0.1s">
        <h2 style="font-size: 1.2rem; color: var(--text-secondary); font-weight: 500;">Ingresa tu codigo</h2>
        
        <form id="activate-form">
          <div class="form-group">
            <label>Codigo de Licencia</label>
            <input type="text" id="license-key" class="form-input" 
                   placeholder="Ej: ENLS-XXXX-XXXX" required 
                   style="text-transform: uppercase; text-align: center; letter-spacing: 2px; font-weight: 700;">
          </div>

          <div id="activate-error" class="alert-danger" style="display: none; margin-bottom: 16px; padding: 12px; border-radius: var(--radius-md); background: var(--danger-bg); color: var(--danger); font-size: 0.9rem; text-align: center;"></div>
          <div id="activate-success" class="alert-success" style="display: none; margin-bottom: 16px; padding: 12px; border-radius: var(--radius-md); background: var(--success-bg); color: var(--success); font-size: 0.9rem; text-align: center;"></div>

          <button type="submit" class="btn btn-primary btn-block" id="activate-btn">
            Activar Dispositivo
          </button>
        </form>
        
        <div style="margin-top: 24px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 20px;">
           <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;">Aun no tienes una licencia?</p>
           <button id="buy-btn" class="btn btn-ghost btn-sm" style="width: 100%; border-color: var(--success); color: var(--success);">Comprar Licencia (3 Disp.)</button>
        </div>
        
        <div style="margin-top: 16px; text-align: center;">
           <small style="color: var(--text-tertiary); font-size: 0.7rem;">Device ID: ${deviceId}</small>
        </div>
      </div>
    </div>
  `;

  document.getElementById('activate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('license-key').value.trim();
    if (!key) return;

    const btn = document.getElementById('activate-btn');
    const errorEl = document.getElementById('activate-error');
    const successEl = document.getElementById('activate-success');
    
    btn.disabled = true;
    btn.innerHTML = 'Verificando...';
    errorEl.style.display = 'none';

    // Guardamos la key temporalmente para validar
    saveLicenseKey(key);

    const result = await validateLicense();

    if (result.valid) {
      successEl.innerHTML = result.message || 'Licencia valida. Redirigiendo...';
      successEl.style.display = 'block';
      setTimeout(() => {
        // Redirigir a main para que valide el usuario (login o dashboard)
        window.location.reload();
      }, 1500);
    } else {
      removeLicenseLocally(); // Invalidamos si fallo
      btn.disabled = false;
      btn.innerHTML = 'Activar Dispositivo';
      errorEl.innerHTML = result.message || 'Licencia no valida';
      errorEl.style.display = 'block';
    }
  });

  document.getElementById('buy-btn').addEventListener('click', () => {
    router.navigate('buy');
  });
}
