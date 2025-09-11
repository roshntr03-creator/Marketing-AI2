import { functions, auth, httpsCallable, firebaseConfig } from '../../lib/firebaseClient.ts';
import { GeneratedContentData } from '../../types';

/** Type definition for image data sent to the backend. */
export interface ImageInput {
    base64: string;
    mimeType: string;
}

const generateContentFunction = httpsCallable(functions, 'generateContent');

/**
 * Converts a File object to a base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Calls the `generateContent` Firebase Function. It handles both text-based
 * and image-based tools by converting files to base64 before sending.
 * @param toolId The ID of the tool being used.
 * @param inputs The user inputs for the tool.
 * @returns The response data from the cloud function.
 */
export const callGenerateContentApi = async (toolId: string, inputs: Record<string, string | File>): Promise<{text: string, sources?: any[]}> => {
    const payload: { toolId: string, inputs: Record<string, string | ImageInput> } = { 
        toolId, 
        inputs: {} 
    };
    
    // Process inputs, converting files to base64
    for (const key in inputs) {
        const value = inputs[key];
        if (value instanceof File) {
            const base64 = await fileToBase64(value);
            payload.inputs[key] = { base64, mimeType: value.type };
        } else {
            payload.inputs[key] = value;
        }
    }
    
    const response = await generateContentFunction(payload);
    return response.data as {text: string, sources?: any[]};
};

/**
 * Calls the `generateVideo` Firebase Function. This function handles streaming
 * the video response from the server and returns a local blob URL for playback.
 * @param prompt The text prompt for video generation.
 * @returns A promise that resolves with a local blob URL for the generated video.
 * @throws An error if authentication fails or the server returns an error.
 */
export const generateVideoApi = async (prompt: string): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Authentication is required to generate videos.");
    }
    const token = await user.getIdToken();

    // The URL is constructed dynamically from the Firebase project config.
    const functionUrl = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/generateVideo`;

    const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Video generation failed:", response.status, errorText);
        throw new Error(`Video generation failed: ${errorText || response.statusText}`);
    }

    const blob = await response.blob();
    if (blob.type !== 'video/mp4') {
        throw new Error('The server did not return a valid video file. Please try again.');
    }
    
    // Create a local URL for the video blob to be used in the <video> tag.
    return URL.createObjectURL(blob);
};