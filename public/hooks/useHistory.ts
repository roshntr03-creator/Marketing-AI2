import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebaseClient.ts';
import { type Generation, type GeneratedContentData } from '../types.ts';

const CACHE_KEY = 'generationHistory';

/**
 * Custom hook to fetch and manage the user's content generation history.
 * It provides real-time updates, offline caching via localStorage, and
 * robust data sanitization.
 */
export const useHistory = () => {
    const [history, setHistory] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load from cache first for an instant UI response
        try {
            const cachedHistoryRaw = localStorage.getItem(CACHE_KEY);
            if (cachedHistoryRaw) {
                const cachedHistory = JSON.parse(cachedHistoryRaw);
                setHistory(cachedHistory);
            }
        } catch (e) {
            console.warn("Failed to load history from cache", e);
        }

        // Listen for authentication changes to fetch the correct user's history
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setLoading(true);
                setError(null);
                try {
                    const q = query(
                        collection(db, 'generations'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );

                    const querySnapshot = await getDocs(q);
                    const firestoreHistory = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        const createdAtTimestamp = data.createdAt as Timestamp;
                        
                        // Sanitize data to prevent app crashes from malformed db entries
                        const sanitizedOutput = (output: any): GeneratedContentData | string => {
                            if (typeof output === 'string') return output;
                            if (output && typeof output === 'object') {
                                return {
                                    title: String(output.title || 'Untitled'),
                                    sections: Array.isArray(output.sections) ? output.sections.map((s: any) => ({
                                        heading: String(s.heading || ''),
                                        content: s.content || '',
                                    })) : [],
                                    sources: Array.isArray(output.sources) ? output.sources.map((s: any) => ({
                                        uri: String(s.uri || ''),
                                        title: String(s.title || ''),
                                    })) : [],
                                };
                            }
                            return { title: "Invalid Content", sections: [] };
                        };

                        return {
                            id: doc.id,
                            created_at: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
                            tool_id: String(data.tool_id || ''),
                            inputs: data.inputs || {},
                            output: sanitizedOutput(data.output),
                        };
                    });

                    setHistory(firestoreHistory);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(firestoreHistory));
                } catch (fetchError: any) {
                    console.error('Error fetching history:', fetchError);
                    const userFriendlyError = fetchError.code === 'unavailable' 
                        ? "Could not connect to the server to fetch history." 
                        : "An error occurred while fetching your history.";
                    setError(userFriendlyError);
                } finally {
                    setLoading(false);
                }
            } else {
                // User is signed out, clear history and cache
                setHistory([]);
                localStorage.removeItem(CACHE_KEY);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return { history, loading, error };
};