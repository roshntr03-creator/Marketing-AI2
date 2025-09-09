import * as admin from "firebase-admin";
import { 
  generateContentFlow, 
  generateStreamingContentFlow, 
  generateVideoFlow 
} from './genkit-functions';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Genkit flows
export { 
  generateContentFlow, 
  generateStreamingContentFlow, 
  generateVideoFlow 
};