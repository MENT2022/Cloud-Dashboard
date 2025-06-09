import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";

// Log environment variables status
console.log("Firebase Init: Checking Environment Variables...");
const envVarsToCheck = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];
envVarsToCheck.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] ? 'SET' : 'NOT SET or EMPTY'}`);
});

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

const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'databaseURL',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(
    "Firebase configuration is missing critical values. " +
    `The following configuration keys are unset or empty: ${missingKeys.join(', ')}. ` +
    "This means their corresponding NEXT_PUBLIC_FIREBASE_ environment variables were not found. " +
    "Ensure they are correctly defined in your .env.local file (for local development) " +
    "or in your hosting provider's environment variable settings (for deployment)."
  );
} else {
  console.log("Firebase Init: All required Firebase config values appear to be set.");
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let firestoreDB: Firestore | null = null;
let rtdb: Database | null = null;

try {
  if (firebaseConfig.projectId) {
    firestoreDB = getFirestore(app);
  } else {
    console.warn("Firestore not initialized because firebaseConfig.projectId is missing.");
  }

  if (firebaseConfig.databaseURL && firebaseConfig.projectId) {
    rtdb = getDatabase(app);
  } else {
    let reasons = [];
    if (!firebaseConfig.databaseURL) reasons.push("firebaseConfig.databaseURL is missing");
    if (!firebaseConfig.projectId) reasons.push("firebaseConfig.projectId is missing");
    console.warn(`Realtime Database (RTDB) not initialized. Reason(s): ${reasons.join(', ')}.`);
  }
} catch (error) {
  console.error("Error initializing Firebase services (Firestore/RealtimeDatabase):", error);
}

export { app, firestoreDB, rtdb };
