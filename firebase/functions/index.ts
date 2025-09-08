import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import * as cors from "cors";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize CORS middleware
const corsHandler = cors({ origin: true });

// Helper to get Gemini API key from environment configuration
const getApiKey = (): string => {
  // In Firebase, secrets are exposed as environment variables.
  // The key 'API_KEY' should be set using `firebase functions:secrets:set API_KEY`
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: Gemini API key (API_KEY) is not configured in Firebase secrets.");
    throw new functions.https.HttpsError(
      "failed-precondition",
      "AI service is not configured. Missing API key secret.",
      { hint: "The administrator needs to set the API_KEY secret for the Firebase function." },
    );
  }
  return apiKey;
};

// Main proxy function for Gemini API calls
export const geminiProxy = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Verify user authentication using Firebase Auth ID token
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
      const { endpoint, params } = req.body;

      if (!endpoint || !params) {
        res.status(400).send({ error: 'Bad Request: "endpoint" and "params" are required.' });
        return;
      }

      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });

      // --- STREAMING ENDPOINT ---
      if (endpoint === "generateContentStream") {
        const responseStream = await ai.models.generateContentStream(params);
        
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of responseStream) {
          res.write(chunk.text);
        }
        res.end();
        return;
      }

      // --- VIDEO GENERATION ENDPOINTS ---
      if (endpoint === "generateVideos") {
        const operation = await ai.models.generateVideos(params);
        res.status(200).send({ operation });
        return;
      }

      if (endpoint === "getVideosOperation") {
        const { operation: operationParam } = params;
        const operation = await ai.operations.getVideosOperation({ operation: operationParam });
        res.status(200).send({ operation });
        return;
      }

      // --- STANDARD NON-STREAMING ENDPOINT ---
      if (endpoint === "generateContent") {
        const response = await ai.models.generateContent(params);
        res.status(200).send(response);
        return;
      }

      res.status(400).send({ error: `Unknown endpoint: ${endpoint}` });

    } catch (error: any) {
      console.error("Error in geminiProxy function:", error);
      const errorMessage = String(error?.message || error);
      res.status(500).send({ error: errorMessage, hint: error?.details?.hint });
    }
  });
});

// Function to download video content securely
export const downloadVideo = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // Verify user authentication
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
            
            const apiKey = getApiKey();
            const videoUrl = `${uri}&key=${apiKey}`;

            // Fetch the video from the Gemini API
            const videoResponse = await fetch(videoUrl);

            if (!videoResponse.ok || !videoResponse.body) {
                const errorText = await videoResponse.text();
                console.error(`Failed to fetch video. Status: ${videoResponse.status}`, errorText);
                res.status(videoResponse.status).send({ error: "Failed to fetch video from source." });
                return;
            }

            // Stream the video back to the client
            res.setHeader("Content-Type", "video/mp4");
            const contentLength = videoResponse.headers.get("Content-Length");
            if (contentLength) {
                res.setHeader("Content-Length", contentLength);
            }
            
            const nodeStream = videoResponse.body as unknown as NodeJS.ReadableStream;
            nodeStream.pipe(res);

        } catch (error: any) {
            console.error("Error in downloadVideo function:", error);
            res.status(500).send({ error: error.message || "An internal server error occurred." });
        }
    });
});
