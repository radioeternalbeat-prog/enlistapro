// ============================================
// EN LISTA! — Main Application Entry Point
// Guest list management & access control for nightlife
// ============================================

import './styles/index.css';
import router from './lib/router.js';
import store from './lib/store.js';

// Import views
import { renderLogin } from './views/login.js';
import { renderAdmin } from './views/admin.js';
import { renderRRPP } from './views/rrpp.js';
import { renderGate } from './views/gate.js';
import { renderRegister } from './views/register.js';
import { renderSignup } from './views/signup.js';
import { renderActivate } from './views/activate.js';
import { renderBuy } from './views/buy.js';
import { validateLicense } from './lib/license.js';

// Register routes
router.register('login', renderLogin);
router.register('signup', renderSignup);
router.register('admin', renderAdmin);
router.register('rrpp', renderRRPP);
router.register('gate', renderGate);
router.register('register', renderRegister);
router.register('activate', renderActivate);
router.register('buy', renderBuy);

// Handle hash-based routing for public registration links
function handleHashRoute() {
  const hash = window.location.hash;
  if (hash.startsWith('#register/')) {
    const linkId = hash.replace('#register/', '');
    router.navigate('register', { linkId });
    return true;
  }
  return false;
}

// Initialize app
async function init() {
  // Wait for Firestore to fetch the real-time shared state (events, guests)
  await store.init();

  // Check for hash routes first (public registration)
  if (handleHashRoute()) return;

  // Check if trying to navigate to billing/activation manually
  if (window.location.hash.startsWith('#buy')) {
    router.navigate('buy');
    return;
  }
  if (window.location.hash.startsWith('#activate')) {
    router.navigate('activate');
    return;
  }

  // ==========================================
  // VALIDACION DE LICENCIA COMERCIAL
  // ==========================================
  // Si no estamos en rutas publicas de registro, validamos la licencia
  const licenseCheck = await validateLicense();
  
  if (!licenseCheck.valid) {
    console.warn("Licencia invalida o faltante:", licenseCheck.message);
    // Si no tiene licencia, lo mandamos a la pantalla de compra (landing de pago)
    if (licenseCheck.reason === 'no_license') {
      router.navigate('buy');
    } else {
      // Si la tiene pero expiro o fallo la verificacion, va a la pantalla de activacion
      router.navigate('activate');
    }
    return; // Detenemos el inicio de la app, el usuario no pasa de aqui.
  }

  // Check if user is already logged in
  const user = store.get('currentUser');
  if (user) {
    switch (user.role) {
      case 'admin':
        router.navigate('admin');
        break;
      case 'rrpp':
        router.navigate('rrpp');
        break;
      case 'puerta':
        router.navigate('gate');
        break;
      default:
        router.navigate('login');
    }
  } else {
    router.navigate('login');
  }
}

// Listen for hash changes
window.addEventListener('hashchange', () => {
  handleHashRoute();
});

// Start the app
init();

// ==========================================
// PWA Install Prompt
// ==========================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Don't show if already dismissed
  if (localStorage.getItem('enlista_pwa_dismissed')) return;

  // Show install banner
  const banner = document.createElement('div');
  banner.className = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-info">
      <h4>📲 Instalar EN LISTA!</h4>
      <p>Acceso rapido desde tu pantalla de inicio</p>
    </div>
    <button class="btn btn-primary btn-sm" id="pwa-install-btn">Instalar</button>
    <button class="pwa-dismiss" id="pwa-dismiss-btn">✕</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    banner.remove();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install: ${outcome}`);
    deferredPrompt = null;
  });

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('enlista_pwa_dismissed', 'true');
  });
});

// Log startup
console.log(
  '%c🎉 EN LISTA! v1.0 MVP',
  'color: #7B2FFF; font-size: 16px; font-weight: bold;'
);
console.log(
  '%cGestion de listas & control de acceso',
  'color: #8B8BA3; font-size: 12px;'
);
