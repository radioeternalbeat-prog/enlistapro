// ============================================
// EN LISTA! — Admin Signup View
// ============================================

import store from '../lib/store.js';
import router from '../lib/router.js';
import { showToast, generateId } from '../lib/utils.js';

export function renderSignup(container) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">
        <img src="/icon-512.png" alt="En Lista Logo" class="logo-icon-img" />
        <h1>EN LISTA!</h1>
        <p>Control de acceso inteligente</p>
      </div>
      
      <div class="login-card animate-in">
        <h2>Crear Cuenta Administrador</h2>
        <p class="text-secondary text-sm mb-16 text-center">Registrar nuevo perfil de control total</p>
        
        <form id="signup-form">
          <div class="form-group">
            <label>Nombre Completo</label>
            <input type="text" class="form-input" id="signup-name" placeholder="Ej: Juan Perez" required />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-input" id="signup-email" placeholder="tu@email.com" required />
          </div>
          
          <div class="form-group">
            <label>Contrasena</label>
            <input type="password" class="form-input" id="signup-password" placeholder="••••••••" required />
          </div>
          
          <button type="submit" class="btn btn-primary btn-block btn-lg mt-16" id="signup-btn">
            Registrarse como Admin
          </button>
        </form>
        
        <div class="mt-24 text-center">
          <p class="text-sm text-secondary">Ya tienes cuenta?</p>
          <button class="btn btn-ghost btn-sm mt-8" id="go-login-btn">
            Volver a Iniciar Sesion
          </button>
        </div>
      </div>

      <p class="text-sm text-secondary" style="position:relative; z-index:1; margin-top: 32px;">
        v1.0 MVP — Powered by Firebase
      </p>
    </div>
  `;

  // Go back to login
  document.getElementById('go-login-btn').addEventListener('click', () => {
    router.navigate('login');
  });

  // Handle Form Submit
  const form = document.getElementById('signup-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    if (!name || !email || !password) {
      showToast('Por favor, completa todos los campos', 'error');
      return;
    }

    try {
      const btn = document.getElementById('signup-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner"></span> Registrando...';
      
      await new Promise(resolve => setTimeout(resolve, 800));

      const newUser = {
        id: 'admin_' + generateId(6),
        email: email,
        displayName: name,
        role: 'admin',
        active: true
      };

      store.addUser(newUser);
      store.set('currentUser', newUser);
      showToast('Cuenta de administrador creada con exito!', 'success');
      router.navigate('admin');

    } catch (err) {
      console.error(err);
      showToast('Error al crear cuenta', 'error');
      const btn = document.getElementById('signup-btn');
      btn.disabled = false;
      btn.innerHTML = 'Registrarse como Admin';
    }
  });
}
