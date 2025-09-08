import { useState, useEffect } from 'react';
import { auth } from '../lib/firebaseClient';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { type AuthContextType } from '../types';

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
};