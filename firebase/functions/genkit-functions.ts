import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro } from '@genkit-ai/googleai';
import { onFlow } from '@genkit-ai/firebase/functions';

// Configure Genkit with Google AI
const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

// Define flows for different AI operations
export const generateContentFlow = onFlow(
  ai,
  {
    name: 'generateContent',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        model: { type: 'string', default: 'gemini-1.5-flash' },
        config: { type: 'object' }
      },
      required: ['prompt']
    },
    outputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        candidates: { type: 'array' }
      }
    }
  },
  async (input) => {
    const { prompt, model = 'gemini-1.5-flash', config = {} } = input;
    
    const selectedModel = model === 'gemini-1.5-pro' ? gemini15Pro : gemini15Flash;
    
    const response = await ai.generate({
      model: selectedModel,
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        ...config
      }
    });

    return {
      text: response.text,
      candidates: response.candidates || []
    };
  }
);

export const generateStreamingContentFlow = onFlow(
  ai,
  {
    name: 'generateStreamingContent',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        model: { type: 'string', default: 'gemini-1.5-flash' },
        config: { type: 'object' }
      },
      required: ['prompt']
    },
    outputSchema: {
      type: 'object',
      properties: {
        stream: { type: 'boolean' }
      }
    },
    streamSchema: {
      type: 'string'
    }
  },
  async function* (input) {
    const { prompt, model = 'gemini-1.5-flash', config = {} } = input;
    
    const selectedModel = model === 'gemini-1.5-pro' ? gemini15Pro : gemini15Flash;
    
    const response = ai.generateStream({
      model: selectedModel,
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        ...config
      }
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  }
);

export const generateVideoFlow = onFlow(
  ai,
  {
    name: 'generateVideo',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        config: { type: 'object' }
      },
      required: ['prompt']
    },
    outputSchema: {
      type: 'object',
      properties: {
        videoUrl: { type: 'string' },
        status: { type: 'string' }
      }
    }
  },
  async (input) => {
    const { prompt, config = {} } = input;
    
    // This would use the video generation model when available
    // For now, we'll return a placeholder
    return {
      videoUrl: '',
      status: 'Video generation with Genkit coming soon'
    };
  }
);