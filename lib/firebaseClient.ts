import { type FirebaseOptions } from 'firebase/app';
// FIX: Import firebase compat libraries to use the v8 API for all services.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/functions';


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

// Initialize Firebase using the compat library to ensure a single app instance.
// This instance will be used by all compat services.
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

// Get the default Firebase app instance initialized by the compat library.
const app = firebase.app();

// Get Firebase services using the v8 compatibility API.
const auth = firebase.auth();
const db = firebase.firestore(); 
const functions = firebase.functions();

export { app, auth, db, functions };