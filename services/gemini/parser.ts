import { GenerateContentResponse } from "@google/genai";
import { GeneratedContentData } from "../../types";

export const processJsonResponse = (response: GenerateContentResponse): GeneratedContentData => {
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

export const processGroundedResponse = (text: string, title: string): GeneratedContentData => {
    return {
        title: title,
        sections: [{ heading: 'AI-Generated Analysis', content: text.trim() }],
    };
};
