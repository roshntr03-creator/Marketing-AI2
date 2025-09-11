import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// FIX: Using a namespace import to address module resolution errors for 'getFunctions' and 'httpsCallable'.
// This pattern can help in environments where tree-shaking or bundler configurations cause issues with named exports.
import * as fbFunctions from 'firebase/functions';

// This configuration has been updated with the user-provided Firebase project details.
// Exported to allow dynamic URL creation for Cloud Functions.
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBEyzPSErOgNiKUp8psz_stgooB4Bpzl2I",
  authDomain: "marketing-ai3-6f723.firebaseapp.com",
  projectId: "marketing-ai3-6f723",
  storageBucket: "marketing-ai3-6f723.firebasestorage.app",
  messagingSenderId: "1003541680857",
  appId: "1:1003541680857:web:6a7b3565b6918de8cb24c8",
  measurementId: "G-436HC96G3L"
};

// Initialize Firebase with the modern modular approach.
const app = initializeApp(firebaseConfig);

// Get Firebase services using the v9+ modular functions.
const auth = getAuth(app);
const db = getFirestore(app);
// Specify the region for the functions instance.
const functions = fbFunctions.getFunctions(app, 'us-central1');

// Re-export httpsCallable under its original name for other files that consume it.
const httpsCallable = fbFunctions.httpsCallable;

export { app, auth, db, functions, httpsCallable };
