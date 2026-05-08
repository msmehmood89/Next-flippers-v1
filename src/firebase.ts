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
  console.log("Starting Firestore connectivity check for project:", firebaseConfig.projectId);
  try {
    // Attempting a server-side only fetch to verify connectivity beyond local cache
    await getDocFromServer(doc(db, '_health_check_', 'ping'));
    console.log("Firestore connection verified successfully.");
  } catch (error: any) {
    // Treat 'not-found' as a successful network reach
    if (error?.code === 'not-found') {
       console.log("Firestore reachability confirmed (Document not found = backend reached).");
       return;
    }
    
    console.error("CRITICAL: Firestore unreachable.", {
      code: error?.code,
      message: error?.message,
      projectId: firebaseConfig.projectId,
      dbId: firebaseConfig.firestoreDatabaseId
    });

    if (error?.message?.includes('the client is offline')) {
      console.warn("Detected 'offline' status. This is often caused by ad-blockers, VPNs, or browser tracking protection blocking 'firestore.googleapis.com'.");
    }

    console.group("Firestore Troubleshooting");
    console.info("1. Check Firebase Console: Ensure Firestore was actually created in this project.");
    console.info("2. Check Authorized Domains: If using a custom domain, add it to 'Firebase Console > Auth > Settings'.");
    console.info("3. Check Project ID: Verify that firebase-applet-config.json points to the correct project.");
    console.groupEnd();
  }
}

// Perform the connectivity check
verifyConnection();
