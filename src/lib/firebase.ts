import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== "undefined" && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (getApps().length > 0) {
  app = getApps()[0]!;
  auth = getAuth(app);
  db = getFirestore(app);
}

// Ensure auth and db are assigned for server-side contexts if needed,
// though client-side initialization is primary for this setup.
// For server components, you'd use Firebase Admin SDK.
// This setup is primarily for client-side Firebase usage.
if (!auth!) {
  const tempApp = initializeApp(firebaseConfig); // Temporary for environments where getApps might be tricky
  auth = getAuth(tempApp);
  db = getFirestore(tempApp);
}


export { app, auth, db };
