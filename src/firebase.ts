import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings optimized for restricted network environments (like iFrames or corporate proxies)
// We use force long polling to avoid WebSocket/gRPC-web connection issues.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
export const storage = getStorage(app);

// Use local persistence to maintain user sessions reliably within the application frame
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Firebase persistence setup failed:", err);
});

/**
 * Validates the Firestore connection on startup.
 * Logs success or specific failure insights to help with debugging.
 */
async function verifyConnection() {
  try {
    // Attempting a server-side only fetch to verify connectivity beyond local cache
    await getDocFromServer(doc(db, '_health_check_', 'ping'));
    console.log("Firestore connection verified successfully.");
  } catch (error: any) {
    // Treat 'not-found' as a successful network reach
    if (error?.code === 'not-found') return;
    
    // Log as a warning since the SDK will usually continue to retry in the background
    console.warn("Firestore connectivity notice: The backend is currently unreachable. The app will work in offline mode until connection is established.", error?.message);
  }
}

// Perform the connectivity check
verifyConnection();
