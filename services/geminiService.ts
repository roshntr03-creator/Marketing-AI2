import { GeneratedContentData, Language } from "../types.ts";
import { 
    callGenkitGenerateContent,
    callGenkitGenerateStreamingContent,
    callGenkitGenerateVideo
} from './genkit/api.ts';
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

        if (onStreamUpdate) {
            const streamGenerator = callGenkitGenerateStreamingContent(prompt, {
                tools: [{ googleSearch: {} }]
            });
            let fullText = '';
            for await (const chunk of streamGenerator) {
                onStreamUpdate(chunk);
                fullText += chunk;
            }
            const processedResult = processGroundedResponse(fullText, title);
            return processedResult;
        } else {
            const response = await callGenkitGenerateContent(prompt, {
                tools: [{ googleSearch: {} }]
            });
            const textResponse = response.text;
            const generatedData = processGroundedResponse(textResponse, title);
            return generatedData;
        }
    }

    const prompt = getJsonPrompt(toolId, textInputs, language, imageParts.length > 0);
    const response = await callGenkitGenerateContent(prompt, {
        responseMimeType: 'application/json'
    });

    return processJsonResponse(response);
};

export const generateVideo = async (
    prompt: string,
    language: Language,
    onStatusUpdate: (status: string) => void,
    onRetry: (delaySeconds: number) => void
): Promise<string> => {
    const videoPrompt = getVideoPrompt(prompt, language);
    
    onStatusUpdate('generating_video');
    const result = await callGenkitGenerateVideo(videoPrompt);
    onStatusUpdate('video_ready');

    return result.videoUrl || '';
};