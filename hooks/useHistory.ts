import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebaseClient';
import { type Generation } from '../types';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const CACHE_KEY = 'generationHistory';

export const useHistory = () => {
    const [history, setHistory] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load from cache first for instant UI
        try {
            const cachedHistoryRaw = localStorage.getItem(CACHE_KEY);
            if (cachedHistoryRaw) {
                const cachedHistory = JSON.parse(cachedHistoryRaw);
                setHistory(cachedHistory);
                setLoading(false); // We have data, no need for initial skeleton
            }
        } catch (e) {
            console.error("Failed to load history from cache", e);
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Only show skeleton if cache was empty and we are doing the initial fetch.
                if (history.length === 0) {
                    setLoading(true);
                }

                try {
                    const q = query(
                        collection(db, 'generations'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );

                    const querySnapshot = await getDocs(q);
                    const firestoreHistory = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        // Firestore Timestamps need to be converted to a serializable format (ISO string)
                        const createdAtTimestamp = data.createdAt as Timestamp;
                        return {
                            id: doc.id,
                            created_at: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
                            tool_id: data.tool_id,
                            inputs: data.inputs,
                            output: data.output,
                        } as Generation;
                    });

                    setHistory(firestoreHistory);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(firestoreHistory));
                } catch (fetchError: any) {
                    console.error('Error fetching history:', fetchError);
                    setError(fetchError.message);
                } finally {
                    setLoading(false);
                }
            } else {
                // No user logged in, clear history
                setHistory([]);
                localStorage.removeItem(CACHE_KEY);
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []); // Empty dependency array ensures this effect runs only once on mount

    return { history, loading, error };
};