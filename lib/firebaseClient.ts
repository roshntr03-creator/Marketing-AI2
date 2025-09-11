import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// FIX: Resolved a module resolution error. The original 'firebase/functions' import
// was ambiguous and conflicted with the local backend functions directory.
// Importing directly from '@firebase/functions' ensures the correct client SDK is loaded.
import { getFunctions, httpsCallable } from '@firebase/functions';

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
const functions = getFunctions(app, 'us-central1');

// Using named imports, `httpsCallable` is now directly available for export.

export { app, auth, db, functions, httpsCallable };
