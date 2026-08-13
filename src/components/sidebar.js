// ============================================
// EN LISTA! — Sidebar Component
// ============================================

import store from '../lib/store.js';
import router from '../lib/router.js';
import { getInitials } from '../lib/utils.js';

export function renderSidebar(container, navItems, onNavigate) {
  const user = store.get('currentUser');
  
  container.innerHTML = `
    <div class="sidebar-logo">
      <img src="/icon-192.png" alt="Logo" class="sidebar-logo-img" /> 
      <span>EN LISTA!</span>
    </div>
    
    <nav class="sidebar-nav">
      ${navItems.map(item => `
        <button class="nav-item ${store.get('sidebarSection') === item.id ? 'active' : ''}" 
                data-section="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </button>
      `).join('')}
    </nav>
    
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">${getInitials(user?.displayName || 'U')}</div>
        <div class="user-details">
          <div class="user-name">${user?.displayName || 'Usuario'}</div>
          <div class="user-role">${getRoleLabel(user?.role)}</div>
        </div>
      </div>
      <button class="nav-item mt-8" id="logout-btn" style="color: var(--danger);">
        <span class="nav-icon">🚪</span>
        Cerrar Sesion
      </button>
    </div>
  `;

  container.querySelectorAll('.nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('show');
      onNavigate(section);
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    store.set('currentUser', null);
    router.navigate('login');
  });
}

function getRoleLabel(role) {
  const labels = { admin: 'Administrador', rrpp: 'Promotor RRPP', puerta: 'Staff Puerta' };
  return labels[role] || role;
}
