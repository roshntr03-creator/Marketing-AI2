import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import * as cors from "cors";
import { Readable } from "stream";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize CORS middleware for onRequest functions
const corsHandler = cors({ origin: true });

// Helper to get Gemini API key from environment configuration
const getApiKey = (): string => {
  // In Firebase, secrets are exposed as environment variables.
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

// New `onCall` function for non-streaming, JSON-in/JSON-out communication.
// `httpsCallable` from the client uses this, which handles auth and CORS automatically.
// FIX: Using `any` for context type due to incorrect type resolution in the build environment.
export const geminiApiCall = functions.https.onCall(async (data: any, context: any) => {
  // Ensure the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  try {
    const { endpoint, params } = data;
    if (!endpoint || !params) {
      throw new functions.https.HttpsError("invalid-argument", 'The "endpoint" and "params" are required in the request data.');
    }

    const apiKey = getApiKey();
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
        return response;
      default:
        throw new functions.https.HttpsError("not-found", `Unknown endpoint: ${endpoint}`);
    }
  } catch (error: any) {
    console.error("Error in geminiApiCall function:", error);
    // Re-throw as an HttpsError so the client gets a structured error.
    throw new functions.https.HttpsError("internal", error.message, error.details);
  }
});


// `onRequest` function dedicated to handling streaming API calls.
// FIX: Using `any` for req and res types due to DOM type conflicts and incorrect type resolution in the build environment.
export const geminiApiStream = functions.https.onRequest((req: any, res: any) => {
  corsHandler(req, res, async () => {
    // Manually verify user authentication for this onRequest function.
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

      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });

      const responseStream = await ai.models.generateContentStream(params);
      
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of responseStream) {
        res.write(chunk.text);
      }
      res.end();
    } catch (error: any) {
      console.error("Error in geminiApiStream:", error);
      res.status(500).send({ error: error.message });
    }
  });
});

// `onRequest` function to securely download video content.
// FIX: Using `any` for req and res types due to DOM type conflicts and incorrect type resolution in the build environment.
export const downloadVideo = functions.https.onRequest((req: any, res: any) => {
    corsHandler(req, res, async () => {
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

            const videoResponse = await fetch(videoUrl);

            if (!videoResponse.ok || !videoResponse.body) {
                const errorText = await videoResponse.text();
                console.error(`Failed to fetch video. Status: ${videoResponse.status}`, errorText);
                res.status(videoResponse.status).send({ error: "Failed to fetch video from source." });
                return;
            }

            res.setHeader("Content-Type", "video/mp4");
            const contentLength = videoResponse.headers.get("Content-Length");
            if (contentLength) {
                res.setHeader("Content-Length", contentLength);
            }
            
            Readable.fromWeb(videoResponse.body as any).pipe(res);

        } catch (error: any) {
            console.error("Error in downloadVideo function:", error);
            res.status(500).send({ error: error.message || "An internal server error occurred." });
        }
    });
});