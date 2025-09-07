import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { type Generation } from '../types';

const CACHE_KEY = 'generationHistory';

export const useHistory = () => {
    const [history, setHistory] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Function to fetch history from the server and update cache
        const fetchHistory = async () => {
            // Only show skeleton if the cache was empty and we are doing the initial fetch.
            if (history.length === 0) {
                setLoading(true);
            }

            const { data, error: fetchError } = await supabase
                .from('generations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (fetchError) {
                console.error('Error fetching history:', fetchError);
                setError(fetchError.message);
            } else if (data) {
                setHistory(data as Generation[]);
                // Update cache with fresh data
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                } catch (e) {
                    console.error("Failed to save history to cache", e);
                }
            }
            setLoading(false);
        };
        
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

        // Then, fetch fresh data from the server
        fetchHistory();
    }, []);

    return { history, loading, error };
};
