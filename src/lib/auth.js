import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const profile = await getUserProfile(credential.user.uid);
  if (!profile || profile.active === false || profile.status === 'rejected') {
    await signOut(auth);
    throw new Error(profile?.status === 'rejected' ? 'ACCOUNT_REJECTED' : 'ACCOUNT_INACTIVE');
  }
  if (profile.status === 'pending') {
    await signOut(auth);
    throw new Error('ACCOUNT_PENDING');
  }
  return { authUser: credential.user, profile };
}

export async function createAdminAccount({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const profile = { uid: credential.user.uid, id: credential.user.uid, email: credential.user.email, displayName: name.trim(), role: 'admin', active: true, status: 'approved' };
  await setDoc(doc(db, 'users', credential.user.uid), profile);
  return profile;
}

export async function registerPromoterRequest({ name, email, password, phone = '' }) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const profile = {
    uid: credential.user.uid,
    id: credential.user.uid,
    displayName: name.trim(),
    email: credential.user.email,
    phone: phone.trim(),
    role: 'rrpp',
    status: 'pending',
    active: false,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'promoters', credential.user.uid), profile);
    await signOut(auth);
    return profile;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}

export async function getUserProfile(uid) {
  const promoter = await getDoc(doc(db, 'promoters', uid));
  if (promoter.exists()) return promoter.data();
  const user = await getDoc(doc(db, 'users', uid));
  return user.exists() ? user.data() : null;
}

export async function listPromoters() {
  const snapshot = await getDocs(collection(db, 'promoters'));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function updatePromoterApproval(uid, status) {
  if (!['approved', 'rejected', 'suspended'].includes(status)) throw new Error('INVALID_STATUS');
  await updateDoc(doc(db, 'promoters', uid), { status, active: status === 'approved', reviewedAt: new Date().toISOString() });
}

export async function logout() { await signOut(auth); }
export async function resetPassword(email) { await sendPasswordResetEmail(auth, email.trim().toLowerCase()); }

export function authErrorMessage(error) {
  const messages = {
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Email o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ese email ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
    'permission-denied': 'No tenés permisos para realizar esta operación.',
    ACCOUNT_INACTIVE: 'Esta cuenta está pendiente de aprobación o fue desactivada.',
    ACCOUNT_PENDING: 'Tu solicitud está pendiente de aprobación por un administrador.',
    ACCOUNT_REJECTED: 'Tu solicitud de acceso fue rechazada.',
    INVALID_STATUS: 'Estado de aprobación inválido.',
  };
  return messages[error?.code] || messages[error?.message] || 'No se pudo completar la operación.';
}
