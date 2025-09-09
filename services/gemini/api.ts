import { Type, GenerateContentResponse } from "@google/genai";
import { app, auth, firebaseConfig } from '../../lib/firebaseClient.ts';
import { httpsCallable, getFunctions } from 'firebase/functions';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Dynamically construct URLs to prevent config mismatches.
if (!firebaseConfig.projectId) {
    throw new Error("Firebase projectId is not configured in firebaseClient.ts. The application cannot call backend functions.");
}

// Firebase Functions
const geminiApiCall = httpsCallable(functions, 'geminiApiCall');
const downloadVideo = httpsCallable(functions, 'downloadVideo');

/**
 * Retrieves the Firebase authentication token for the current user.
 * This is only needed for direct `fetch` calls, as `httpsCallable` handles it automatically.
 * @returns {Promise<string>} The Firebase ID token.
 * @throws {Error} If the user is not authenticated.
 */
const getAuthToken = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated. Please log in again.");
    }
    // Force refresh the token to ensure it's not expired.
    return await user.getIdToken(true);
};

/**
 * A generic function to call the `geminiApiCall` Firebase Function for non-streaming requests.
 * @param {string} endpoint The specific Gemini API endpoint to call (e.g., 'generateContent').
 * @param {any} params The parameters to pass to the Gemini API.
 * @returns {Promise<any>} The JSON response from the proxy.
 * @throws {Error} If the API call fails.
 */
const callProxyApi = async (endpoint: string, params: any): Promise<any> => {
    try {
        // التحقق من صحة المعاملات
        if (!endpoint || typeof endpoint !== 'string') {
            throw new Error('Invalid endpoint provided');
        }
        
        const result = await geminiApiCall({ endpoint, params });
        return result.data;
    } catch (error: any) {
        console.error("Firebase Functions call failed:", error);
        
        // تحسين معالجة الأخطاء
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const networkError = new Error('فشل في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
            // @ts-ignore
            networkError.context = { error: 'Network connection failed', hint: 'Check internet connection' };
            throw networkError;
        }
        
        // Ensure error is in a consistent format for the caller.
        const enhancedError = new Error(error.message || 'The AI service failed to respond.');
        // @ts-ignore
        enhancedError.context = error.context || { error: error.message };
        throw enhancedError;
    }
};

// This schema is still needed on the client to construct the request correctly.
export const responseSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: { type: Type.STRING },
                    content: { type: Type.STRING, description: "The content of the section. For lists, use newline-separated items, each starting with '- '." },
                },
                required: ['heading', 'content']
            }
        },
    },
    required: ['title', 'sections']
};

// This utility is still needed on the client to process file uploads.
export const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

// The retry wrapper is still a valuable client-side pattern.
const withRetry = async <T>(
    apiCall: () => Promise<T>,
    onRetry: (delaySeconds: number) => void
): Promise<T> => {
    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            return await apiCall();
        } catch (err: any) {
            lastError = err;
            const functionError = err.context?.error || err.message || '';
            
            // Check for rate limiting errors from either the proxy or Gemini itself.
            if (functionError.includes('RESOURCE_EXHAUSTED') || functionError.includes('429')) {
                if (attempt < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    const delaySeconds = Math.ceil(delay / 1000);
                    onRetry(delaySeconds);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } else {
                throw err;
            }
        }
    }
    throw lastError;
};

// --- Refactored API Functions ---

export const callGroundedGenerationApi = async (prompt: string, onRetry: (delaySeconds: number) => void): Promise<GenerateContentResponse> => {
    const params = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ google_search_retrieval: {} }] },
    };
    const apiCall = () => callProxyApi('generateContent', params);
    return withRetry(apiCall, onRetry) as Promise<GenerateContentResponse>;
};

export async function* callGroundedGenerationApiStream(prompt: string): AsyncGenerator<string> {
    const STREAM_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/geminiApiStream`;
    
    const token = await getAuthToken();
    const response = await fetch(STREAM_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
            params: {
                model: 'gemini-1.5-flash',
                contents: prompt,
                config: { tools: [{ google_search_retrieval: {} }] }
            }
        }),
    });

    if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ error: 'Streaming API call failed with no body.' }));
        throw new Error(errorData.error);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield decoder.decode(value, { stream: true });
        }
    } finally {
        reader.releaseLock();
    }
}

export const callJsonGenerationApi = async (prompt: string, imageParts: any[], onRetry: (delaySeconds: number) => void): Promise<GenerateContentResponse> => {
    const contents = { parts: [{ text: prompt }, ...imageParts] };
    const params = {
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
    };
    const apiCall = () => callProxyApi('generateContent', params);
    return withRetry(apiCall, onRetry) as Promise<GenerateContentResponse>;
};

export const callVideoGenerationApi = async (prompt: string, onRetry: (delaySeconds: number) => void, onStatusUpdate: (status: string) => void) => {
    // Video generation is not implemented yet
    throw new Error('Video generation feature is coming soon!');
};