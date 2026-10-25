// ============================================
// EN LISTA! — Login View
// ============================================

import store from '../lib/store.js';
import router from '../lib/router.js';
import { showModal, closeModal, showToast, getInitials } from '../lib/utils.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">
        <img src="/icon-512.png" alt="En Lista Logo" class="logo-icon-img" />
        <h1>EN LISTA!</h1>
        <p>Control de acceso inteligente</p>
      </div>
      
      <div class="login-card animate-in">
        <h2>Iniciar Sesion</h2>
        
        <form id="login-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-input" id="login-email" placeholder="tu@email.com" required />
          </div>
          
          <div class="form-group">
            <label>Contrasena</label>
            <input type="password" class="form-input" id="login-password" placeholder="••••••••" required />
          </div>
          
          <button type="submit" class="btn btn-primary btn-block btn-lg mt-16" id="login-btn">
            Ingresar
          </button>
        </form>
        
        <div class="mt-24 text-center">
          <p class="text-sm text-secondary">Primera vez?</p>
          <button class="btn btn-ghost btn-sm mt-8" id="go-signup-btn">
            Crear cuenta de Admin
          </button>
        </div>

        <div class="mt-24 text-center">
          <p class="text-sm text-secondary">Seleccioná un rol para ingresar:</p>
          <div class="flex gap-8 mt-8" style="flex-wrap: wrap; justify-content: center;">
            <button class="btn btn-ghost btn-sm demo-login" data-role="admin">👑 Admin</button>
            <button class="btn btn-ghost btn-sm demo-login" data-role="rrpp">🎤 RRPP</button>
            <button class="btn btn-ghost btn-sm demo-login" data-role="puerta">🚪 Puerta</button>
          </div>
        </div>
      </div>

      <p class="text-sm text-secondary" style="position:relative; z-index:1; margin-top: 32px;">
        v1.0 MVP — Powered by Firebase
      </p>
    </div>
  `;

  // Demo login buttons
  container.querySelectorAll('.demo-login').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      if (role === 'rrpp') {
        openPromoterSelector();
        return;
      }
      const user = store.get('users').find(u => u.role === role && u.active !== false);
      if (user) {
        store.set('currentUser', user);
        showToast(`Bienvenido, ${user.displayName}`, 'success');
        router.navigate(role === 'puerta' ? 'gate' : role);
      }
    });
  });

  // Navigate to signup
  document.getElementById('go-signup-btn').addEventListener('click', () => {
    router.navigate('signup');
  });

  // Handle traditional login
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const user = store.get('users').find(u => u.email.toLowerCase() === email.toLowerCase() && u.active !== false);
    
    if (user) {
      store.set('currentUser', user);
      showToast(`Bienvenido, ${user.displayName}`, 'success');
      navigateByRole(user.role);
    } else {
      const inactiveUser = store.get('users').find(u => u.email.toLowerCase() === email.toLowerCase() && u.active === false);
      showToast(inactiveUser ? 'Esta cuenta fue desactivada por un administrador' : 'Credenciales invalidas', 'error');
    }
  });
}

function openPromoterSelector() {
  const promoters = store.get('users').filter(user => user.role === 'rrpp' && user.active !== false);
  if (promoters.length === 0) {
    showToast('No hay promotores RRPP activos disponibles', 'error');
    return;
  }

  showModal('Seleccioná tu promotor', `
    <p class="text-sm text-secondary promoter-selector-intro">Elegí la cuenta RRPP que vas a usar en este dispositivo para administrar tu propia lista.</p>
    <div class="promoter-selector-list">
      ${promoters.map(promoter => `<button class="promoter-selector-option" type="button" data-promoter-id="${escapeHtml(promoter.id)}"><span class="user-avatar promoter-selector-avatar">${escapeHtml(getInitials(promoter.displayName || '?'))}</span><span class="promoter-selector-info"><strong>${escapeHtml(promoter.displayName)}</strong><small>${escapeHtml(promoter.email)}</small></span><span class="promoter-selector-arrow">›</span></button>`).join('')}
    </div>
    <button class="btn btn-ghost btn-block mt-16" type="button" id="cancel-promoter-selection">Cancelar</button>
  `);

  document.getElementById('cancel-promoter-selection')?.addEventListener('click', closeModal);
  document.querySelectorAll('.promoter-selector-option').forEach(button => {
    button.addEventListener('click', () => {
      const user = store.get('users').find(item => item.id === button.dataset.promoterId && item.role === 'rrpp' && item.active !== false);
      if (!user) {
        closeModal();
        showToast('Este promotor ya no está activo', 'error');
        return;
      }
      store.set('currentUser', user);
      store.set('sidebarSection', 'my-lists');
      closeModal();
      showToast(`Bienvenido, ${user.displayName}`, 'success');
      router.navigate('rrpp');
    });
  });
}

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function navigateByRole(role) {
  switch (role) {
    case 'admin':
      store.set('sidebarSection', 'dashboard');
      router.navigate('admin');
      break;
    case 'rrpp':
      store.set('sidebarSection', 'my-lists');
      router.navigate('rrpp');
      break;
    case 'puerta':
      router.navigate('gate', { eventId: store.get('events')[0]?.id });
      break;
    default:
      router.navigate('login');
  }
}
