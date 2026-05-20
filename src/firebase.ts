import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "climatevision-scifi.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "climatevision-scifi",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "climatevision-scifi.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:a1b2c3d4e5f6"
};

let app;
let auth: any = null;
let db: any = null;
let isFirebaseEnabled = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseEnabled = true;
    console.log("[CLIMATEVISION FIREBASE] Planetary database connection online.");
  } catch (err) {
    console.error("[CLIMATEVISION FIREBASE] Core neural link initialization failed:", err);
  }
} else {
  console.warn("[CLIMATEVISION FIREBASE] API Key not detected. Deploying in Local Simulation Mode.");
}

export { auth, db, isFirebaseEnabled };
