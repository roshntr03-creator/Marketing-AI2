// supabase/functions/gemini-proxy/index.ts
// FIX: Use the Deno namespace library reference to provide correct types for the Deno runtime, resolving issues with 'Deno' global object not being found.
/// <reference lib="deno.ns" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { GoogleGenAI } from 'npm:@google/genai@1.17.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// This is the main Deno server function.
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();
    const apiKey = Deno.env.get('API_KEY') || Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('API_KEY or GEMINI_API_KEY environment variable is not set in Supabase Edge Function secrets.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // --- STREAMING ENDPOINT ---
    if (endpoint === 'generateContentStream') {
      const responseStream = await ai.models.generateContentStream(params);
      
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of responseStream) {
            controller.enqueue(encoder.encode(chunk.text));
          }
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }
    
    // --- VIDEO GENERATION ENDPOINTS ---
    if (endpoint === 'generateVideos') {
      const operation = await ai.models.generateVideos(params);
      return new Response(JSON.stringify({ operation }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (endpoint === 'getVideosOperation') {
      const { operation: operationParam } = params;
      const operation = await ai.operations.getVideosOperation({ operation: operationParam });
      return new Response(JSON.stringify({ operation }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- STANDARD NON-STREAMING ENDPOINT ---
    // Defaulting to generateContent for grounded and JSON modes
    const response = await ai.models.generateContent(params);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-proxy Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});