import { GeneratedContentData } from "../../types.ts";

/**
 * Parses a raw JSON string from the Gemini API into a structured `GeneratedContentData` object.
 * This function is robust and handles potential parsing errors gracefully.
 * It also intelligently converts bullet-point-like strings into arrays.
 *
 * @param rawJson The raw string response from the API, expected to be JSON.
 * @returns A structured `GeneratedContentData` object.
 * @throws An error if parsing fails or the response is invalid.
 */
export const processJsonResponse = (rawJson: string): GeneratedContentData => {
    if (!rawJson || typeof rawJson !== 'string') {
        throw new Error("Invalid or empty response from the AI model.");
    }

    try {
        const data = JSON.parse(rawJson.trim()) as GeneratedContentData;

        // Post-process sections to convert string content that looks like a list into an actual array.
        data.sections = data.sections.map(section => {
            if (typeof section.content === 'string') {
                const lines = section.content.split('\n').map(line => line.trim()).filter(Boolean);
                // Check if the content looks like a Markdown-style list
                if (lines.length > 1 && lines.every(line => line.startsWith('- ') || line.startsWith('* '))) {
                    return { 
                        ...section, 
                        content: lines.map(line => line.substring(2).trim()), 
                    };
                }
            }
            return section;
        });

        return data;
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", e, "\nRaw JSON:", rawJson);
        throw new Error("The AI model returned a response in an unexpected format. Please try generating again.");
    }
};

/**
 * Processes a response from a grounded (Google Search) model call.
 * Since these responses are plain text, this function wraps the text in
 * the standard `GeneratedContentData` structure for consistent display.
 *
 * @param text The plain text response from the grounded model.
 * @param title A title for the generated content card.
 * @returns A structured `GeneratedContentData` object.
 */
export const processGroundedResponse = (text: string, title: string): GeneratedContentData => {
    return {
        title: title,
        sections: [{ heading: 'AI-Generated Analysis', content: text.trim() }],
    };
};