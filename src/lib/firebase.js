// Firebase configuration for EN LISTA!
// Production Firebase project: en-lista-app-z1e6wt
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDG2rjUZKMPSrCBwNOwHr9W-YJGvPbub94",
  authDomain: "en-lista-app-z1e6wt.firebaseapp.com",
  projectId: "en-lista-app-z1e6wt",
  storageBucket: "en-lista-app-z1e6wt.firebasestorage.app",
  messagingSenderId: "156010061349",
  appId: "1:156010061349:web:d4afa3c34c7535b38e29cc"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not available in this browser');
  }
});

export default app;
