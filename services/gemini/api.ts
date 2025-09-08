import { Type, GenerateContentResponse } from "@google/genai";
import { auth } from '../../lib/firebaseClient';

export const UNAVAILABLE_ERROR = "The AI service is currently unavailable. Please contact the administrator.";

// TODO: Replace with your deployed Firebase Function URLs
const GEMINI_PROXY_URL = 'YOUR_FIREBASE_FUNCTION_URL/geminiProxy';
const DOWNLOAD_VIDEO_URL = 'YOUR_FIREBASE_FUNCTION_URL/downloadVideo';

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
            if (err.message && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429'))) {
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

const invokeFunction = async (endpoint: string, params: any) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Authentication required.");
    }

    const idToken = await user.getIdToken();

    const response = await fetch(GEMINI_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ endpoint, params }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText, hint: 'The server returned a non-JSON response.' }));
        const err = new Error(errorData.error || 'An unknown server error occurred.');
        (err as any).context = errorData;
        throw err;
    }
    
    // For streaming, we want the raw response body. For others, JSON.
    if (endpoint.endsWith('Stream')) {
        return response.body;
    }

    return response.json();
};

export const callGroundedGenerationApi = async (prompt: string, onRetry: (delaySeconds: number) => void): Promise<GenerateContentResponse> => {
    const params = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    };
    const apiCall = () => invokeFunction('generateContent', params);
    return withRetry(apiCall, onRetry);
};

export async function* callGroundedGenerationApiStream(prompt: string): AsyncGenerator<string> {
    const params = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    };
    
    const data = await invokeFunction('generateContentStream', params);

    if (!(data instanceof ReadableStream)) {
       throw new Error("Received an unexpected response type from the streaming function.");
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value);
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
    const apiCall = () => invokeFunction('generateContent', params);
    return withRetry(apiCall, onRetry);
};

export const callVideoGenerationApi = async (prompt: string, onRetry: (delaySeconds: number) => void, onStatusUpdate: (status: string) => void) => {
    const startParams = {
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: { numberOfVideos: 1 }
    };
    
    onStatusUpdate('generating_video');
    const startGenerationCall = () => invokeFunction('generateVideos', startParams);
    let { operation } = await withRetry(startGenerationCall, onRetry);

    onStatusUpdate('processing_video');
    const MAX_POLLING_ATTEMPTS = 10;
    let pollingFailures = 0;

    while (operation && !operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));

        const checkStatusCall = () => invokeFunction('getVideosOperation', { operation });
        try {
            const result = await withRetry(checkStatusCall, onRetry);
            if (result && result.operation) {
                operation = result.operation;
                pollingFailures = 0; // Reset on success
            } else {
                throw new Error("Invalid polling response from server.");
            }
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
    
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required for download.");
    const idToken = await user.getIdToken();

    const response = await fetch(DOWNLOAD_VIDEO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uri: downloadLink }),
    });


    if (!response.ok) {
        console.error("Failed to download video content via function");
        throw new Error("Failed to download the generated video. Please check your network and try again.");
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};