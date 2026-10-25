// ============================================
// EN LISTA! — Login View
// Autenticación real con Firebase Authentication
// ============================================

import store from '../lib/store.js';
import router from '../lib/router.js';
import { showToast } from '../lib/utils.js';
import { authErrorMessage, signIn } from '../lib/auth.js';

let selectedRole = null;

export function renderLogin(container) {
  selectedRole = null;
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo"><img src="/icon-512.png" alt="En Lista Logo" class="logo-icon-img" /><h1>EN LISTA!</h1><p>Control de acceso inteligente</p></div>
      <div class="login-card animate-in">
        <h2>Iniciar sesión</h2>
        <p class="text-secondary text-sm text-center mb-16">Usá tus credenciales para ingresar a tu cuenta.</p>
        <form id="login-form">
          <div class="form-group"><label for="login-email">Email</label><input type="email" class="form-input" id="login-email" placeholder="tu@email.com" autocomplete="email" required /></div>
          <div class="form-group"><label for="login-password">Contraseña</label><input type="password" class="form-input" id="login-password" placeholder="••••••••" autocomplete="current-password" minlength="6" required /></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg mt-16" id="login-btn">Ingresar</button>
        </form>
        <div class="mt-24 text-center"><p class="text-sm text-secondary">¿Primera vez?</p><button class="btn btn-ghost btn-sm mt-8" id="go-signup-btn" type="button">Crear cuenta de Admin</button></div>
        <div class="mt-24 text-center"><p class="text-sm text-secondary">Seleccioná un rol para ingresar:</p><div class="flex gap-8 mt-8" style="flex-wrap: wrap; justify-content: center;"><button class="btn btn-ghost btn-sm role-select-btn" data-role="admin" type="button">👑 Admin</button><button class="btn btn-ghost btn-sm role-select-btn" data-role="rrpp" type="button">🎤 RRPP</button><button class="btn btn-ghost btn-sm role-select-btn" data-role="puerta" type="button">🚪 Puerta</button></div></div>
      </div>
      <p class="text-sm text-secondary" style="position:relative; z-index:1; margin-top: 32px;">v1.0 MVP — Powered by Firebase</p>
    </div>
  `;

  container.querySelectorAll('.role-select-btn').forEach(button => {
    button.addEventListener('click', () => selectRole(button.dataset.role));
  });

  document.getElementById('go-signup-btn')?.addEventListener('click', () => router.navigate('signup'));
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
}

function selectRole(role) {
  selectedRole = role;
  document.getElementById('login-email')?.focus();
  showToast(`Ingresá email y contraseña de ${role === 'admin' ? 'Administrador' : role === 'rrpp' ? 'tu cuenta RRPP' : 'Staff Puerta'}`, 'info');
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const button = document.getElementById('login-btn');
  button.disabled = true;
  button.textContent = 'Verificando...';
  try {
    const { profile } = await signIn(email, password);
    if (selectedRole && profile.role !== selectedRole) throw new Error('ROLE_MISMATCH');
    store.set('currentUser', profile);
    store.set('sidebarSection', profile.role === 'admin' ? 'dashboard' : 'my-lists');
    showToast(`Bienvenido, ${profile.displayName}`, 'success');
    navigateByRole(profile.role);
  } catch (error) {
    showToast(error.message === 'ROLE_MISMATCH' ? 'Las credenciales no corresponden al rol seleccionado.' : authErrorMessage(error), 'error');
    button.disabled = false;
    button.textContent = 'Ingresar';
  }
}

function navigateByRole(role) {
  if (role === 'admin') router.navigate('admin');
  else if (role === 'rrpp') router.navigate('rrpp');
  else if (role === 'puerta') router.navigate('gate', { eventId: store.get('events')[0]?.id });
  else router.navigate('login');
}

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
