import { GeneratedContentData, Language } from "../types";
import { 
    callGroundedGenerationApi, 
    callGroundedGenerationApiStream,
    callJsonGenerationApi, 
    callVideoGenerationApi,
    fileToGenerativePart
} from './gemini/api';
import { getGroundedPrompt, getJsonPrompt, getVideoPrompt } from './gemini/prompts';
import { processGroundedResponse, processJsonResponse } from './gemini/parser';

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
            const streamGenerator = callGroundedGenerationApiStream(prompt);
            let fullText = '';
            for await (const chunk of streamGenerator) {
                onStreamUpdate(chunk);
                fullText += chunk;
            }
            const processedResult = processGroundedResponse(fullText, title);
            
            // After streaming, make a non-blocking call to get grounding sources
            // to enhance the final result without delaying the initial text display.
            callGroundedGenerationApi(prompt, () => {}).then(metadataResponse => {
                const sources = metadataResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
                    ?.map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }))
                    .filter(source => source.uri && source.title);
                if (sources && sources.length > 0) {
                    // This part of the logic would require a way to update the state in useToolRunner
                    // For simplicity and to avoid complex state management, we will omit adding sources post-stream for now.
                    // A more advanced implementation could use a callback to update the final content with sources.
                }
            }).catch(e => console.error("Could not fetch sources for streamed content:", e));

            return processedResult;
        } else {
            const response = await callGroundedGenerationApi(prompt, onRetry);
            const textResponse = response.text;
            const generatedData = processGroundedResponse(textResponse, title);
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }))
                .filter(source => source.uri && source.title);
            generatedData.sources = sources;
            return generatedData;
        }
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
    const videoPrompt = getVideoPrompt(prompt, language);
    
    // callVideoGenerationApi will now handle the status updates internally.
    const resultUrl = await callVideoGenerationApi(videoPrompt, onRetry, onStatusUpdate);

    return resultUrl;
};