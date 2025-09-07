// supabase/functions/gemini-proxy/index.ts
// FIX: Removed invalid 'deno.ns' lib reference and declared the Deno global to fix type errors.
// This file is intended to run in a Deno environment where 'Deno' is a global variable.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { GoogleGenAI } from 'npm:@google/genai@1.17.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to create JSON responses with consistent CORS headers
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  
  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed. Please use POST.' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { endpoint, params } = body;

    if (!endpoint || !params) {
        return jsonResponse({ error: 'Bad Request: "endpoint" and "params" are required in the request body.' }, 400);
    }

    const apiKey = Deno.env.get('API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('CRITICAL: Gemini API key is not configured.');
      return jsonResponse({ error: 'AI service is not configured. Missing API key secret.', hint: 'The administrator needs to set API_KEY or GEMINI_API_KEY in Supabase secrets.' }, 500);
    }

    const ai = new GoogleGenAI({ apiKey });

    // --- STREAMING ENDPOINT ---
    if (endpoint === 'generateContentStream') {
      const responseStream = await ai.models.generateContentStream(params);
      
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          } catch (streamError) {
             console.error("Error during stream processing:", streamError);
             // Cannot send headers here as they are already sent.
             // The client will see a prematurely closed stream.
          } finally {
             controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }
    
    // --- VIDEO GENERATION ENDPOINTS ---
    if (endpoint === 'generateVideos') {
      const operation = await ai.models.generateVideos(params);
      return jsonResponse({ operation });
    }

    if (endpoint === 'getVideosOperation') {
      const { operation: operationParam } = params;
      const operation = await ai.operations.getVideosOperation({ operation: operationParam });
      return jsonResponse({ operation });
    }

    // --- STANDARD NON-STREAMING ENDPOINT ---
    if (endpoint === 'generateContent') {
      const response = await ai.models.generateContent(params);
      return jsonResponse(response);
    }

    // If endpoint is not recognized
    return jsonResponse({ error: `Unknown endpoint: ${endpoint}` }, 400);

  } catch (error) {
    console.error('Error in gemini-proxy Edge Function:', error);
    
    let hint = 'An unexpected error occurred.';
    const errorMessage = String(error?.message || error).toLowerCase();

    if (errorMessage.includes('not found') || errorMessage.includes('model')) {
        hint = "Check the model name for typos. It might also be a permission issue with your API key for this specific model.";
    } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        hint = "The API key is likely invalid, expired, or doesn't have permissions for the requested model.";
    } else if (errorMessage.includes('json')) {
        hint = "The request body might be malformed or the API returned an unexpected response.";
    }

    return jsonResponse({ error: error.message, hint }, 500);
  }
});