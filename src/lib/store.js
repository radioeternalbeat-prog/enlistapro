// ============================================
// EN LISTA! — Application State Management
// In-memory store with localStorage persistence
// ============================================

const STORAGE_KEY = 'enlista_state';

// Estado inicial real: una instalación nueva comienza sin eventos ni usuarios ficticios.
const defaultState = {
  currentUser: null,
  currentView: 'login',
  currentEvent: null,
  events: [],
  guests: {},
  users: [],
  registrationLinks: {},
  sidebarSection: 'dashboard',
};

import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';

class Store {
  constructor() {
    this.state = this.loadState();
    this.listeners = new Map();
    this.initialized = false;
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedState = JSON.parse(saved);
        return this.sanitizeState({ ...defaultState, ...savedState });
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return { ...defaultState };
  }

  sanitizeState(state) {
    const demoUserIds = new Set(['admin_001', 'rrpp_001', 'rrpp_002', 'puerta_001']);
    const events = (state.events || []).filter(event => !String(event.id).startsWith('evt_demo_'));
    const users = (state.users || []).filter(user => !demoUserIds.has(user.id));
    const guests = Object.fromEntries(Object.entries(state.guests || {}).filter(([eventId]) => !String(eventId).startsWith('evt_demo_')));
    const currentUser = state.currentUser && demoUserIds.has(state.currentUser.id) ? null : state.currentUser;
    return { ...state, events, users, guests, currentUser };
  }

  async init() {
    return new Promise((resolve) => {
      const stateDoc = doc(db, 'enlista', 'global_state');
      
      onSnapshot(stateDoc, (snapshot) => {
        this.initialized = true;
        if (snapshot.exists()) {
          const data = snapshot.data();
          // We keep device-specific states like currentView/User local
          const remoteState = {
            ...this.state,
            events: Array.isArray(data.events) && data.events.length > 0 ? data.events : this.state.events,
            guests: data.guests || this.state.guests,
            users: data.users || this.state.users,
            registrationLinks: data.registrationLinks || this.state.registrationLinks
          };
          // Nunca reintroducir datos de demostración desde un snapshot o almacenamiento local.
          const sanitizedState = this.sanitizeState(remoteState);
          const hadDemoData = JSON.stringify(remoteState.users) !== JSON.stringify(sanitizedState.users)
            || JSON.stringify(remoteState.guests) !== JSON.stringify(sanitizedState.guests)
            || JSON.stringify(remoteState.events) !== JSON.stringify(sanitizedState.events);
          this.state = sanitizedState;
          if (hadDemoData) this.saveState();
        } else {
          // Si aún no existe, crear únicamente el estado real disponible en el dispositivo.
          setDoc(stateDoc, {
            events: this.state.events,
            guests: this.state.guests,
            users: this.state.users,
            registrationLinks: this.state.registrationLinks
          }, { merge: true }).catch(console.warn);
        }

        // Trigger UI updates
        this.notify('*', this.state);
        this.notify('events', this.state.events);
        this.notify('guests', this.state.guests);
        resolve();
      }, (error) => {
        console.warn('Firestore sync disabled or offline:', error.message);
        this.initialized = true;
        resolve(); // proceed offline
      });
    });
  }

  async saveState() {
    // 1. Save to LocalStorage (offline backup)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }

    // 2. Sync Shared Data to Firestore
    if (this.initialized) {
      try {
        await setDoc(doc(db, 'enlista', 'global_state'), {
          events: this.state.events,
          guests: this.state.guests,
          users: this.state.users,
          registrationLinks: this.state.registrationLinks
        }, { merge: true });
      } catch (e) {
        console.warn('Failed to push to Firestore:', e.message);
      }
    }
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this.saveState();
    this.notify(key, value);
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key)?.delete(callback);
  }

  notify(key, value) {
    this.listeners.get(key)?.forEach(cb => cb(value));
    this.listeners.get('*')?.forEach(cb => cb(key, value));
  }

  // --- User Operations ---
  addUser(user) {
    const users = [...this.state.users, user];
    this.set('users', users);
    return user;
  }

  updateUser(userId, updates) {
    const users = this.state.users.map(user =>
      user.id === userId ? { ...user, ...updates } : user
    );
    this.set('users', users);
    return users.find(user => user.id === userId);
  }

  deactivateUser(userId) {
    return this.updateUser(userId, { active: false, deactivatedAt: new Date().toISOString() });
  }

  reactivateUser(userId) {
    return this.updateUser(userId, { active: true, reactivatedAt: new Date().toISOString() });
  }

  removeUser(userId) {
    const users = this.state.users.filter(user => user.id !== userId);
    this.set('users', users);
    return true;
  }

  // --- Event Operations ---
  addEvent(event) {
    const events = [...this.state.events, event];
    this.set('events', events);
    return event;
  }

  updateEvent(eventId, updates) {
    const events = this.state.events.map(e => 
      e.id === eventId ? { ...e, ...updates } : e
    );
    this.set('events', events);
  }

  getEvent(eventId) {
    return this.state.events.find(e => e.id === eventId);
  }

  // --- Guest Operations ---
  getGuests(eventId) {
    return this.state.guests[eventId] || [];
  }

  addGuest(eventId, guest) {
    const guests = { ...this.state.guests };
    if (!guests[eventId]) guests[eventId] = [];
    guests[eventId] = [...guests[eventId], guest];
    this.set('guests', guests);
    return guest;
  }

  updateGuest(eventId, guestId, updates) {
    const guests = { ...this.state.guests };
    if (guests[eventId]) {
      guests[eventId] = guests[eventId].map(g =>
        g.id === guestId ? { ...g, ...updates } : g
      );
      this.set('guests', guests);
    }
  }

  removeGuest(eventId, guestId) {
    const guests = { ...this.state.guests };
    if (guests[eventId]) {
      guests[eventId] = guests[eventId].filter(g => g.id !== guestId);
      this.set('guests', guests);
    }
  }

  checkInGuest(eventId, guestId, staffId) {
    this.updateGuest(eventId, guestId, {
      status: 'checked-in',
      checkedInAt: new Date().toISOString(),
      checkedInBy: staffId,
    });
    
    // Update event count
    const event = this.getEvent(eventId);
    if (event) {
      const checkedIn = this.getGuests(eventId).filter(g => g.status === 'checked-in').length;
      this.updateEvent(eventId, { currentCount: checkedIn });
    }
  }

  getPromoters() {
    return this.state.users.filter(u => u.role === 'rrpp');
  }

  // --- Registration Links ---
  addRegistrationLink(link) {
    const links = { ...this.state.registrationLinks };
    links[link.id] = link;
    this.set('registrationLinks', links);
    return link;
  }

  // --- Metrics ---
  getEventMetrics(eventId) {
    const guests = this.getGuests(eventId);
    const event = this.getEvent(eventId);
    
    const total = guests.length;
    const checkedIn = guests.filter(g => g.status === 'checked-in').length;
    const pending = guests.filter(g => g.status === 'pending').length;
    const vip = guests.filter(g => g.listType === 'VIP').length;
    const totalPlusOnes = guests.reduce((sum, g) => sum + (g.plusOnes || 0), 0);
    
    // By promoter
    const byPromoter = {};
    guests.forEach(g => {
      if (!byPromoter[g.promoterName]) {
        byPromoter[g.promoterName] = { total: 0, checkedIn: 0, addedBy: g.addedBy };
      }
      byPromoter[g.promoterName].total++;
      if (g.status === 'checked-in') byPromoter[g.promoterName].checkedIn++;
    });

    // Curva de llegada basada únicamente en check-ins reales.
    const arrivalCurve = [];
    const checkedInGuests = guests.filter(g => g.status === 'checked-in' && g.checkedInAt);
    const hours = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00'];
    hours.forEach(hour => arrivalCurve.push({ hour, count: checkedInGuests.filter(guest => {
      const date = new Date(guest.checkedInAt);
      return date.toString() !== 'Invalid Date' && String(date.getHours()).padStart(2, '0') === hour.slice(0, 2);
    }).length }));

    return {
      total,
      checkedIn,
      pending,
      vip,
      totalPlusOnes,
      totalExpected: total + totalPlusOnes,
      maxCapacity: event?.maxCapacity || 0,
      occupancyPercent: event?.maxCapacity ? Math.round((checkedIn / event.maxCapacity) * 100) : 0,
      byPromoter,
      arrivalCurve,
    };
  }

  // Reset to defaults
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = { ...defaultState };
    this.saveState();
    this.notify('*', this.state);
  }
}

export const store = new Store();
export default store;
