import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import { Readable } from "stream";

// Initialize CORS handler. `origin: true` is crucial for security and reflects the request origin.
const corsHandler = cors({ origin: true });

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
export const geminiApiCall = onCall(FUNCTION_CONFIG, async (request) => {
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
    if (!endpoint || !params) {
      throw new HttpsError("invalid-argument", 'The "endpoint" and "params" are required.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Route the call to the correct Gemini SDK method based on the endpoint.
    switch (endpoint) {
      case "generateVideos":
        const videoOp = await ai.models.generateVideos(params);
        return { operation: videoOp };
      case "getVideosOperation":
        const { operation: opParam } = params;
        const statusOp = await ai.operations.getVideosOperation({ operation: opParam });
        return { operation: statusOp };
      case "generateContent":
        const response = await ai.models.generateContent(params);
        return response; // The client SDK handles extracting data from the response.
      default:
        throw new HttpsError("not-found", `Unknown endpoint: ${endpoint}`);
    }
  } catch (error: any) {
    console.error("Error in geminiApiCall function:", error);
    throw new HttpsError("internal", error.message, error.details);
  }
});

/**
 * Handles streaming text generation from the Gemini API.
 * This is a standard HTTPS endpoint invoked by the client using `fetch`.
 */
// FIX: Removed explicit Express types from the handler. Type inference from `onRequest` provides the correct types for `req` and `res`, resolving compilation errors.
export const geminiApiStream = onRequest(FUNCTION_CONFIG, (req, res) => {
    // Wrap the entire function logic in the CORS handler.
    corsHandler(req, res, async () => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
          console.error("CRITICAL: API_KEY secret is not loaded.");
          res.status(500).send({ error: "AI service is not configured on the server." });
          return;
        }

        // Manually verify user authentication for this `onRequest` function.
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) {
            res.status(401).send({ error: "Unauthorized. No authentication token provided." });
            return;
        }
        try {
            await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            console.error("Error verifying auth token:", error);
            res.status(403).send({ error: "Forbidden. Invalid authentication token." });
            return;
        }

        if (req.method !== "POST") {
          res.status(405).send({ error: "Method Not Allowed. Please use POST." });
          return;
        }

        try {
          const { params } = req.body;
          if (!params) {
            res.status(400).send({ error: 'Bad Request: "params" are required.' });
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
          // FIX: The Firebase `res` object is not a writable stream, so `pipe()` cannot be used.
          // Instead, we manually write chunks to the response object.
          const stream = Readable.from(generate());
          for await (const chunk of stream) {
            res.write(chunk);
          }
          res.end();
        } catch (error: any) {
          console.error("Error in geminiApiStream:", error);
          if (!res.headersSent) {
            res.status(500).send({ error: error.message });
          } else {
            // If headers were already sent, we can't send a new status code.
            // Just end the response to prevent the client from hanging.
            res.end();
          }
        }
    });
});

/**
 * Securely downloads video content from a Gemini-provided URI.
 * This is a standard HTTPS endpoint invoked by the client using `fetch`.
 */
// FIX: Removed explicit Express types from the handler. Type inference from `onRequest` provides the correct types for `req` and `res`, resolving compilation errors.
export const downloadVideo = onRequest(FUNCTION_CONFIG, (req, res) => {
    // Wrap the entire function logic in the CORS handler.
    corsHandler(req, res, async () => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("CRITICAL: API_KEY secret is not loaded.");
            res.status(500).send({ error: "AI service is not configured on the server." });
            return;
        }

        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) {
            res.status(401).send({ error: "Unauthorized." });
            return;
        }
        try {
            await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            res.status(403).send({ error: "Forbidden." });
            return;
        }

        if (req.method !== "POST") {
            res.status(405).send({ error: "Method Not Allowed." });
            return;
        }

        try {
            const { uri } = req.body;
            if (!uri) {
                res.status(400).send({ error: 'Bad Request: "uri" is required.' });
                return;
            }
            
            const videoUrl = `${uri}&key=${apiKey}`;
            const videoResponse = await fetch(videoUrl);

            if (!videoResponse.ok || !videoResponse.body) {
                const errorText = await videoResponse.text();
                console.error(`Failed to fetch video. Status: ${videoResponse.status}`, errorText);
                res.status(videoResponse.status).send({ error: "Failed to fetch video from source." });
                return;
            }
            
            res.set("Content-Type", "video/mp4");
            const contentLength = videoResponse.headers.get("Content-Length");
            if (contentLength) {
                res.set("Content-Length", contentLength);
            }
            
            // FIX: The Firebase `res` object is not a writable stream, so `pipe()` cannot be used.
            // Instead, we stream the body from the fetch response directly to our function's response.
            const videoStream = Readable.fromWeb(videoResponse.body as any);
            for await (const chunk of videoStream) {
              res.write(chunk);
            }
            res.end();

        } catch (error: any) {
            console.error("Error in downloadVideo function:", error);
            if (!res.headersSent) {
                res.status(500).send({ error: error.message || "An internal server error occurred." });
            } else {
                res.end();
            }
        }
    });
});