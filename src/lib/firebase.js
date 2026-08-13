// Firebase configuration for EN LISTA!
// Replace these values with your actual Firebase project config
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDPBFvtSV2PITQC41ObFpWXv0C3df-gmd4",
  authDomain: "app-happybeat.firebaseapp.com",
  projectId: "app-happybeat",
  storageBucket: "app-happybeat.firebasestorage.app",
  messagingSenderId: "11149842884",
  appId: "1:11149842884:web:431dd2502cdb24c11bec91"
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
