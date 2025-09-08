import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This configuration has been updated with the user-provided Firebase project details.
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBEyzPSErOgNiKUp8psz_stgooB4Bpzl2I",
  authDomain: "marketing-ai3-6f723.firebaseapp.com",
  projectId: "marketing-ai3-6f723",
  storageBucket: "marketing-ai3-6f723.appspot.com",
  messagingSenderId: "1003541680857",
  appId: "1:1003541680857:web:6a7b3565b6918de8cb24c8",
  measurementId: "G-436HC96G3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };