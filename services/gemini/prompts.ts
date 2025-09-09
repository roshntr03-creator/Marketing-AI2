import { Language } from "../../types.ts";

export const getGroundedPrompt = (toolId: string, inputs: Record<string, string>, language: Language): { prompt: string, title: string } => {
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
                ? `أنت خبير تسويق رقمي متخصص في اكتشاف المؤثرين. بناءً على خبرتك وأحدث اتجاهات السوق في ${inputs.city}، قدم تحليلاً شاملاً لأفضل 5 مؤثرين في مجال ${inputs.field}. 

لكل مؤثر، قدم:
**المنصة الرئيسية:** [انستغرام/تيك توك/يوتيوب]

For each influencer, provide:
**Primary Platform:** [Instagram/TikTok/YouTube]
**Collaboration Strategy:** [How to work with them]
        case 'social_media_optimizer':
            title = isArabic ? `استراتيجية تواصل اجتماعي لمجال ${inputs.field}` : `Social Media Strategy for ${inputs.field}`;
    }
export const getJsonPrompt = (toolId: string, inputs: Record<string, string>, language: Language, hasImage: boolean): string => {
    let userPrompt = '';
                : `Write a detailed video script based on the following idea: "${inputs.idea}". The script should include sections for an introduction, the main content (broken down into scenes or key points), and an outro with a call to action. Include suggestions for visuals or on-screen actions.`;
                    ? `حوّل المحتوى الطويل التالي إلى 3 أفكار لمقاطع فيديو قصيرة. لكل فكرة، قدم عنوانًا جذابًا، ومفهومًا موجزًا، ومرئيًا مقترحًا. المحتوى: "${inputs.source_text}"`
                    : `Transform the following long-form content into 3 short-form video ideas. For each idea, provide a catchy title, a brief concept, and a suggested visual. Content: "${inputs.source_text}"`;
            } else if (hasImage) {
                 userPrompt = isArabic
                 throw new Error(isArabic ? "يرجى تقديم محتوى طويل أو تحميل صورة." : "Please provide either long-form content or upload an image.");
                ? `أنشئ خطة محتوى لوسائل التواصل الاجتماعي لمدة 7 أيام لمنصة ${inputs.platform} حول موضوع "${inputs.topic}". لكل يوم، قدم فكرة للمحتوى، وتعليقًا، وهاشتاجات ذات صلة.`
            userPrompt = isArabic
        case 'email_marketing':
            break;
            break;
    return `${systemInstruction}\n\nUser Request: ${userPrompt}`;
    return language === 'ar'
    }
}