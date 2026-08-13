// ============================================
// EN LISTA! — Application State Management
// In-memory store with localStorage persistence
// ============================================

const STORAGE_KEY = 'enlista_state';

// Default demo data for MVP without Firebase connection
const defaultState = {
  currentUser: null,
  currentView: 'login',
  currentEvent: null,
  events: [
    {
      id: 'evt_demo_001',
      name: 'Noche Electronica',
      venue: 'Club Zenith',
      date: new Date().toISOString(),
      maxCapacity: 500,
      currentCount: 0,
      status: 'active',
      createdBy: 'admin_001',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'evt_demo_002',
      name: 'Reggaeton Night',
      venue: 'Disco Palermo',
      date: new Date(Date.now() + 86400000).toISOString(),
      maxCapacity: 300,
      currentCount: 0,
      status: 'upcoming',
      createdBy: 'admin_001',
      createdAt: new Date().toISOString(),
    }
  ],
  guests: {},  // eventId -> guest[]
  users: [
    { id: 'admin_001', email: 'admin@enlista.app', displayName: 'Admin Principal', role: 'admin', active: true },
    { id: 'rrpp_001', email: 'carlos@enlista.app', displayName: 'Carlos Promotor', role: 'rrpp', active: true },
    { id: 'rrpp_002', email: 'maria@enlista.app', displayName: 'Maria Lopez', role: 'rrpp', active: true },
    { id: 'puerta_001', email: 'puerta@enlista.app', displayName: 'Staff Puerta 1', role: 'puerta', active: true },
  ],
  registrationLinks: {},
  sidebarSection: 'dashboard',
};

// Initialize demo guests
defaultState.guests['evt_demo_001'] = [
  { id: 'g001', firstName: 'Lucia', lastName: 'Fernandez', phone: '+54 11 5555-1001', status: 'pending', listType: 'VIP', plusOnes: 2, addedBy: 'rrpp_001', promoterName: 'Carlos Promotor', qrCode: 'ENLISTA-g001', selfRegistered: false, registeredAt: new Date().toISOString(), notes: '' },
  { id: 'g002', firstName: 'Martin', lastName: 'Garcia', phone: '+54 11 5555-1002', status: 'pending', listType: 'general', plusOnes: 1, addedBy: 'rrpp_001', promoterName: 'Carlos Promotor', qrCode: 'ENLISTA-g002', selfRegistered: false, registeredAt: new Date().toISOString(), notes: '' },
  { id: 'g003', firstName: 'Valentina', lastName: 'Rodriguez', phone: '+54 11 5555-1003', status: 'checked-in', listType: 'VIP', plusOnes: 0, addedBy: 'rrpp_002', promoterName: 'Maria Lopez', qrCode: 'ENLISTA-g003', selfRegistered: false, registeredAt: new Date().toISOString(), checkedInAt: new Date().toISOString(), checkedInBy: 'puerta_001', notes: 'Cumpleanera' },
  { id: 'g004', firstName: 'Santiago', lastName: 'Martinez', phone: '+54 11 5555-1004', status: 'pending', listType: 'general', plusOnes: 3, addedBy: 'rrpp_002', promoterName: 'Maria Lopez', qrCode: 'ENLISTA-g004', selfRegistered: false, registeredAt: new Date().toISOString(), notes: '' },
  { id: 'g005', firstName: 'Camila', lastName: 'Lopez', phone: '+54 11 5555-1005', status: 'checked-in', listType: 'VIP', plusOnes: 1, addedBy: 'rrpp_001', promoterName: 'Carlos Promotor', qrCode: 'ENLISTA-g005', selfRegistered: false, registeredAt: new Date().toISOString(), checkedInAt: new Date().toISOString(), checkedInBy: 'puerta_001', notes: '' },
  { id: 'g006', firstName: 'Tomas', lastName: 'Alvarez', phone: '+54 11 5555-1006', status: 'pending', listType: 'general', plusOnes: 0, addedBy: 'rrpp_001', promoterName: 'Carlos Promotor', qrCode: 'ENLISTA-g006', selfRegistered: true, registeredAt: new Date().toISOString(), notes: '' },
  { id: 'g007', firstName: 'Isabella', lastName: 'Sanchez', phone: '+54 11 5555-1007', status: 'pending', listType: 'VIP', plusOnes: 2, addedBy: 'rrpp_002', promoterName: 'Maria Lopez', qrCode: 'ENLISTA-g007', selfRegistered: false, registeredAt: new Date().toISOString(), notes: 'Mesa reservada' },
  { id: 'g008', firstName: 'Benjamin', lastName: 'Torres', phone: '+54 11 5555-1008', status: 'pending', listType: 'backstage', plusOnes: 0, addedBy: 'rrpp_001', promoterName: 'Carlos Promotor', qrCode: 'ENLISTA-g008', selfRegistered: false, registeredAt: new Date().toISOString(), notes: 'DJ invitado' },
];

// Set currentCount based on checked-in guests
defaultState.events[0].currentCount = defaultState.guests['evt_demo_001'].filter(g => g.status === 'checked-in').length;

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
        return { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return { ...defaultState };
  }

  async init() {
    return new Promise((resolve) => {
      const stateDoc = doc(db, 'enlista', 'global_state');
      
      onSnapshot(stateDoc, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // We keep device-specific states like currentView/User local
          this.state = {
            ...this.state,
            events: data.events || this.state.events,
            guests: data.guests || this.state.guests,
            users: data.users || this.state.users,
            registrationLinks: data.registrationLinks || this.state.registrationLinks
          };
        } else {
          // If document doesn't exist, create it with our demo data
          setDoc(stateDoc, {
            events: this.state.events,
            guests: this.state.guests,
            users: this.state.users,
            registrationLinks: this.state.registrationLinks
          }, { merge: true }).catch(console.warn);
        }

        this.initialized = true;
        
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

    // Arrival curve (mock by hour)
    const arrivalCurve = [];
    const checkedInGuests = guests.filter(g => g.status === 'checked-in' && g.checkedInAt);
    // Generate mock arrival data for visualization
    const hours = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00'];
    hours.forEach((hour, i) => {
      arrivalCurve.push({
        hour,
        count: Math.max(0, Math.round(checkedIn * (Math.sin((i + 1) / hours.length * Math.PI) * 0.4 + Math.random() * 0.2)))
      });
    });

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
