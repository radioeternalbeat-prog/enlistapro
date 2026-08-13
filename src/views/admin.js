// ============================================
// EN LISTA! — Admin Dashboard View
// ============================================

import store from '../lib/store.js';
import router from '../lib/router.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderAdminDashboard } from '../components/admin-dashboard.js';
import { renderAdminEvents } from '../components/admin-events.js';
import { renderAdminPromoters } from '../components/admin-promoters.js';
import { renderAdminReport } from '../components/admin-report.js';
import { renderAdminGlobalStats } from '../components/admin-global-stats.js';

export function renderAdmin(container) {
  const user = store.get('currentUser');
  if (!user || user.role !== 'admin') {
    router.navigate('login');
    return;
  }

  container.innerHTML = `
    <div class="dashboard">
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <aside class="sidebar" id="sidebar"></aside>
      <main class="main-content" id="main-content">
        <div style="display:flex; align-items:center; gap: 12px; margin-bottom: 8px;">
          <button class="hamburger" id="hamburger-btn">☰</button>
        </div>
        <div id="admin-view-content"></div>
      </main>
    </div>
  `;

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'global-stats', icon: '🌍', label: 'Resumen Global / BD' },
    { id: 'events', icon: '🎉', label: 'Eventos' },
    { id: 'promoters', icon: '🎤', label: 'Promotores' },
    { id: 'report', icon: '📋', label: 'Reporte de Cierre' },
  ];

  renderSidebar(document.getElementById('sidebar'), navItems, (section) => {
    store.set('sidebarSection', section);
    renderSection(section);
  });

  // Hamburger toggle
  document.getElementById('hamburger-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('show');
  });

  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('show');
  });

  renderSection(store.get('sidebarSection') || 'dashboard');
}

function renderSection(section) {
  const content = document.getElementById('admin-view-content');
  if (!content) return;

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  switch (section) {
    case 'dashboard':
      renderAdminDashboard(content);
      break;
    case 'events':
      renderAdminEvents(content);
      break;
    case 'promoters':
      renderAdminPromoters(content);
      break;
    case 'report':
      renderAdminReport(content);
      break;
    case 'global-stats':
      renderAdminGlobalStats(content);
      break;
    default:
      renderAdminDashboard(content);
  }
}
