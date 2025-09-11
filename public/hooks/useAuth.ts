import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebaseClient.ts';
import { type User, type AuthContextType } from '../types.ts';

/**
 * A custom hook to manage user authentication state.
 * It listens for changes in the user's login status and provides
 * the user object and a loading state to the application.
 *
 * @returns {AuthContextType} An object containing the current user and loading state.
 */
export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function that is called
    // when the component unmounts, preventing memory leaks.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    }, (error) => {
      console.error("Authentication state error:", error);
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return { user, loading };
};