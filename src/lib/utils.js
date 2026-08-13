// ============================================
// EN LISTA! — Utility Functions
// ============================================

// Generate unique ID
export function generateId(prefix = '') {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}_${id}` : id;
}

// Generate QR code value
export function generateQRValue(guestId) {
  return `ENLISTA-${guestId}`;
}

// Format date
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Format time
export function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format date + time
export function formatDateTime(dateStr) {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

// Show toast notification
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '\u2713',
    error: '\u2715',
    info: '\u2139',
  };
  
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Show modal
export function showModal(title, content, footer = '') {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="document.getElementById('modal-container').innerHTML=''">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    </div>
  `;

  // Close on overlay click
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
      container.innerHTML = '';
    }
  });
}

// Close modal
export function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

// Debounce function for search
export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Get capacity level class
export function getCapacityLevel(current, max) {
  const percent = (current / max) * 100;
  if (percent >= 90) return 'level-danger';
  if (percent >= 70) return 'level-warning';
  return 'level-safe';
}

// Get initials from name
export function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Search/filter guests by query
export function searchGuests(guests, query) {
  if (!query) return guests;
  const q = query.toLowerCase().trim();
  return guests.filter(g => {
    const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
    return fullName.includes(q) || 
           g.firstName.toLowerCase().includes(q) ||
           g.lastName.toLowerCase().includes(q) ||
           (g.phone && g.phone.includes(q)) ||
           (g.qrCode && g.qrCode.toLowerCase().includes(q));
  });
}

// Animate a number counter
export function animateCounter(element, target, duration = 600) {
  const start = parseInt(element.textContent) || 0;
  const increment = (target - start) / (duration / 16);
  let current = start;

  const update = () => {
    current += increment;
    if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
      element.textContent = target;
      return;
    }
    element.textContent = Math.round(current);
    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

// Vibrate device (for check-in feedback)
export function vibrateDevice(pattern = [100]) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
