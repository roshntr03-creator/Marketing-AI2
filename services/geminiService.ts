import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GeneratedContentData, Language } from "../types";

export const isGeminiAvailable = !!process.env.API_KEY;

const ai = isGeminiAvailable ? new GoogleGenAI({ apiKey: process.env.API_KEY as string }) : null;
const textModel = 'gemini-2.5-flash';
const groundedTools = ['seo_assistant', 'influencer_discovery', 'social_media_optimizer'];

const UNAVAILABLE_ERROR = "AI Service is not configured. The API_KEY environment variable is missing.";

const responseSchema = {
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

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const processJsonResponse = (response: GenerateContentResponse): GeneratedContentData => {
    try {
        const rawJson = response.text;
        if (!rawJson) {
            throw new Error("Empty response from API.");
        }
        const data = JSON.parse(rawJson) as GeneratedContentData;

        data.sections = data.sections.map(section => {
            if (typeof section.content === 'string') {
                const lines = section.content.split('\n').filter(line => line.trim().length > 0);
                if (lines.length > 1 && lines.every(line => line.trim().startsWith('- '))) {
                    return { ...section, content: lines.map(line => line.trim().substring(2).trim()), };
                }
            }
            return section;
        });

        return data;
    } catch (e) {
        console.error("Failed to parse Gemini response:", e, response.text);
        throw new Error("Failed to parse AI response. Please try again.");
    }
};

const processGroundedResponse = (text: string, title: string): GeneratedContentData => {
    return {
        title: title,
        sections: [{ heading: 'AI-Generated Analysis', content: text.trim() }],
    };
};

const getGroundedPrompt = (toolId: string, inputs: Record<string, string>, language: Language): { prompt: string, title: string } => {
    let prompt = '';
    let title = '';
    const isArabic = language === 'ar';

    switch (toolId) {
        case 'seo_assistant':
            prompt = isArabic 
                ? `بناءً على أحدث نتائج بحث الويب لموضوع "${inputs.topic}"، قم بإنشاء ملخص محتوى شامل لتحسين محركات البحث. قدم تحليلاً مفصلاً يتضمن عنوانًا جذابًا، ووصفًا ميتا أقل من 160 حرفًا، وقائمة بما لا يقل عن 10 كلمات رئيسية ذات صلة، وهيكل محتوى مقترح مع عناوين H2 و H3. قم بتنظيم الاستجابة بعناوين ماركداون واضحة.`
                : `Based on the latest web search results for the topic "${inputs.topic}", generate a comprehensive SEO content brief. Provide a detailed analysis including a compelling title, a meta description under 160 characters, a list of at least 10 relevant keywords, and a suggested content structure with H2 and H3 headings. Structure the response with clear markdown headings.`;
            title = isArabic ? `ملخص SEO: ${inputs.topic}` : `SEO Brief: ${inputs.topic}`;
            break;
        case 'influencer_discovery':
            prompt = isArabic
                ? `بناءً على أحدث نتائج بحث الويب، ابحث عن أفضل 5 مؤثرين محليين في ${inputs.city} في مجال ${inputs.field}. لكل مؤثر، قدم اسمه/معرفه، ووصفًا موجزًا لمحتواه، ولماذا هو مناسب. قدم النتيجة بتنسيق ماركداون واضح وسهل القراءة.`
                : `Based on the latest web search results, find the top 5 local influencers in ${inputs.city} for the ${inputs.field} niche. For each influencer, provide their name/handle, a brief description of their content, and why they are a good fit. Present the result in a clear, easy-to-read markdown format.`;
            title = isArabic ? `مؤثرون في ${inputs.city} لمجال ${inputs.field}` : `Influencers in ${inputs.city} for ${inputs.field}`;
            break;
        case 'social_media_optimizer':
            prompt = isArabic
                ? `بناءً على أحدث نتائج بحث الويب للاتجاهات في صناعة ${inputs.field}، أنشئ استراتيجية نمو لوسائل التواصل الاجتماعي. قم بتضمين أقسام للجمهور المستهدف، وركائز المحتوى، ونصائح خاصة بالمنصات (لإنستغرام، تيك توك، و X)، واستراتيجية دعوة لاتخاذ إجراء. قدم النتيجة بتنسيق ماركداون واضح وسهل القراءة.`
                : `Based on the latest web search results for trends in the ${inputs.field} industry, create a social media growth strategy. Include sections for target audience, content pillars, platform-specific tips (for Instagram, TikTok, and X), and a call-to-action strategy. Present the result in a clear, easy-to-read markdown format.`;
            title = isArabic ? `استراتيجية تواصل اجتماعي لمجال ${inputs.field}` : `Social Media Strategy for ${inputs.field}`;
            break;
        default:
             throw new Error(`Unknown grounded tool ID: ${toolId}`);
    }
    return { prompt, title };
};

const getJsonPrompt = (toolId: string, inputs: Record<string, string>, language: Language): string => {
    const isArabic = language === 'ar';
    const systemInstruction = isArabic
        ? `أنت مساعد تسويق خبير. هدفك هو تقديم محتوى موجز وعملي ومبتكر بناءً على طلب المستخدم. قم دائمًا بإرجاع الاستجابة بتنسيق JSON المطلوب، باتباع المخطط المقدم. يجب أن تكون الاستجابة بالكامل باللغة العربية.`
        : `You are an expert marketing assistant. Your goal is to provide concise, actionable, and creative content based on the user's request. Always return the response in the requested JSON format, following the provided schema.`;
    
    let userPrompt = '';

    switch (toolId) {
        // Fix: Added case for 'video_script_assistant' which was missing, causing a runtime error.
        case 'video_script_assistant':
            userPrompt = isArabic
                ? `اكتب نص فيديو مفصل بناءً على الفكرة التالية: "${inputs.idea}". يجب أن يتضمن النص أقسامًا للمقدمة، والمحتوى الرئيسي (مقسم إلى مشاهد أو نقاط رئيسية)، والخاتمة مع دعوة لاتخاذ إجراء. قم بتضمين اقتراحات للمرئيات أو الإجراءات على الشاشة.`
                : `Write a detailed video script based on the following idea: "${inputs.idea}". The script should include sections for an introduction, the main content (broken down into scenes or key points), and an outro with a call to action. Include suggestions for visuals or on-screen actions.`;
            break;
        case 'short_form_factory':
            if (inputs.source_text) {
                userPrompt = isArabic
                    ? `حوّل المحتوى الطويل التالي إلى 3 أفكار لمقاطع فيديو قصيرة. لكل فكرة، قدم عنوانًا جذابًا، ومفهومًا موجزًا، ومرئيًا مقترحًا. المحتوى: "${inputs.source_text}"`
                    : `Transform the following long-form content into 3 short-form video ideas. For each idea, provide a catchy title, a brief concept, and a suggested visual. Content: "${inputs.source_text}"`;
            } else {
                 userPrompt = isArabic
                    ? `حلل صورة المنتج المقدمة وأنشئ 3 أفكار لمقاطع فيديو قصيرة للترويج لها. لكل فكرة، قدم عنوانًا جذابًا، ومفهومًا موجزًا، ومرئيًا مقترحًا.`
                    : `Analyze the provided product image and generate 3 short-form video ideas to promote it. For each idea, provide a catchy title, a brief concept, and a suggested visual.`;
            }
            break;
        case 'smm_content_plan':
            userPrompt = isArabic
                ? `أنشئ خطة محتوى لوسائل التواصل الاجتماعي لمدة 7 أيام لمنصة ${inputs.platform} حول موضوع "${inputs.topic}". لكل يوم، قدم فكرة للمحتوى، وتعليقًا، وهاشتاجات ذات صلة.`
                : `Generate a 7-day social media content plan for the platform ${inputs.platform} on the topic of "${inputs.topic}". For each day, provide a content idea, a caption, and relevant hashtags.`;
            break;
        case 'ads_ai_assistant':
            userPrompt = isArabic
                ? `أنشئ مجموعة من النصوص الإعلانية لحملة. المنتج هو: "${inputs.product}". الجمهور المستهدف هو: "${inputs.audience}". أنشئ عنوانًا، وأقسامًا لتنويعات النصوص الإعلانية (3 على الأقل)، وقائمة بالدعوات لاتخاذ إجراء المقنعة.`
                : `Create a set of ad copies for a campaign. The product is: "${inputs.product}". The target audience is: "${inputs.audience}". Generate a title, sections for Ad Copy Variations (at least 3), and a list of compelling Calls to Action.`;
            break;
        case 'email_marketing':
            userPrompt = isArabic
                ? `اكتب نصًا للتسويق عبر البريد الإلكتروني للهدف التالي: "${inputs.goal}". يجب أن يتضمن الناتج سطر موضوع جذاب، ونصًا مقنعًا، ودعوة واضحة لاتخاذ إجراء.`
                : `Write an email marketing copy for the following goal: "${inputs.goal}". The output should include a catchy subject line, a compelling body, and a clear call to action.`;
            break;
        case 'customer_persona':
            userPrompt = isArabic
                ? `أنشئ شخصية عميل مفصلة لشركة تبيع "${inputs.product_service}" إلى "${inputs.target_audience_details}". قم بتضمين أقسام للتركيبة السكانية، والأهداف، والتحديات، وسيرة ذاتية موجزة.`
                : `Create a detailed customer persona for a company that sells "${inputs.product_service}" to "${inputs.target_audience_details}". Include sections for Demographics, Goals, Challenges, and a brief Bio.`;
            break;
        default:
             throw new Error(`Unknown tool ID for JSON generation: ${toolId}`);
    }
    return `${systemInstruction}\n\nUser Request: ${userPrompt}`;
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
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                    const delaySeconds = Math.ceil(delay / 1000);
                    onRetry(delaySeconds);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } else {
                throw err; // Not a retriable error
            }
        }
    }
    throw lastError; // All retries failed
};

export const generateContentForTool = async (
    toolId: string,
    inputs: Record<string, string | File>,
    language: Language,
    onRetry: (delaySeconds: number) => void
): Promise<GeneratedContentData> => {
    if (!isGeminiAvailable || !ai) {
        throw new Error(UNAVAILABLE_ERROR);
    }

    const textInputs: Record<string, string> = {};
    const imageParts: any[] = [];
    
    for(const key in inputs) {
        if(typeof inputs[key] === 'string') {
            textInputs[key] = inputs[key] as string;
        } else if (inputs[key] instanceof File) {
            const imagePart = await fileToGenerativePart(inputs[key] as File);
            imageParts.push(imagePart);
        }
    }
    
    const apiCall = async (): Promise<GeneratedContentData> => {
        if (groundedTools.includes(toolId)) {
            const { prompt, title } = getGroundedPrompt(toolId, textInputs, language);
            const response = await ai.models.generateContent({
                model: textModel,
                contents: prompt,
                config: { tools: [{ googleSearch: {} }] },
            });
            const textResponse = response.text;
            const generatedData = processGroundedResponse(textResponse, title);
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }))
                .filter(source => source.uri && source.title);
            generatedData.sources = sources;
            return generatedData;
        }

        const prompt = getJsonPrompt(toolId, textInputs, language);
        const contents: any = { parts: [{ text: prompt }, ...imageParts] };
        const response = await ai.models.generateContent({
            model: textModel,
            contents: contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        return processJsonResponse(response);
    };

    return withRetry(apiCall, onRetry);
};

export const generateVideo = async (
    prompt: string,
    language: Language,
    onStatusUpdate: (status: string) => void,
    onRetry: (delaySeconds: number) => void
): Promise<string> => {
    if (!isGeminiAvailable || !ai) {
        throw new Error(UNAVAILABLE_ERROR);
    }

    onStatusUpdate('generating_video');

    const videoPrompt = language === 'ar'
        ? `أنشئ فيديو عالي الجودة بناءً على الفكرة التالية: "${prompt}"`
        : `Create a high-quality video based on the following idea: "${prompt}"`;


    const initialApiCall = () => ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: videoPrompt,
        config: { numberOfVideos: 1 }
    });

    const operation = await withRetry(initialApiCall, onRetry);

    onStatusUpdate('processing_video');
    
    let polledOperation = operation;
    while (!polledOperation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      polledOperation = await ai.operations.getVideosOperation({ operation: polledOperation });
    }

    const downloadLink = polledOperation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    
    // Fetch the video data and create a blob URL
    const fetchVideoApiCall = async () => {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        return response.blob();
    };

    try {
        const videoBlob = await withRetry(fetchVideoApiCall, onRetry);
        onStatusUpdate('video_ready');
        return URL.createObjectURL(videoBlob);
    } catch(e) {
        console.error("Failed to download video content", e);
        throw new Error("Failed to download the generated video. Please check your network and try again.");
    }
};