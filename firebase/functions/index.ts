// FIX: Use firebase-functions/v1 to align with v1 syntax like .region() and https.onCall.
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as cors from "cors";
// FIX: Import Request and Response from express to correctly type the onRequest handler and avoid global type conflicts.
// By aliasing them, we ensure there's no confusion with global Request/Response types from other libraries like DOM.
import { Request as ExpressRequest, Response as ExpressResponse } from "express";

// Assuming a monorepo setup where we can import from the root src folder.
// The build process must handle this.
// FIX: Import GenerateVideosOperation for video generation return types and remove unused Operation type.
import { GoogleGenAI, GenerateContentResponse, Type, GenerateContentParameters, GenerateVideosOperation } from '@google/genai';
import { TOOLS } from "../../constants";
import { getPrompt, getSystemInstruction } from "../../services/gemini/prompts";
import { Tool } from "../../types";

admin.initializeApp();

const regionalFunctions = functions.region("us-central1");
const corsHandler = cors({origin: true});

if (!process.env.API_KEY) {
    try {
        process.env.API_KEY = functions.config().gemini.key;
    } catch(e) {
        console.error("Failed to get gemini.key from firebase config");
    }
}
if (!process.env.API_KEY) {
    console.error("Gemini API Key is not set in environment variables or Firebase config.");
    // Throwing an error at initialization is better than at runtime.
    throw new Error("API_KEY not configured.");
}

// FIX: Initialize GoogleGenAI with named apiKey parameter.
const genAI = new GoogleGenAI({apiKey: process.env.API_KEY!});

interface ImageInput {
  base64: string;
  mimeType: string;
}

// Re-implementing API calls here to keep backend self-contained and secure.
const callGeminiBackend = async (
  tool: Tool,
  inputs: Record<string, string | ImageInput>
): Promise<GenerateContentResponse> => {
    const modelName = 'gemini-2.5-flash';
    const contentRequest = getPrompt(tool.id, inputs) as GenerateContentParameters['contents'];
    const systemInstruction = getSystemInstruction(tool.id);

    const response = await genAI.models.generateContent({
        model: modelName,
        contents: contentRequest,
        config: {
            systemInstruction: systemInstruction,
        }
    });
    return response;
};

const callGeminiWithGroundingBackend = async(prompt: string): Promise<GenerateContentResponse> => {
    const modelName = 'gemini-2.5-flash';
    const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    });
    return response;
};

// FIX: Specify the correct return type GenerateVideosOperation instead of the generic Operation.
const callVideoGeneratorBackend = async (prompt: string): Promise<GenerateVideosOperation> => {
    const operation = await genAI.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: { numberOfVideos: 1 }
    });
    return operation;
};

// FIX: Specify the correct return type GenerateVideosOperation instead of the generic Operation.
const checkVideoOperationBackend = async (operationName: string): Promise<GenerateVideosOperation> => {
    // FIX: The getVideosOperation method's type signature requires a full GenerateVideosOperation object,
    // but it only uses the 'name' property. Cast a minimal object to satisfy TypeScript.
    const operation = await genAI.operations.getVideosOperation({ operation: { name: operationName } as GenerateVideosOperation });
    return operation;
}

export const generateContent = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { toolId, inputs } = data;
    if (!toolId || !inputs) {
        throw new functions.https.HttpsError("invalid-argument", "Missing 'toolId' or 'inputs'.");
    }
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) {
        throw new functions.https.HttpsError("not-found", `Tool with id ${toolId} not found.`);
    }

    try {
        // Special handling for tools
        if (tool.id === 'seo_assistant') {
            const prompt = getPrompt(tool.id, inputs) as string;
            const response = await callGeminiWithGroundingBackend(prompt);
            const text = response.text;
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
            return { text, sources };
        } else {
            const response = await callGeminiBackend(tool, inputs as Record<string, string | ImageInput>);
            const text = response.text;
            return { text };
        }
    } catch (error: any) {
        console.error("Error calling Gemini API:", JSON.stringify(error));
        throw new functions.https.HttpsError("internal", "An error occurred with the AI model.", error.message);
    }
});


export const generateVideo = regionalFunctions
    .runWith({ timeoutSeconds: 540, memory: "1GB" })
    // FIX: Explicitly type request and response using aliases to avoid type conflicts with global fetch/DOM types,
    // which may be incorrectly included in the build environment. This ensures compatibility with cors middleware.
    .https.onRequest((req: ExpressRequest, res: ExpressResponse) => {
        corsHandler(req, res, async () => {
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            const idToken = req.headers.authorization?.split('Bearer ')[1];
            if (!idToken) {
                res.status(401).send('Unauthorized: No token provided.');
                return;
            }

            try {
                await admin.auth().verifyIdToken(idToken);
            } catch (error) {
                res.status(401).send('Unauthorized: Invalid token.');
                return;
            }

            const { prompt } = req.body;
            if (!prompt || typeof prompt !== 'string') {
                res.status(400).send('Bad Request: Missing or invalid prompt.');
                return;
            }

            try {
                let operation = await callVideoGeneratorBackend(prompt);

                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10s
                    operation = await checkVideoOperationBackend(operation.name);
                }

                if (operation.error) {
                    // FIX: Safely access the error message property and provide a fallback.
                    throw new Error(String(operation.error.message || 'Video generation failed with an unknown error.'));
                }
                
                const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (!videoUri) {
                    throw new Error("Video generation completed but no URI was found.");
                }
                
                const downloadableUrl = `${videoUri}&key=${process.env.API_KEY}`;
                
                // Fetch the video on the server to avoid exposing the key
                const videoResponse = await fetch(downloadableUrl);

                if (!videoResponse.ok) {
                    throw new Error(`Failed to fetch video file: ${videoResponse.statusText}`);
                }
                
                res.setHeader('Content-Type', 'video/mp4');
                (videoResponse.body as any).pipe(res);

            } catch (error: any) {
                console.error("Error during video generation:", error);
                res.status(500).send(`Internal Server Error: ${error.message}`);
            }
        });
    });
