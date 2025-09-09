import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebaseClient.ts';
import { type Generation, type GeneratedContentData } from '../types.ts';
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
                    let querySnapshot;
                    
                    try {
                        // Try the optimized query with index first
                        const q = query(
                            collection(db, 'generations'),
                            where('userId', '==', user.uid),
                            orderBy('createdAt', 'desc')
                        );
                        querySnapshot = await getDocs(q);
                    } catch (indexError: any) {
                        // If index is missing, fall back to simple query without ordering
                        if (indexError.code === 'failed-precondition' && indexError.message.includes('index')) {
                            console.warn('Firestore index missing, using fallback query');
                            const fallbackQ = query(
                                collection(db, 'generations'),
                                where('userId', '==', user.uid)
                            );
                            querySnapshot = await getDocs(fallbackQ);
                        } else {
                            throw indexError;
                        }
                    }
                    
                    const firestoreHistory: Generation[] = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        const createdAtTimestamp = data.createdAt as Timestamp;
                        
                        // Robustly sanitize the output field to create a plain, serializable object.
                        const sanitizeOutput = (output: any): GeneratedContentData | string => {
                            if (typeof output === 'string') {
                                return output; // Preserve string output for video prompts
                            }
                            if (!output || typeof output !== 'object') {
                                return {
                                    title: "Corrupted Content",
                                    sections: [{ heading: "Error", content: "This historical result could not be displayed." }]
                                };
                            }
                            // Rebuild the object to ensure it's a plain object
                            const clean: GeneratedContentData = {
                                title: String(output.title || 'Untitled'),
                                sections: [],
                            };
                            if (Array.isArray(output.sections)) {
                                clean.sections = output.sections.map((s: any) => ({
                                    heading: String(s.heading || ''),
                                    content: s.content, // content can be string or string[]
                                }));
                            }
                            if (Array.isArray(output.sources)) {
                                clean.sources = output.sources.map((s: any) => ({
                                    uri: String(s.uri || ''),
                                    title: String(s.title || ''),
                                }));
                            }
                            return clean;
                        };
                        
                        // Robustly sanitize the inputs field.
                        const sanitizeInputs = (inputs: any): Record<string, string> => {
                            if (!inputs || typeof inputs !== 'object') return {};
                            const clean: Record<string, string> = {};
                            Object.keys(inputs).forEach(key => {
                                // Ensure value is a primitive before assigning
                                const value = inputs[key];
                                if (typeof value !== 'object' && value !== null && value !== undefined) {
                                    clean[key] = String(value);
                                }
                            });
                            return clean;
                        };

                        return {
                            id: doc.id,
                            created_at: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
                            tool_id: String(data.tool_id || ''),
                            inputs: sanitizeInputs(data.inputs),
                            output: sanitizeOutput(data.output),
                        };
                    });

                    setHistory(firestoreHistory);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(firestoreHistory));
                } catch (fetchError: any) {
                    console.error('Error fetching history:', fetchError);
                    let userFriendlyError = "An error occurred while fetching your history.";
                    // Provide a more helpful error for network issues.
                    if (fetchError.code === 'unavailable') {
                        userFriendlyError = "Could not connect to the server. Please check your internet connection. Your history may be out of date.";
                    } else {
                        userFriendlyError = fetchError.message;
                    }
                    setError(userFriendlyError);
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