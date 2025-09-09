import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// FIX: Import firebase compat libraries to use the v8 API for Firestore.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

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

// Initialize Firebase modular app
const app = initializeApp(firebaseConfig);
// FIX: Initialize compat app to get access to compat services like firestore
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}


// Get Firebase services
const auth = getAuth(app); // Keep using modular auth
const db = firebase.firestore(); // Use compat firestore to fix module errors

export { app, auth, db };
