// FIX: Migrated from Firebase Functions v1 to v2 to resolve type errors and modernise the syntax.
// This addresses errors related to 'auth', 'toolId', 'inputs', and 'runWith' properties by adopting
// the v2 request-response model for both onCall and onRequest triggers.
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { GoogleGenAI, GenerateContentParameters } from "@google/genai";

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

/** A constant instruction appended to prompts that require a JSON response. */
const JSON_FORMAT_INSTRUCTION = `
IMPORTANT: Your entire response must be a single, valid JSON object, without any markdown formatting like \`\`\`json. The JSON object must have a "title" property (string) and a "sections" property (an array of objects). Each object in the "sections" array must have a "heading" property (string) and a "content" property (string or an array of strings).`;

/**
 * Generates the appropriate prompt or content parts for a given tool and its inputs.
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
      return `Generate a comprehensive SEO content brief for the topic: "${inputs.topic}". Include sections for target keywords (primary and secondary), search intent analysis, recommended content structure with H2/H3 headings, and key questions to answer.`;
    case 'influencer_discovery':
      return `Find 5 micro-influencers (5k-50k followers) in ${inputs.city} for the niche "${inputs.field}". For each influencer, provide their Instagram handle, a brief description of their content, and why they are a good fit. Use the handle for the section heading. Set the main title to "Micro-Influencers in ${inputs.city} for ${inputs.field}".${JSON_FORMAT_INSTRUCTION}`;
    case 'social_media_optimizer':
      return `Create a social media growth strategy for a company in the "${inputs.field}" industry. Provide 3 actionable content ideas, suggest the best platforms to focus on, and recommend optimal posting times. Set the main title to "Social Media Strategy for ${inputs.field}" and use "Actionable Content Ideas", "Recommended Platforms", and "Optimal Posting Times" as section headings.${JSON_FORMAT_INSTRUCTION}`;
    case 'video_script_assistant':
      return `Write an engaging 30-45 second video script for the following idea: "${inputs.idea}". The script should have a strong hook, a clear body, and a call-to-action. Format it with scene descriptions and dialogue. Set the main title to "Video Script: ${inputs.idea}" and create sections for "Hook", "Scene 1", "Call to Action", etc.${JSON_FORMAT_INSTRUCTION}`;
    case 'short_form_factory':
      if (inputs.image) {
        const image = inputs.image as ImageInput;
        return {
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.base64 } },
            { text: `Generate 3 creative short-form video ideas based on this product image. For each idea, provide a title, a brief concept, and a suggested audio track. Set the main title to "Video Ideas for Product" and use "Idea 1", "Idea 2", etc. as section headings.${JSON_FORMAT_INSTRUCTION}` },
          ],
        };
      }
      return `Repurpose the following long-form content into 3 short-form video ideas. For each idea, pull out a key quote or concept to be the hook. Set the main title to "Short-Form Video Ideas" and use "Idea 1", "Idea 2", etc. as section headings. Content: "${inputs.source_text}"${JSON_FORMAT_INSTRUCTION}`;
    case 'smm_content_plan':
      return `Generate a 7-day social media content plan for ${inputs.platform} focusing on the topic "${inputs.topic}". For each day, provide a content theme, a specific post idea, and a suggested caption. Set the main title to "7-Day Content Plan for ${inputs.platform}" and use "Day 1", "Day 2", etc. as section headings.${JSON_FORMAT_INSTRUCTION}`;
    case 'ads_ai_assistant':
      return `Generate 3 variations of ad copy for a product with this description: "${inputs.product}". The target audience is "${inputs.audience}". Include a compelling headline, body text, and a call-to-action for each variation. Set the main title to "Ad Copy Variations" and use "Variation 1", "Variation 2", etc. as section headings.${JSON_FORMAT_INSTRUCTION}`;
    case 'email_marketing':
      return `Write a marketing email for the following campaign goal: "${inputs.goal}". Include a catchy subject line, a personalized greeting, an engaging body, and a clear call-to-action button text. Set the main title to "Marketing Email Draft" and create sections for "Subject Line" and "Email Body".${JSON_FORMAT_INSTRUCTION}`;
    case 'customer_persona':
      return `Create a detailed customer persona based on this information. Product/Service: "${inputs.product_service}". Target Audience Details: "${inputs.target_audience_details}". The persona should include a name, demographics, goals, challenges, and motivations. Set the main title to the persona's name and create sections for "Demographics", "Goals", "Challenges", and "Motivations".${JSON_FORMAT_INSTRUCTION}`;
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
    
    const stringifiedContent = typeof contents === 'string' ? contents : JSON.stringify(contents);
    const needsJson = stringifiedContent.includes(JSON_FORMAT_INSTRUCTION);

    const config: any = { systemInstruction };
    
    if (needsGrounding) {
      config.tools = [{ googleSearch: {} }];
    } else if (needsJson) {
      // FIX: Set responseMimeType for tools that expect a JSON output.
      config.responseMimeType = "application/json";
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
 * An HTTP-triggered Cloud Function to generate video and stream it back.
 */
export const generateVideo = onRequest(
    // FIX: Corrected memory allocation unit from '1GB' to '1GiB' as required by Firebase Functions v2.
    { timeoutSeconds: 540, memory: '1GiB', cors: true },
    // FIX: Added explicit types for 'req' and 'res' to resolve type inference issues. This ensures that
    // the correct properties (like 'headers', 'status', 'body') are available and type-checked correctly.
    async (req: import("firebase-functions/v2/https").Request, res: import("express").Response) => {
    
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
