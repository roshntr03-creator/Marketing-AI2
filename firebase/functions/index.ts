// onRequest handlers in firebase-functions/v2 use Express Request and Response objects.
// FIX: Correctly import `Request` from `firebase-functions/v2/https` and `Response` from `express` to resolve type collisions.
import { onCall, onRequest, HttpsError, Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { Readable } from "stream";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Define common function configuration for region and secrets.
const FUNCTION_CONFIG = {
  region: "us-central1",
  secrets: ["API_KEY"], // Ensures API_KEY is set and loaded as an environment variable.
};

/**
 * Handles all non-streaming, authenticated calls to the Gemini API.
 * This is invoked by the client using `httpsCallable`.
 */
export const geminiApiCall = onCall(
  {
    ...FUNCTION_CONFIG,
    // FIX: Removed 'rateLimits' property as it was causing a type error.
    // This is likely due to an outdated firebase-functions SDK version in the environment.
    // It can be re-enabled once the dependency is updated to a version that supports it.
  },
  async (request) => {
    // V2 `onCall` automatically checks for auth; this is an extra safeguard.
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: API_KEY secret is not configured or loaded.");
      throw new HttpsError("internal", "AI service is not configured on the server.");
    }

    try {
      const { endpoint, params } = request.data;
      // Add stricter input validation as suggested.
      if (typeof endpoint !== 'string' || !params || typeof params !== 'object') {
        throw new HttpsError("invalid-argument", 'The "endpoint" (string) and "params" (object) are required.');
      }

      const ai = new GoogleGenAI({ apiKey });

      // Route the call to the correct Gemini SDK method based on the endpoint.
      switch (endpoint) {
        case "generateVideos":
          const videoOp = await ai.models.generateVideos(params);
          return { operation: videoOp };
        case "getVideosOperation":
          const { operation: opParam } = params;
          if (!opParam || !opParam.name || typeof opParam.name !== 'string' || opParam.name.trim() === '') {
            throw new HttpsError("invalid-argument", "Operation name is required and must be a non-empty string.");
          }
          const statusOp = await ai.operations.get({ operation: opParam.name });
          return { operation: statusOp };
        case "generateContent":
          const response = await ai.models.generateContent(params);
          return response;
        default:
          throw new HttpsError("not-found", `Unknown endpoint: ${endpoint}`);
      }
    } catch (error: any) {
      // Add enhanced logging with more context as suggested.
      console.error("Error in geminiApiCall:", {
          userId: request.auth?.uid,
          errorMessage: error.message,
          endpoint: request.data?.endpoint,
          timestamp: new Date().toISOString()
      });
      throw new HttpsError("internal", error.message, error.details);
    }
  }
);

/**
 * Handles streaming text generation from the Gemini API.
 * This is a standard HTTPS endpoint invoked by the client using `fetch`.
 */
// FIX: Explicitly type 'req' and 'res' with types from 'firebase-functions/v2/https' to resolve method errors.
export const geminiApiStream = onRequest({ ...FUNCTION_CONFIG, cors: true }, async (req: Request, res: Response) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: API_KEY secret is not loaded.");
      res.status(500).json({ error: "AI service is not configured on the server." });
      return;
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
        res.status(401).json({ error: "Unauthorized. No authentication token provided." });
        return;
    }
    try {
        await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error("Error verifying auth token:", error);
        res.status(403).json({ error: "Forbidden. Invalid authentication token." });
        return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed. Please use POST." });
      return;
    }

    try {
      const { params } = req.body;
      if (!params || typeof params !== 'object') {
        res.status(400).json({ error: 'Bad Request: "params" (object) is required.' });
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const responseStream = await ai.models.generateContentStream(params);
      
      res.set("Content-Type", "text/plain; charset=utf-8");
      res.set("Cache-Control", "no-cache");
      res.set("Connection", "keep-alive");

      async function* generate() {
        for await (const chunk of responseStream) {
          yield chunk.text;
        }
      }
      const stream = Readable.from(generate());
      stream.pipe(res);
    } catch (error: any) {
      console.error("Error in geminiApiStream:", {
          errorMessage: error.message,
          timestamp: new Date().toISOString()
      });
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.end();
      }
    }
});

/**
 * Securely downloads video content from a Gemini-provided URI.
 * This is a standard HTTPS endpoint invoked by the client using `fetch`.
 */
// FIX: Explicitly type 'req' and 'res' with types from 'firebase-functions/v2/https' to resolve method errors.
export const downloadVideo = onRequest({ ...FUNCTION_CONFIG, cors: true }, async (req: Request, res: Response) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("CRITICAL: API_KEY secret is not loaded.");
        res.status(500).json({ error: "AI service is not configured on the server." });
        return;
    }

    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
        res.status(401).json({ error: "Unauthorized." });
        return;
    }
    try {
        await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        res.status(403).json({ error: "Forbidden." });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed." });
        return;
    }

    try {
        const { uri } = req.body;
        if (typeof uri !== 'string' || !uri) {
            res.status(400).json({ error: 'Bad Request: "uri" (string) is required.' });
            return;
        }
        
        const videoUrl = `${uri}&key=${apiKey}`;
        const videoResponse = await fetch(videoUrl);

        if (!videoResponse.ok || !videoResponse.body) {
            const errorText = await videoResponse.text();
            console.error(`Failed to fetch video. Status: ${videoResponse.status}`, errorText);
            res.status(videoResponse.status).json({ error: "Failed to fetch video from source." });
            return;
        }
        
        res.set("Content-Type", "video/mp4");
        const contentLength = videoResponse.headers.get("Content-Length");
        if (contentLength) {
            res.set("Content-Length", contentLength);
        }
        
        const videoStream = Readable.fromWeb(videoResponse.body as any);
        videoStream.pipe(res);

    } catch (error: any)
     {
        console.error("Error in downloadVideo function:", {
            errorMessage: error.message,
            timestamp: new Date().toISOString()
        });
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || "An internal server error occurred." });
        } else {
            res.end();
        }
    }
});