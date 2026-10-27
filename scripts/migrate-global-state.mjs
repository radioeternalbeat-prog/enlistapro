#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'en-lista-app-z1e6wt';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const dryRun = !process.argv.includes('--apply');
const backupOnly = process.argv.includes('--backup-only');

function initAdmin() {
  if (getApps().length) return getFirestore();
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccount) {
    return getFirestore(initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
      projectId: PROJECT_ID,
    }));
  }
  return getFirestore(initializeApp({ projectId: PROJECT_ID }));
}

function guestEntries(globalState) {
  const guestsByEvent = globalState.guests || {};
  return Object.entries(guestsByEvent).flatMap(([eventId, guests]) =>
    (Array.isArray(guests) ? guests : []).map((guest) => ({
      ...guest,
      id: guest.id,
      eventId,
      migrationSource: 'enlista/global_state',
      migratedAt: new Date().toISOString(),
    })),
  );
}

function assertGuestIntegrity(guests) {
  const ids = new Set();
  const qrCodes = new Set();
  for (const guest of guests) {
    if (!guest.id || !guest.eventId) throw new Error(`Invitado inválido: falta id/eventId (${JSON.stringify(guest)})`);
    if (ids.has(guest.id)) throw new Error(`ID de invitado duplicado: ${guest.id}`);
    if (!guest.qrCode) throw new Error(`Invitado ${guest.id} no tiene qrCode`);
    if (qrCodes.has(guest.qrCode)) throw new Error(`QR duplicado: ${guest.qrCode}`);
    ids.add(guest.id);
    qrCodes.add(guest.qrCode);
  }
}

async function writeBackup(db, globalState) {
  const backupRef = db.collection('enlista_backups').doc(`global_state_${timestamp}`);
  const payload = {
    sourcePath: 'enlista/global_state',
    capturedAt: FieldValue.serverTimestamp(),
    projectId: PROJECT_ID,
    globalState,
    guestCount: guestEntries(globalState).length,
  };
  if (!dryRun) await backupRef.set(payload);
  return backupRef.path;
}

async function migrateGuests(db, guests) {
  if (dryRun) return;
  for (let i = 0; i < guests.length; i += 400) {
    const batch = db.batch();
    for (const guest of guests.slice(i, i + 400)) {
      const { id, ...data } = guest;
      batch.set(db.collection('guests').doc(id), data, { merge: false });
    }
    await batch.commit();
  }
}

async function verifyGuests(db, guests) {
  if (dryRun) return { count: guests.length, qrCodes: guests.map((guest) => guest.qrCode) };
  const found = [];
  for (let i = 0; i < guests.length; i += 400) {
    const refs = guests.slice(i, i + 400).map((guest) => db.collection('guests').doc(guest.id));
    const docs = await db.getAll(...refs);
    for (const snapshot of docs) {
      if (!snapshot.exists) throw new Error(`Falta el documento migrado: ${snapshot.id}`);
      found.push({ id: snapshot.id, ...snapshot.data() });
    }
  }
  const expected = new Map(guests.map((guest) => [guest.id, guest.qrCode]));
  for (const guest of found) {
    if (expected.get(guest.id) !== guest.qrCode) throw new Error(`QR alterado para ${guest.id}`);
  }
  return { count: found.length, qrCodes: found.map((guest) => guest.qrCode) };
}

const db = initAdmin();
const globalSnapshot = await db.doc('enlista/global_state').get();
if (!globalSnapshot.exists) throw new Error('No existe enlista/global_state');
const globalState = globalSnapshot.data();
const guests = guestEntries(globalState);
assertGuestIntegrity(guests);

const localBackupPath = path.resolve('backups', `global_state_${timestamp}.json`);
await fs.mkdir(path.dirname(localBackupPath), { recursive: true });
await fs.writeFile(localBackupPath, JSON.stringify({
  sourcePath: 'enlista/global_state',
  projectId: PROJECT_ID,
  capturedAt: new Date().toISOString(),
  globalState,
}, null, 2));

const backupPath = await writeBackup(db, globalState);
console.log(`${dryRun ? '[dry-run] ' : ''}Backup local: ${localBackupPath}`);
console.log(`${dryRun ? '[dry-run] ' : ''}Backup Firestore: ${backupPath}`);
console.log(`Invitados detectados: ${guests.length}`);
console.log(`QR originales: ${guests.map((guest) => guest.qrCode).join(', ') || '(ninguno)'}`);

if (!backupOnly) {
  await migrateGuests(db, guests);
  const result = await verifyGuests(db, guests);
  console.log(`${dryRun ? '[dry-run] ' : ''}Verificación: ${result.count}/${guests.length} invitados; QR conservados.`);
}
