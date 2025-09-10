import { functions, auth } from '../../lib/firebaseClient.ts';
import { firebaseConfig } from '../../lib/firebaseClient.ts';

// Type definition for image data sent to the backend.
export interface ImageInput {
    base64: string;
    mimeType: string;
}

const generateContentCallable = functions.httpsCallable('generateContent');

/**
 * Calls the `generateContent` Firebase Function for text-based tools.
 * @param toolId The ID of the tool being used.
 * @param inputs The user inputs for the tool.
 * @returns The response data from the cloud function.
 */
export const callGenerateContentApi = async (toolId: string, inputs: Record<string, string | File>) => {
    let payload: any = { toolId: toolId, inputs: {} };
    
    // Process inputs, converting files to base64
    for (const key in inputs) {
        if (inputs[key] instanceof File) {
            const file = inputs[key] as File;
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = (error) => reject(error);
            });
            payload.inputs[key] = {
                base64,
                mimeType: file.type,
            };
        } else {
            payload.inputs[key] = inputs[key];
        }
    }
    
    const response = await generateContentCallable(payload);
    return response.data;
};

/**
 * Calls the `generateVideo` Firebase Function, waits for the streaming
 * response, and returns a local blob URL for the video.
 * @param prompt The text prompt for video generation.
 * @returns A local blob URL for the generated video.
 */
export const generateVideoApi = async (prompt: string): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Authentication is required to generate videos.");
    }
    const token = await user.getIdToken();

    // Construct the URL for the cloud function.
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
        throw new Error(`Video generation failed: ${response.status} ${errorText}`);
    }

    const blob = await response.blob();
    if (blob.type !== 'video/mp4') {
        throw new Error('The server did not return a valid video file.');
    }
    
    return URL.createObjectURL(blob);
};