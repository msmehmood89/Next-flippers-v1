import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with force long polling to bypass WebSocket issues in the AI Studio environment
// We also disable auto-detect to ensure it sticks to long polling immediately
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
export const storage = getStorage(app);

// Explicitly set persistence to local to ensure sessions persist correctly within the iframe
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Firebase persistence error:", err);
});

// Test connection and log errors clearly
async function testConnection() {
  try {
    // Attempting to fetch a non-existent document just to check connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
    console.log("Firestore connection successful (long polling enabled)");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore connection failed: The client is offline or the backend is unreachable. Please check your Firebase configuration and internet connection.");
    } else {
      console.warn("Firestore connection check produced an expected error or transient issue:", error);
    }
  }
}

testConnection();
