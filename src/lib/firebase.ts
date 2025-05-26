import { initializeApp, getApps, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database"; // Added for Realtime Database
import { firebaseConfig } from "./firebaseConfig";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database; // Added for Realtime Database

// To prevent reinitialization errors during HMR in Next.js development
if (process.env.NODE_ENV === 'development' && getApps().length) {
  // Consider if app deletion is truly needed or if just getting the existing app is sufficient
  // deleteApp(getApps()[0]); 
}

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
db = getFirestore(app);
rtdb = getDatabase(app); // Initialize Realtime Database

export { app, auth, db, rtdb };