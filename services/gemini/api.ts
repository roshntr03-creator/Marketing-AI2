import { Type, GenerateContentResponse, GoogleGenAI } from "@google/genai";

export const UNAVAILABLE_ERROR = "The AI service is currently unavailable. Please check your API key and configuration.";

// WARNING: This is an insecure method for storing an API key and is intended for development purposes only.
// Anyone who can access your app can view this key.
// It is highly recommended to use a backend proxy (like the original Firebase Function) for production.
const API_KEY = "AIzaSyAnntvhw613jrh-XarcDtpJv7hhgx3z3jg";
if (!API_KEY || API_KEY.includes("YOUR_API_KEY")) {
    console.error("CRITICAL: Gemini API key is not configured.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });


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

export const callGroundedGenerationApi = async (prompt: string, onRetry: (delaySeconds: number) => void): Promise<GenerateContentResponse> => {
    const params = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    };
    const apiCall = () => ai.models.generateContent(params);
    return withRetry(apiCall, onRetry);
};

export async function* callGroundedGenerationApiStream(prompt: string): AsyncGenerator<string> {
    const params = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    };
    
    const responseStream = await ai.models.generateContentStream(params);

    for await (const chunk of responseStream) {
        yield chunk.text;
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
    const apiCall = () => ai.models.generateContent(params);
    return withRetry(apiCall, onRetry);
};

export const callVideoGenerationApi = async (prompt: string, onRetry: (delaySeconds: number) => void, onStatusUpdate: (status: string) => void) => {
    const startParams = {
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: { numberOfVideos: 1 }
    };
    
    onStatusUpdate('generating_video');
    const startGenerationCall = () => ai.models.generateVideos(startParams);
    let operation = await withRetry(startGenerationCall, onRetry);

    onStatusUpdate('processing_video');
    const MAX_POLLING_ATTEMPTS = 10;
    let pollingFailures = 0;

    while (operation && !operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));

        const checkStatusCall = () => ai.operations.getVideosOperation({ operation });
        try {
            operation = await withRetry(checkStatusCall, onRetry);
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
    
    // Fetch the video directly using the API key, convert to blob to hide key from URL
    const response = await fetch(`${downloadLink}&key=${API_KEY}`);

    if (!response.ok) {
        console.error("Failed to download video content");
        throw new Error("Failed to download the generated video. Please check your network and try again.");
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};
