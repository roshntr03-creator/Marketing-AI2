import { Type, GenerateContentResponse } from "@google/genai";
import { app, auth, firebaseConfig } from '../../lib/firebaseClient';
// FIX: Use named imports for Firebase Functions to ensure correct module resolution.
import { getFunctions, httpsCallable } from 'firebase/functions';

// Initialize Firebase Functions and point to the correct region.
const functionsInstance = getFunctions(app, 'us-central1');

// Create a callable reference for non-streaming, JSON-based API calls.
const geminiApiCall = httpsCallable(functionsInstance, 'geminiApiCall');

// Dynamically construct URLs to prevent config mismatches.
const REGION = 'us-central1';
if (!firebaseConfig.projectId) {
    throw new Error("Firebase projectId is not configured in firebaseClient.ts. The application cannot call backend functions.");
}
const GEMINI_STREAM_URL = `https://${REGION}-${firebaseConfig.projectId}.cloudfunctions.net/geminiApiStream`;
const DOWNLOAD_VIDEO_URL = `https://${REGION}-${firebaseConfig.projectId}.cloudfunctions.net/downloadVideo`;


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
        const result = await geminiApiCall({ endpoint, params });
        return result.data;
    } catch (error: any) {
        console.error("Firebase Functions call failed:", error);
        // Create an error object that includes backend context if available for better debugging.
        const enhancedError = new Error(error.message || 'The AI service failed to respond.');
        // @ts-ignore
        enhancedError.context = { error: error.message, hint: error.details?.hint };
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
        config: { tools: [{ googleSearch: {} }] },
    };
    const apiCall = () => callProxyApi('generateContent', params);
    return withRetry(apiCall, onRetry) as Promise<GenerateContentResponse>;
};

export async function* callGroundedGenerationApiStream(prompt: string): AsyncGenerator<string> {
    const params = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    };
    
    const token = await getAuthToken();
    const response = await fetch(GEMINI_STREAM_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ params }), // The streaming endpoint now only needs params.
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
    const startParams = {
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: { numberOfVideos: 1 }
    };
    
    onStatusUpdate('generating_video');
    const startGenerationCall = () => callProxyApi('generateVideos', startParams);
    let { operation } = await withRetry(startGenerationCall, onRetry);

    onStatusUpdate('processing_video');
    const MAX_POLLING_ATTEMPTS = 10;
    let pollingFailures = 0;

    while (operation && !operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));

        const checkStatusCall = () => callProxyApi('getVideosOperation', { operation });
        try {
            const result = await withRetry(checkStatusCall, onRetry);
            operation = result.operation;
            pollingFailures = 0; // Reset on success
        } catch (e) {
            pollingFailures++;
            console.warn(`Polling attempt ${pollingFailures}/${MAX_POLLING_ATTEMPTS} failed.`, e);
            if (pollingFailures >= MAX_POLLING_ATTEMPTS) {
                throw new Error("Video status check failed too many times. Please try again later.");
            }
        }
    }
    
    if (!operation?.done) {
        throw new Error("Video generation did not complete successfully or was aborted.");
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    
    onStatusUpdate('video_ready');
    
    // The final download must still use fetch to get the blob data.
    const token = await getAuthToken();
    const response = await fetch(DOWNLOAD_VIDEO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ uri: downloadLink }),
    });

    if (!response.ok) {
        console.error("Failed to download video content");
        throw new Error("Failed to download the generated video. Please check your network and try again.");
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};