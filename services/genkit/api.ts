import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth, app } from '../../lib/firebaseClient.ts';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Genkit flow callable functions
const generateContentFlow = httpsCallable(functions, 'generateContentFlow');
const generateStreamingContentFlow = httpsCallable(functions, 'generateStreamingContentFlow');
const generateVideoFlow = httpsCallable(functions, 'generateVideoFlow');

/**
 * Call Genkit content generation flow
 */
export const callGenkitGenerateContent = async (
  prompt: string,
  config: any = {}
): Promise<any> => {
  try {
    const result = await generateContentFlow({
      prompt,
      config
    });
    return result.data;
  } catch (error: any) {
    console.error('Genkit content generation failed:', error);
    throw new Error(error.message || 'Content generation failed');
  }
};

/**
 * Call Genkit streaming content generation flow
 */
export const callGenkitGenerateStreamingContent = async function* (
  prompt: string,
  config: any = {}
): AsyncGenerator<string> {
  try {
    const result = await generateStreamingContentFlow({
      prompt,
      config
    });
    
    // Handle streaming response
    if (result.data && typeof result.data === 'string') {
      yield result.data;
    }
  } catch (error: any) {
    console.error('Genkit streaming generation failed:', error);
    throw new Error(error.message || 'Streaming generation failed');
  }
};

/**
 * Call Genkit video generation flow
 */
export const callGenkitGenerateVideo = async (
  prompt: string,
  config: any = {}
): Promise<any> => {
  try {
    const result = await generateVideoFlow({
      prompt,
      config
    });
    return result.data;
  } catch (error: any) {
    console.error('Genkit video generation failed:', error);
    throw new Error(error.message || 'Video generation failed');
  }
};