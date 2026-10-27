#!/usr/bin/env node

const admin = require('firebase-admin');

const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'en-lista-app-z1e6wt';

admin.initializeApp({ projectId });
const db = admin.firestore();

function assertValidId(value, label) {
  if (!value || typeof value !== 'string' || value.includes('/')) {
    throw new Error(`Identificador invalido para ${label}: ${value}`);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function buildPlan(state) {
  const events = asArray(state.events);
  const guestsByEvent = asObject(state.guests);
  const links = Object.values(asObject(state.registrationLinks));
  const plan = { events: [], guests: [], registrationLinks: [], skippedUsers: asArray(state.users).length, warnings: [] };
  const eventIds = new Set();
  const guestIds = new Set();
  const linkIds = new Set();

  for (const event of events) {
    assertValidId(event.id, 'evento');
    if (eventIds.has(event.id)) throw new Error(`Evento duplicado: ${event.id}`);
    eventIds.add(event.id);
    plan.events.push({ id: event.id, data: { ...event, migratedFrom: 'enlista/global_state' } });
  }

  for (const [eventId, guests] of Object.entries(guestsByEvent)) {
    assertValidId(eventId, 'eventId');
    if (!eventIds.has(eventId)) plan.warnings.push(`Hay invitados para un evento ausente: ${eventId}`);
    for (const guest of asArray(guests)) {
      assertValidId(guest.id, 'invitado');
      if (guestIds.has(guest.id)) throw new Error(`Invitado duplicado: ${guest.id}`);
      guestIds.add(guest.id);
      plan.guests.push({
        id: guest.id,
        data: { ...guest, eventId, migratedFrom: 'enlista/global_state' },
      });
    }
  }

  for (const link of links) {
    assertValidId(link.id, 'link de registro');
    if (linkIds.has(link.id)) throw new Error(`Link duplicado: ${link.id}`);
    linkIds.add(link.id);
    if (link.eventId && !eventIds.has(link.eventId)) plan.warnings.push(`Link ${link.id} referencia evento ausente: ${link.eventId}`);
    plan.registrationLinks.push({ id: link.id, data: { ...link, migratedFrom: 'enlista/global_state' } });
  }

  return plan;
}

async function readSource() {
  const snapshot = await db.doc('enlista/global_state').get();
  if (!snapshot.exists) throw new Error('No existe enlista/global_state; se cancela la migracion.');
  return snapshot.data();
}

async function inspectTarget(plan) {
  const refs = [
    ...plan.events.map(item => db.doc(`events/${item.id}`)),
    ...plan.guests.map(item => db.doc(`guests/${item.id}`)),
    ...plan.registrationLinks.map(item => db.doc(`registrationLinks/${item.id}`)),
  ];
  const snapshots = await db.getAll(...refs);
  const existing = snapshots.filter(snapshot => snapshot.exists).map(snapshot => snapshot.ref.path);
  return existing;
}

async function applyPlan(plan, source) {
  const all = [
    ...plan.events.map(item => ({ path: `events/${item.id}`, data: item.data })),
    ...plan.guests.map(item => ({ path: `guests/${item.id}`, data: item.data })),
    ...plan.registrationLinks.map(item => ({ path: `registrationLinks/${item.id}`, data: item.data })),
  ];
  for (let index = 0; index < all.length; index += 400) {
    const batch = db.batch();
    for (const item of all.slice(index, index + 400)) batch.set(db.doc(item.path), item.data, { merge: true });
    await batch.commit();
  }
  await db.doc('migrations/global_state_v1').set({
    source: 'enlista/global_state',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    mode: 'apply',
    counts: { events: plan.events.length, guests: plan.guests.length, registrationLinks: plan.registrationLinks.length },
    skippedLegacyUsers: plan.skippedUsers,
    sourceEventIds: plan.events.map(item => item.id),
    sourceGuestIds: plan.guests.map(item => item.id),
    sourceLinkIds: plan.registrationLinks.map(item => item.id),
    sourceUpdatedAt: source.updatedAt || null,
  }, { merge: true });
}

(async () => {
  const source = await readSource();
  const plan = buildPlan(source);
  const existing = await inspectTarget(plan);
  const summary = {
    mode,
    projectId,
    source: 'enlista/global_state',
    events: plan.events.length,
    guests: plan.guests.length,
    registrationLinks: plan.registrationLinks.length,
    skippedLegacyUsers: plan.skippedUsers,
    existingTargetDocuments: existing.length,
    warnings: plan.warnings,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (existing.length) console.log(`Existing target documents: ${existing.join(', ')}`);
  if (mode === 'dry-run') {
    console.log('DRY-RUN: no se escribio ningun documento. Ejecutar con --apply para aplicar la copia.');
    return;
  }
  await applyPlan(plan, source);
  console.log('APPLY: migracion completada y registrada en migrations/global_state_v1.');
})().catch(error => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
