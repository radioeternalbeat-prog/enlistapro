import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase.js';

export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const profile = await getUserProfile(credential.user.uid);
  if (!profile || profile.active === false) { await signOut(auth); throw new Error('ACCOUNT_INACTIVE'); }
  return { authUser: credential.user, profile };
}

export async function createAdminAccount({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const profile = { uid: credential.user.uid, id: credential.user.uid, email: credential.user.email, displayName: name.trim(), role: 'admin', active: true };
  await setDoc(doc(db, 'users', credential.user.uid), profile);
  return profile;
}

export async function getUserProfile(uid) {
  const promoter = await getDoc(doc(db, 'promoters', uid));
  if (promoter.exists()) return promoter.data();
  const user = await getDoc(doc(db, 'users', uid));
  return user.exists() ? user.data() : null;
}

export async function listActivePromoters() {
  const snapshot = await getDocs(collection(db, 'promoters'));
  return snapshot.docs.map(item => item.data()).filter(profile => profile.active !== false);
}

export async function createPromoterAccount({ name, email, password, phone = '' }) {
  const callable = httpsCallable(functions, 'createPromoter');
  const result = await callable({ name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim() });
  return result.data;
}

export async function managePromoterAccount(uid, action) {
  const callable = httpsCallable(functions, 'managePromoter');
  const result = await callable({ uid, action });
  return result.data;
}

export async function logout() { await signOut(auth); }

export function authErrorMessage(error) {
  const messages = {
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Email o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ese email ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
    'functions/permission-denied': 'Solo un administrador puede realizar esta operación.',
    'functions/already-exists': 'Ese email ya está registrado.',
    'functions/not-found': 'No se encontró el promotor.',
    ACCOUNT_INACTIVE: 'Esta cuenta fue desactivada por un administrador.',
  };
  return messages[error?.code] || messages[error?.message] || 'No se pudo completar la autenticación.';
}
