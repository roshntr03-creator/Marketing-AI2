// supabase/functions/download-video/index.ts
// FIX: Removed invalid 'deno.ns' lib reference and declared the Deno global to fix type errors.
// This file is intended to run in a Deno environment where 'Deno' is a global variable.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper to create JSON error responses with consistent CORS headers
function jsonErrorResponse(message: string, hint?: string, status = 500) {
    return new Response(JSON.stringify({ error: message, hint }), {
      status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonErrorResponse('Method Not Allowed. Please use POST.', undefined, 405);
  }

  try {
    const { uri } = await req.json();
    
    if (!uri) {
        return jsonErrorResponse('Bad Request: "uri" is required in the request body.', undefined, 400);
    }
    
    const apiKey = Deno.env.get('API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('CRITICAL: Gemini API key is not configured for video download.');
      return jsonErrorResponse('AI service is not configured. Missing API key secret.', 'The administrator needs to set API_KEY or GEMINI_API_KEY in Supabase secrets.', 500);
    }

    const videoUrl = `${uri}&key=${apiKey}`;
    const videoResponse = await fetch(videoUrl);

    if (!videoResponse.ok || !videoResponse.body) {
      console.error(`Failed to fetch video from Gemini. Status: ${videoResponse.status} ${videoResponse.statusText}`);
      const responseText = await videoResponse.text();
      console.error('Gemini Response Body:', responseText);
      return jsonErrorResponse(`Failed to fetch video from source: ${videoResponse.statusText}`, 'The download link may have expired or the API key may be invalid.', videoResponse.status);
    }

    // Stream the video back to the client
    return new Response(videoResponse.body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'video/mp4',
        'Content-Length': videoResponse.headers.get('Content-Length') || '',
      },
    });

  } catch (error) {
    console.error('Error in download-video function:', error);
    return jsonErrorResponse(error.message, 'An unexpected error occurred during the video download process.', 500);
  }
});