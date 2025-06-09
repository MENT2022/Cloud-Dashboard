import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
// import { getAuth, type Auth } from "firebase/auth"; // Removed Auth import
import { getDatabase, type Database } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const requiredConfigValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.databaseURL,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

if (requiredConfigValues.some(value => !value)) {
  console.error(
    "Firebase configuration is missing. " +
    "Ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set."
  );
}

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let firestoreDB: Firestore | null = null;
// let auth: Auth | null = null; // Removed auth instance
let rtdb: Database | null = null;

try {
  firestoreDB = getFirestore(app);
  // auth = getAuth(app); // Removed auth initialization
  rtdb = getDatabase(app);
} catch (error) {
  console.error("Error initializing Firebase services (Firestore/RealtimeDatabase):", error);
}

export { app, firestoreDB, rtdb }; // Removed auth from exports
