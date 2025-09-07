import { GeneratedContentData, Language } from "../types";
import { 
    callGroundedGenerationApi, 
    callJsonGenerationApi, 
    callVideoGenerationApi,
    fileToGenerativePart,
    isGeminiAvailable as geminiAvailable,
    UNAVAILABLE_ERROR 
} from './gemini/api';
import { getGroundedPrompt, getJsonPrompt, getVideoPrompt } from './gemini/prompts';
import { processGroundedResponse, processJsonResponse } from './gemini/parser';

export const isGeminiAvailable = geminiAvailable;

const groundedTools = ['seo_assistant', 'influencer_discovery', 'social_media_optimizer'];

export const generateContentForTool = async (
    toolId: string,
    inputs: Record<string, string | File>,
    language: Language,
    onRetry: (delaySeconds: number) => void
): Promise<GeneratedContentData> => {
    if (!isGeminiAvailable) {
        throw new Error(UNAVAILABLE_ERROR);
    }

    const textInputs: Record<string, string> = {};
    const fileInputs: File[] = [];
    
    for(const key in inputs) {
        const value = inputs[key];
        if(typeof value === 'string') {
            textInputs[key] = value;
        } else if (value instanceof File) {
            fileInputs.push(value);
        }
    }
    
    if (groundedTools.includes(toolId)) {
        const { prompt, title } = getGroundedPrompt(toolId, textInputs, language);
        const response = await callGroundedGenerationApi(prompt, onRetry);
        const textResponse = response.text;
        const generatedData = processGroundedResponse(textResponse, title);
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }))
            .filter(source => source.uri && source.title);
        generatedData.sources = sources;
        return generatedData;
    }

    const imageParts = await Promise.all(fileInputs.map(fileToGenerativePart));
    const prompt = getJsonPrompt(toolId, textInputs, language, imageParts.length > 0);
    const response = await callJsonGenerationApi(prompt, imageParts, onRetry);

    return processJsonResponse(response);
};

export const generateVideo = async (
    prompt: string,
    language: Language,
    onStatusUpdate: (status: string) => void,
    onRetry: (delaySeconds: number) => void
): Promise<string> => {
    if (!isGeminiAvailable) {
        throw new Error(UNAVAILABLE_ERROR);
    }

    onStatusUpdate('generating_video');
    const videoPrompt = getVideoPrompt(prompt, language);
    
    // The API call itself handles the 'processing' which can be lengthy (polling)
    // We update the status before this long-running task starts
    onStatusUpdate('processing_video');
    
    const resultUrl = await callVideoGenerationApi(videoPrompt, onRetry);

    onStatusUpdate('video_ready');
    return resultUrl;
};
