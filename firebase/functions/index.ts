// FIX: Migrated from Firebase Functions v1 to v2 to resolve type errors and modernise the syntax.
// This addresses errors related to 'auth', 'toolId', 'inputs', and 'runWith' properties by adopting
// the v2 request-response model for both onCall and onRequest triggers.
// FIX: Importing `Request` from firebase-functions/v2/https for strongly-typed HTTP request objects, resolving type conflicts.
// FIX: Aliased `Request` to `FunctionsRequest` to prevent collision with the global DOM `Request` type.
import { onCall, onRequest, HttpsError, Request as FunctionsRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
// FIX: Import `Type` to define a response schema for reliable JSON output.
import { GoogleGenAI, GenerateContentParameters, Type } from "@google/genai";
// FIX: Import express types to resolve ambiguity with global Request/Response types from DOM lib.
// Aliased imports to prevent any possible conflict with global types.
// FIX: Imported `Request` from express to correctly type the `onRequest` handler's request object.
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get API key from environment variables.
if (!process.env.API_KEY) {
  logger.error("API_KEY environment variable not set. Please set it in your Firebase Functions environment configuration.");
  throw new Error("API_KEY environment variable not set.");
}
// FIX: Initialize GoogleGenAI with a named apiKey parameter as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- Start of logic similar to client-side services/gemini/prompts.ts ---

/** Type definition for image data sent from the client. */
interface ImageInput {
    base64: string;
    mimeType: string;
}

/**
 * Defines a standard response schema for tools that should return structured JSON.
 * Using a schema is the most reliable way to enforce a specific JSON output format.
 */
const standardJsonResponseSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The main title of the generated content.",
        },
        sections: {
            type: Type.ARRAY,
            description: "An array of content sections.",
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: {
                        type: Type.STRING,
                        description: "The heading for this section.",
                    },
                    content: {
                        type: Type.STRING,
                        description: "The main content for this section. Can be a single paragraph or multiple points separated by newlines.",
                    },
                },
                required: ["heading", "content"],
            },
        },
    },
    required: ["title", "sections"],
};


/**
 * Generates the appropriate prompt or content parts for a given tool and its inputs.
 * The prompts have been rephrased to request data components rather than complete
 * documents, which improves the reliability of receiving structured JSON output.
 * @param toolId The unique identifier of the tool.
 * @param inputs The user-provided data for the tool.
 * @returns The prompt string or content object for the Gemini API.
 */
const getPrompt = (
  toolId: string,
  inputs: Record<string, string | ImageInput>
): string | GenerateContentParameters['contents'] => {
  switch (toolId) {
    case 'seo_assistant':
      return `For the topic "${inputs.topic}", generate data for an SEO strategy. The response title should be "SEO Strategy: ${inputs.topic}". Create distinct sections containing the following information: a list of primary and secondary target keywords; an analysis of the primary search intent; a recommended H1/H2/H3 content structure for a blog post; and a list of key questions the content must answer.`;
    case 'influencer_discovery':
      return `Find 5 micro-influencers (5k-50k followers) in ${inputs.city} for the niche "${inputs.field}". For each influencer, provide their Instagram handle, a brief description of their content, and why they are a good fit.`;
    case 'social_media_optimizer':
      return `Create a social media growth strategy for a company in the "${inputs.field}" industry. Provide 3 actionable content ideas, suggest the best platforms to focus on, and recommend optimal posting times.`;
    case 'video_script_assistant':
      return `Generate the components for a 30-45 second video script based on the idea: "${inputs.idea}". The title should be "Video Script: ${inputs.idea}". Provide sections for: a "Hook" to grab attention; "Scenes" with visual descriptions and dialogue; and a final "Call to Action".`;
    case 'short_form_factory':
      if (inputs.image) {
        const image = inputs.image as ImageInput;
        return {
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.base64 } },
            { text: `Analyze the provided product image and generate 3 distinct ideas for short-form videos. The title should be "Video Ideas for Product". For each idea, create a section describing the video concept and suggesting a suitable audio track.` },
          ],
        };
      }
      return `From the provided long-form content, extract 3 distinct ideas for short-form videos. The title should be "Short-Form Video Ideas". For each idea, create a section detailing the core concept and a suggested "hook" from the original text. Content: "${inputs.source_text}"`;
    case 'smm_content_plan':
      return `Create a dataset for a 7-day social media schedule for ${inputs.platform} on the topic "${inputs.topic}". The title should be "7-Day Content Plan for ${inputs.platform}". For each day (Day 1 to Day 7), provide the following data points: a content theme, a specific post idea, and a suggested caption.`;
    case 'ads_ai_assistant':
      return `For a product described as "${inputs.product}" targeting "${inputs.audience}", generate 3 distinct ad copy variations. The title should be "Ad Copy Variations". Each variation (e.g., "Variation 1") should be a section containing a headline, body text, and a call-to-action.`;
    case 'email_marketing':
      return `Generate the components for a marketing email intended to "${inputs.goal}". The title should be "Marketing Email Draft". Provide sections for the "Subject Line" and the "Email Body", ensuring the body includes a clear call-to-action.`;
    case 'customer_persona':
      return `Based on the product/service "${inputs.product_service}" and audience details "${inputs.target_audience_details}", generate a detailed customer persona profile. The persona's name should be the main title. The profile must include sections for: Demographics, Goals, Challenges, and Motivations.`;
    default:
      throw new Error(`Unknown tool ID provided: ${toolId}`);
  }
};

/**
 * Provides a system instruction to the AI model to set its persona for a specific task.
 * @param toolId The unique identifier of the tool.
 * @returns A string containing the system instruction.
 */
const getSystemInstruction = (toolId: string): string => {
  switch (toolId) {
    case 'seo_assistant':
      return 'You are an expert SEO strategist and content planner. Provide detailed, actionable advice.';
    case 'influencer_discovery':
      return 'You are a talent scout specializing in social media influencers. Focus on authenticity and engagement metrics.';
    case 'social_media_optimizer':
      return 'You are a social media marketing manager with a track record of growing online communities. Your advice is creative and data-driven.';
    case 'video_script_assistant':
    case 'short_form_factory':
      return 'You are a creative director and scriptwriter specializing in viral short-form video content for platforms like TikTok and Instagram Reels.';
    case 'smm_content_plan':
      return 'You are a content calendar specialist. You create structured, engaging, and platform-specific content plans.';
    case 'ads_ai_assistant':
      return 'You are a direct-response copywriter who excels at writing high-converting ad copy. Your tone is persuasive and clear.';
    case 'email_marketing':
      return 'You are an email marketing expert who crafts emails that get opened, read, and clicked.';
    case 'customer_persona':
      return 'You are a market researcher and strategist. You create rich, detailed customer personas to guide marketing efforts.';
    default:
      return 'You are a helpful marketing assistant. Your goal is to provide creative and strategic content for marketing professionals.';
  }
};

// --- End of prompt logic ---


/**
 * A callable Cloud Function to generate content using the Gemini API.
 */
export const generateContent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { toolId, inputs } = request.data;

  if (!toolId || !inputs) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with 'toolId' and 'inputs' arguments."
    );
  }

  try {
    const contents = getPrompt(toolId, inputs);
    const systemInstruction = getSystemInstruction(toolId);
    
    // Some tools can benefit from real-time information via Google Search grounding.
    const needsGrounding = ['influencer_discovery', 'social_media_optimizer'].includes(toolId);
    
    // All other tools are expected to return structured JSON.
    const needsJson = !needsGrounding;

    const config: any = { systemInstruction };
    
    if (needsGrounding) {
      config.tools = [{ googleSearch: {} }];
    } else if (needsJson) {
      // Use the robust responseSchema to enforce JSON output.
      config.responseMimeType = "application/json";
      config.responseSchema = standardJsonResponseSchema;
    }
    
    // FIX: Correctly call the Gemini API using `ai.models.generateContent`.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config,
    });
    
    // FIX: Correctly extract text and grounding metadata from the response.
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter(Boolean); // Filter out any empty/undefined chunks

    return { text, sources };

  } catch (error) {
    logger.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new HttpsError("internal", error.message, error.stack);
    }
    throw new HttpsError("internal", "An unexpected error occurred.");
  }
});

/**
 * A callable Cloud Function to generate an image using the Gemini API.
 */
export const generateImage = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { prompt } = request.data;
    if (!prompt || typeof prompt !== 'string') {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with a 'prompt' string argument."
        );
    }

    try {
        logger.info("Generating image with prompt:", prompt);
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        
        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new HttpsError("not-found", "The model did not generate any images.");
        }
        
        const base64Image = response.generatedImages[0].image.imageBytes;
        return { base64Image };

    } catch (error) {
        logger.error("Error calling Gemini Image API:", error);
        if (error instanceof Error) {
            throw new HttpsError("internal", error.message, error.stack);
        }
        throw new HttpsError("internal", "An unexpected error occurred during image generation.");
    }
});


/**
 * An HTTP-triggered Cloud Function to generate video and stream it back.
 */
export const generateVideo = onRequest(
    // FIX: Corrected memory allocation unit from '1GB' to '1GiB' as required by Firebase Functions v2.
    { timeoutSeconds: 540, memory: '1GiB', cors: true },
    // FIX: Corrected the type for the `req` object to use `ExpressRequest` from the 'express' package.
    // The previous type `FunctionsRequest` was for `onCall` functions and lacked necessary HTTP properties,
    // causing errors. This also resolves related type inference issues for the `res` object.
    async (req: ExpressRequest, res: ExpressResponse) => {
    
    // Verify authentication
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        res.status(403).send('Unauthorized');
        return;
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        res.status(403).send('Unauthorized');
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const { prompt } = req.body;
    if (!prompt) {
        res.status(400).send('Bad Request: prompt is missing.');
        return;
    }
    
    try {
        // FIX: Use the correct model name 'veo-2.0-generate-001' for video generation.
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
            },
        });

        // Poll the operation status until it's complete
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }
        
        // FIX: Fetch the generated video by appending the API key to the URI.
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        
        if (!videoResponse.ok || !videoResponse.body) {
            throw new Error(`Failed to download the generated video. Status: ${videoResponse.status}`);
        }
        
        // Stream the video back to the client
        res.setHeader('Content-Type', 'video/mp4');
        const reader = videoResponse.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            res.write(value);
        }
        res.end();

    } catch (error) {
        logger.error('Video generation failed:', error);
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred during video generation.');
        }
    }
});