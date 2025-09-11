// =================================================================
// START INLINED DEPENDENCIES
// To fix a critical and persistent deployment issue caused by a fragile build configuration,
// all shared frontend code required by this backend function has been merged into this single file.
// This ensures the function is self-contained and deploys reliably.
// =================================================================

// --- Start of inlined types.ts ---
interface InputField {
  name: string;
  type: 'text' | 'textarea' | 'image';
  labelKey: string;
  placeholderKey: string;
}

interface Tool {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  categoryKey: string;
  inputs: InputField[];
}
// --- End of inlined types.ts ---


// --- Start of inlined constants.ts ---
const TOOLS: Tool[] = [
  // Category: Audience Growth & Strategy
  {
    id: 'seo_assistant',
    nameKey: 'seo_assistant_name',
    descriptionKey: 'seo_assistant_desc',
    icon: 'fa-solid fa-magnifying-glass-chart',
    categoryKey: 'audience_growth_strategy',
    inputs: [
      { name: 'topic', type: 'text', labelKey: 'topic_label', placeholderKey: 'seo_placeholder' },
    ],
  },
  {
    id: 'influencer_discovery',
    nameKey: 'influencer_discovery_name',
    descriptionKey: 'influencer_discovery_desc',
    icon: 'fa-solid fa-users-rays',
    categoryKey: 'audience_growth_strategy',
    inputs: [
      { name: 'city', type: 'text', labelKey: 'city_label', placeholderKey: 'city_placeholder' },
      { name: 'field', type: 'text', labelKey: 'field_label', placeholderKey: 'field_placeholder' },
    ],
  },
  {
    id: 'social_media_optimizer',
    nameKey: 'social_media_optimizer_name',
    descriptionKey: 'social_media_optimizer_desc',
    icon: 'fa-solid fa-arrow-trend-up',
    categoryKey: 'audience_growth_strategy',
    inputs: [
      { name: 'field', type: 'text', labelKey: 'your_industry_label', placeholderKey: 'industry_placeholder' },
    ],
  },
  // Category: Creative Content Generation
  {
    id: 'video_script_assistant',
    nameKey: 'video_script_assistant_name',
    descriptionKey: 'video_script_assistant_desc',
    icon: 'fa-solid fa-clapperboard',
    categoryKey: 'content_creation',
    inputs: [
      { name: 'idea', type: 'textarea', labelKey: 'video_idea_label', placeholderKey: 'video_idea_placeholder' },
    ],
  },
  {
    id: 'short_form_factory',
    nameKey: 'short_form_factory_name',
    descriptionKey: 'short_form_factory_desc',
    icon: 'fa-solid fa-wand-magic-sparkles',
    categoryKey: 'content_creation',
    inputs: [
        { name: 'source_text', type: 'textarea', labelKey: 'long_form_content_label', placeholderKey: 'long_form_content_placeholder' },
        { name: 'image', type: 'image', labelKey: 'or_upload_product_image_label', placeholderKey: '' },
    ],
  },
  {
    id: 'smm_content_plan',
    nameKey: 'smm_content_plan_name',
    descriptionKey: 'smm_content_plan_desc',
    icon: 'fa-solid fa-calendar-week',
    categoryKey: 'content_creation',
    inputs: [
      { name: 'platform', type: 'text', labelKey: 'platform_label', placeholderKey: 'platform_placeholder' },
      { name: 'topic', type: 'text', labelKey: 'topic_label', placeholderKey: 'smm_topic_placeholder' },
    ],
  },
  {
    id: 'video_generator',
    nameKey: 'ai_video_generator_name',
    descriptionKey: 'ai_video_generator_desc',
    icon: 'fa-solid fa-film',
    categoryKey: 'content_creation',
    inputs: [
      { name: 'prompt', type: 'textarea', labelKey: 'video_idea_label', placeholderKey: 'video_generator_placeholder' },
    ],
  },
  // Category: Campaign & Outreach
  {
    id: 'ads_ai_assistant',
    nameKey: 'ads_ai_assistant_name',
    descriptionKey: 'ads_ai_assistant_desc',
    icon: 'fa-solid fa-bullhorn',
    categoryKey: 'campaign_management',
    inputs: [
      { name: 'product', type: 'textarea', labelKey: 'product_description_label', placeholderKey: 'product_description_placeholder' },
      { name: 'audience', type: 'text', labelKey: 'target_audience_label', placeholderKey: 'target_audience_placeholder' },
    ],
  },
  {
    id: 'email_marketing',
    nameKey: 'email_marketing_name',
    descriptionKey: 'email_marketing_desc',
    icon: 'fa-solid fa-envelope-open-text',
    categoryKey: 'campaign_management',
    inputs: [
      { name: 'goal', type: 'textarea', labelKey: 'campaign_goal_label', placeholderKey: 'campaign_goal_placeholder' },
    ],
  },
  {
    id: 'customer_persona',
    nameKey: 'customer_persona_name',
    descriptionKey: 'customer_persona_desc',
    icon: 'fa-solid fa-user-astronaut',
    categoryKey: 'campaign_management',
    inputs: [
      { name: 'product_service', type: 'textarea', labelKey: 'product_service_label', placeholderKey: 'product_service_placeholder' },
      { name: 'target_audience_details', type: 'textarea', labelKey: 'target_audience_details_label', placeholderKey: 'target_audience_details_placeholder' },
    ],
  },
];
// --- End of inlined constants.ts ---


// --- Start of inlined services/gemini/prompts.ts ---
import { GenerateContentParameters } from '@google/genai';

interface ImageInputForPrompt {
  base64: string;
  mimeType: string;
}

const JSON_FORMAT_INSTRUCTION = `
IMPORTANT: Your entire response must be a single, valid JSON object, without any markdown formatting like \`\`\`json. The JSON object must have a "title" property (string) and a "sections" property (an array of objects). Each object in the "sections" array must have a "heading" property (string) and a "content" property (string or an array of strings).`;

const getPrompt = (
  toolId: string,
  inputs: Record<string, string | ImageInputForPrompt>
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
        const image = inputs.image as ImageInputForPrompt;
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
// --- End of inlined services/gemini/prompts.ts ---

// =================================================================
// ORIGINAL index.ts LOGIC - MIGRATED TO FUNCTIONS V2
// =================================================================

// FIX: Import Request and Response types and alias them to avoid conflicts with global DOM types.
import { onCall, onRequest, HttpsError, Request as FunctionsRequest, Response as FunctionsResponse } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import cors from "cors";
import { GoogleGenAI, GenerateContentResponse, GenerateVideosOperation } from '@google/genai';

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

const corsHandler = cors({origin: true});

// The API_KEY is now managed by Firebase Secret Manager and automatically
// populated into process.env.
if (!process.env.API_KEY) {
    console.error("API_KEY not set in function environment. Please set the secret using `firebase functions:secrets:set API_KEY`");
    throw new Error("API_KEY not configured.");
}
const genAI = new GoogleGenAI({apiKey: process.env.API_KEY!});


interface ApiImageInput {
  base64: string;
  mimeType: string;
}

const callGeminiBackend = async (
  tool: Tool,
  inputs: Record<string, string | ApiImageInput>
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

const callVideoGeneratorBackend = async (prompt: string): Promise<GenerateVideosOperation> => {
    const operation = await genAI.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: { numberOfVideos: 1 }
    });
    return operation;
};

const checkVideoOperationBackend = async (operation: GenerateVideosOperation): Promise<GenerateVideosOperation> => {
    const updatedOperation = await genAI.operations.getVideosOperation({ operation: operation });
    return updatedOperation;
}

export const generateContent = onCall({ secrets: ["API_KEY"] }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { toolId, inputs } = request.data;
    if (!toolId || !inputs) {
        throw new HttpsError("invalid-argument", "Missing 'toolId' or 'inputs'.");
    }
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) {
        throw new HttpsError("not-found", `Tool with id ${toolId} not found.`);
    }

    try {
        if (tool.id === 'seo_assistant') {
            const prompt = getPrompt(tool.id, inputs) as string;
            const response = await callGeminiWithGroundingBackend(prompt);
            const text = response.text;
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
            return { text, sources };
        } else {
            const response = await callGeminiBackend(tool, inputs as Record<string, string | ApiImageInput>);
            const text = response.text;
            return { text };
        }
    } catch (error: any) {
        console.error("Error calling Gemini API:", JSON.stringify(error));
        throw new HttpsError("internal", "An error occurred with the AI model.", error.message);
    }
});


// FIX: Explicitly type `req` and `res` to ensure the correct Firebase Functions types are used.
export const generateVideo = onRequest({ timeoutSeconds: 540, memory: "1GiB", secrets: ["API_KEY"] }, (req: FunctionsRequest, res: FunctionsResponse) => {
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
                operation = await checkVideoOperationBackend(operation);
            }

            if (operation.error) {
                throw new Error(String(operation.error.message || 'Video generation failed with an unknown error.'));
            }
            
            const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!videoUri) {
                throw new Error("Video generation completed but no URI was found.");
            }
            
            const downloadableUrl = `${videoUri}&key=${process.env.API_KEY}`;
            
            const videoResponse = await fetch(downloadableUrl);

            if (!videoResponse.ok) {
                throw new Error(`Failed to fetch video file: ${videoResponse.statusText}`);
            }

            if (!videoResponse.body) {
                throw new Error("Video response body is null.");
            }
            
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

        } catch (error: any) {
            console.error("Error during video generation:", error);
            res.status(500).send(`Internal Server Error: ${error.message}`);
        }
    });
});
