import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

export const isGeminiAvailable = !!apiKey;

const ai = isGeminiAvailable ? new GoogleGenAI({ apiKey: apiKey as string }) : null;
const textModel = 'gemini-2.5-flash';
const videoModel = 'veo-2.0-generate-001';

export const UNAVAILABLE_ERROR = "AI Service is not configured. The API_KEY environment variable is missing.";

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
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                    const delaySeconds = Math.ceil(delay / 1000);
                    onRetry(delaySeconds);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } else {
                throw err; // Not a retriable error
            }
        }
    }
    throw lastError; // All retries failed
};


export const callGroundedGenerationApi = async (prompt: string, onRetry: (delaySeconds: number) => void): Promise<GenerateContentResponse> => {
    if (!ai) throw new Error(UNAVAILABLE_ERROR);
    const apiCall = () => ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    });
    return withRetry(apiCall, onRetry);
};

export async function* callGroundedGenerationApiStream(prompt: string): AsyncGenerator<string> {
    if (!ai) throw new Error(UNAVAILABLE_ERROR);

    const responseStream = await ai.models.generateContentStream({
        model: textModel,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    });

    for await (const chunk of responseStream) {
        // In grounded generation, sources can appear in groundingMetadata. We handle text here.
        yield chunk.text;
    }
}

export const callJsonGenerationApi = async (prompt: string, imageParts: any[], onRetry: (delaySeconds: number) => void): Promise<GenerateContentResponse> => {
    if (!ai) throw new Error(UNAVAILABLE_ERROR);
    const contents = { parts: [{ text: prompt }, ...imageParts] };
    const apiCall = () => ai.models.generateContent({
        model: textModel,
        contents: contents,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
    });
    return withRetry(apiCall, onRetry);
};

export const callVideoGenerationApi = async (prompt: string, onRetry: (delaySeconds: number) => void) => {
    if (!ai) throw new Error(UNAVAILABLE_ERROR);
    
    // Initial call to start the operation
    const initialApiCall = () => ai.models.generateVideos({
        model: videoModel,
        prompt: prompt,
        config: { numberOfVideos: 1 }
    });
    
    const operation = await withRetry(initialApiCall, onRetry);

    // Poll for completion
    let polledOperation: any = operation;
    while (!polledOperation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      polledOperation = await ai.operations.getVideosOperation({ operation: polledOperation });
    }
    
    const downloadLink = polledOperation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    
    // Fetch the video data and create a blob URL
    const fetchVideoApiCall = async () => {
        if (!apiKey) throw new Error("API Key is missing for video download.");
        const response = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        return response.blob();
    };

    try {
        const videoBlob = await withRetry(fetchVideoApiCall, onRetry);
        return URL.createObjectURL(videoBlob);
    } catch(e) {
        console.error("Failed to download video content", e);
        throw new Error("Failed to download the generated video. Please check your network and try again.");
    }
};