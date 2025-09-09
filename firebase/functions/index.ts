import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/genai';
import * as cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize CORS
const corsHandler = cors({ origin: true });

// Initialize Gemini AI
const getGeminiClient = () => {
  const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Gemini API key not configured. Please set it using: firebase functions:config:set gemini.api_key="your-key"'
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

// Gemini API Call Function
export const geminiApiCall = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const { endpoint, params } = data;
    const genAI = getGeminiClient();
    
    if (endpoint === 'generateContent') {
      const model = genAI.getGenerativeModel({ model: params.model || 'gemini-1.5-flash' });
      
      const result = await model.generateContent({
        contents: [{ parts: [{ text: params.contents }] }],
        generationConfig: params.config || {}
      });
      
      return {
        text: result.response.text(),
        candidates: result.response.candidates || []
      };
    }
    
    throw new functions.https.HttpsError('invalid-argument', 'Unsupported endpoint');
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new functions.https.HttpsError('internal', error.message || 'AI service failed');
  }
});

// Gemini Streaming Function
export const geminiApiStream = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    // Check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    try {
      const { params } = req.body;
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: params.model || 'gemini-1.5-flash' });
      
      const result = await model.generateContentStream({
        contents: [{ parts: [{ text: params.contents }] }],
        generationConfig: params.config || {}
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(chunkText);
        }
      }
      
      res.end();
    } catch (error: any) {
      console.error('Streaming Error:', error);
      res.status(500).json({ error: error.message || 'Streaming failed' });
    }
  });
});

// Video Download Function (placeholder)
export const downloadVideo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // This is a placeholder - video generation would need additional setup
  throw new functions.https.HttpsError('unimplemented', 'Video generation not yet implemented');
});