import { Type, GenerateContentResponse } from "@google/genai";
import { supabase } from '../../lib/supabaseClient';

export const UNAVAILABLE_ERROR = "The AI service is currently unavailable. Please contact the administrator.";

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
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { endpoint, params }
    });
    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data;
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
    
    // FIX: Use 'as any' to allow 'responseType' which may not be in the project's Supabase client types.
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { endpoint: 'generateContentStream', params },
        responseType: 'stream'
    } as any);

    if (error) throw error;
    if (!data) return;

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
    
    // 1. Start video generation
    onStatusUpdate('generating_video');
    const startGenerationCall = () => invokeFunction('generateVideos', startParams);
    let { operation } = await withRetry(startGenerationCall, onRetry);

    // 2. Poll for completion
    onStatusUpdate('processing_video');
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        
        const checkStatusCall = () => invokeFunction('getVideosOperation', { operation });
        try {
            const result = await withRetry(checkStatusCall, onRetry);
            operation = result.operation;
        } catch(e) {
            console.warn("Polling for video status failed, will retry.", e);
        }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    
    // 3. Download the video
    onStatusUpdate('video_ready');
    const { data: videoBlob, error: downloadError } = await supabase.functions.invoke('download-video', {
        body: { uri: downloadLink },
        responseType: 'blob'
    } as any);

    if (downloadError) {
        console.error("Failed to download video content via function", downloadError);
        throw new Error("Failed to download the generated video. Please check your network and try again.");
    }
    
    return URL.createObjectURL(videoBlob);
};