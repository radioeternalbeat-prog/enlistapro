import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

const DEVICE_KEY = 'enlista_device_id';
const LICENSE_KEY = 'enlista_license_key';

// Genera un UUID simple para identificar este dispositivo (navegador/celular)
function generateDeviceId() {
  return 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Obtiene o crea el ID del dispositivo
export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

// Guarda la licencia en el dispositivo
export function saveLicenseKey(key) {
  localStorage.setItem(LICENSE_KEY, key.trim().toUpperCase());
}

export function removeLicenseLocally() {
  localStorage.removeItem(LICENSE_KEY);
}

// ==========================================
// VALIDACION DE LICENCIA
// ==========================================
export async function validateLicense() {
  const licenseKey = localStorage.getItem(LICENSE_KEY);
  const deviceId = getDeviceId();

  if (!licenseKey) {
    return { valid: false, reason: 'no_license' };
  }

  try {
    const licenseRef = doc(db, 'licenses', licenseKey);
    const licenseSnap = await getDoc(licenseRef);

    if (!licenseSnap.exists()) {
      return { valid: false, reason: 'invalid_key', message: 'La clave ingresada no existe.' };
    }

    const licenseData = licenseSnap.data();

    // 1. Check status
    if (licenseData.status !== 'active') {
      return { valid: false, reason: 'inactive', message: 'Esta licencia esta suspendida o expirada.' };
    }

    // 2. Check if device is already registered
    const devices = licenseData.devices || [];
    if (devices.includes(deviceId)) {
      return { valid: true }; // Todo OK, dispositivo ya estaba autorizado
    }

    // 3. New device: Check if limit reached
    const maxDevices = licenseData.maxDevices || 3;
    if (devices.length >= maxDevices) {
      return { 
        valid: false, 
        reason: 'limit_reached', 
        message: `Esta licencia ya alcanzo su limite de ${maxDevices} dispositivos.` 
      };
    }

    // 4. Authorize new device!
    await updateDoc(licenseRef, {
      devices: arrayUnion(deviceId),
      lastUsedAt: serverTimestamp()
    });

    return { valid: true, message: 'Dispositivo autorizado exitosamente!' };

  } catch (error) {
    console.error("Error validating license:", error);
    return { valid: false, reason: 'network_error', message: 'Error de conexion al validar la licencia.' };
  }
}

// ==========================================
// CREACION DE LICENCIAS (Mock para el flujo de pago)
// ==========================================
export async function generateNewLicense(email, plan = 'PRO') {
  const newKey = 'ENLS-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  
  const licenseData = {
    key: newKey,
    email: email,
    plan: plan,
    maxDevices: 3,
    devices: [],
    status: 'active',
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'licenses', newKey), licenseData);
  
  return newKey;
}
