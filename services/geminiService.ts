import { GeneratedContentData, Language } from "../types.ts";
import { 
    callGroundedGenerationApi,
    callGroundedGenerationApiStream,
    callJsonGenerationApi,
    callVideoGenerationApi,
    fileToGenerativePart
} from './gemini/api.ts';
import { getGroundedPrompt, getJsonPrompt, getVideoPrompt } from './gemini/prompts.ts';
import { processGroundedResponse, processJsonResponse } from './gemini/parser.ts';

const groundedTools = ['seo_assistant', 'influencer_discovery', 'social_media_optimizer'];

export const generateContentForTool = async (
    toolId: string,
    inputs: Record<string, string | File>,
    language: Language,
    onRetry: (delaySeconds: number) => void,
    onStreamUpdate?: (chunk: string) => void
): Promise<GeneratedContentData> => {
    const textInputs: Record<string, string> = {};
    let imageParts: any[] = [];
    
    for(const key in inputs) {
        const value = inputs[key];
        if(typeof value === 'string') {
            textInputs[key] = value;
        } else if (value instanceof File) {
            const part = await fileToGenerativePart(value);
            imageParts.push(part);
        }
    }
    
    if (groundedTools.includes(toolId)) {
        const { prompt, title } = getGroundedPrompt(toolId, textInputs, language);

        if (onStreamUpdate) {
            const streamGenerator = callGroundedGenerationApiStream(prompt);
            let fullText = '';
            for await (const chunk of streamGenerator) {
                onStreamUpdate(chunk);
                fullText += chunk;
            }
            const processedResult = processGroundedResponse(fullText, title);
            return processedResult;
        } else {
            const response = await callGroundedGenerationApi(prompt, onRetry);
            const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const generatedData = processGroundedResponse(textResponse, title);
            return generatedData;
        }
    }

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
    const videoPrompt = getVideoPrompt(prompt, language);
    

    return await callVideoGenerationApi(videoPrompt, onRetry, onStatusUpdate);
};