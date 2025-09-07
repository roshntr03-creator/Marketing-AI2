// supabase/functions/download-video/index.ts
// FIX: Use the Deno namespace library reference to provide correct types for the Deno runtime, resolving issues with 'Deno' global object not being found.
/// <reference lib="deno.ns" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { uri } = await req.json();
    const apiKey = Deno.env.get('API_KEY') || Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('API_KEY or GEMINI_API_KEY environment variable is not set in Supabase Edge Function secrets.');
    }
    if (!uri) {
      throw new Error('Video URI is missing.');
    }

    const videoUrl = `${uri}&key=${apiKey}`;
    const videoResponse = await fetch(videoUrl);

    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video from source: ${videoResponse.statusText}`);
    }

    // Stream the video back to the client
    return new Response(videoResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'video/mp4',
        'Content-Length': videoResponse.headers.get('Content-Length') || '',
      },
    });

  } catch (error) {
    console.error('Error in download-video function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});