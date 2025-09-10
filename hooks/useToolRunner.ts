import { useState, useCallback } from 'react';
import { type Tool, type GeneratedContentData } from '../types.ts';
import { db, auth } from '../lib/firebaseClient.ts';
// FIX: Add compat import for FieldValue
import firebase from 'firebase/compat/app';
import { useToasts } from './useToasts.ts';
import { useLocalization } from './useLocalization.ts';
import { processJsonResponse, processGroundedResponse } from '../services/gemini/parser.ts';
import { callGenerateContentApi, generateVideoApi } from '../services/gemini/api.ts';

type Inputs = Record<string, string | File>;

export const useToolRunner = (tool: Tool) => {
  const [inputs, setInputs] = useState<Inputs>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedContentData | string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const { addToast } = useToasts();
  const { t } = useLocalization();

  const setInputValue = (name: string, value: string | File) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file: File) => {
    const imageInput = tool.inputs.find((i) => i.type === 'image');
    if (imageInput) {
      setInputValue(imageInput.name, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    const imageInput = tool.inputs.find((i) => i.type === 'image');
    if (imageInput) {
      const newInputs = { ...inputs };
      delete newInputs[imageInput.name];
      setInputs(newInputs);
    }
    setImagePreview(null);
  };

  const saveToHistory = async (generationResult: GeneratedContentData | string) => {
    if (!auth.currentUser) return;

    // For video generation, we save the prompt instead of the temporary blob URL.
    const outputToStore = tool.id === 'video_generator' ? (inputs.prompt as string) : generationResult;

    // Remove file objects from inputs before saving to firestore
    const storableInputs: Record<string, string> = {};
    for (const key in inputs) {
      if (typeof inputs[key] === 'string') {
        storableInputs[key] = inputs[key] as string;
      }
    }

    try {
      await db.collection('generations').add({
        userId: auth.currentUser.uid,
        tool_id: tool.id,
        inputs: storableInputs,
        output: outputToStore,
        // FIX: Use compat FieldValue
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to save generation to history:', e);
      // Don't bother the user with this error.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStatus(t('generating_content'));

    try {
      if (tool.id === 'video_generator') {
        setLoadingStatus("Starting video generation... this can take several minutes.");
        const prompt = inputs.prompt as string;
        if (!prompt) {
          throw new Error("Video prompt cannot be empty.");
        }
        const videoUrl = await generateVideoApi(prompt);
        setResult(videoUrl);
        await saveToHistory(videoUrl); // Pass blob url, saveToHistory will handle it
      } else {
        const data = await callGenerateContentApi(tool.id, inputs);
        
        if (data.error) {
          throw new Error(data.error);
        }

        let processedResult: GeneratedContentData;
        if (data.sources) {
          const title = `AI Insights on "${Object.values(inputs)[0]}"`;
          processedResult = processGroundedResponse(data.text, title);
          processedResult.sources = data.sources;
        } else {
          processedResult = processJsonResponse(data.text);
        }
        setResult(processedResult);
        await saveToHistory(processedResult);
      }
    } catch (err: any) {
      console.error('Error during generation:', err);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err.message) {
        errorMessage = err.message;
      }
      if (err.code === 'unavailable') {
        errorMessage = 'Could not connect to the server. Please check your internet connection.';
      }
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
      setLoadingStatus(null);
    }
  };

  return {
    inputs,
    setInputValue,
    imagePreview,
    handleFileSelect,
    handleClearImage,
    handleSubmit,
    isLoading,
    isPolling: false, // Polling is now done on the server
    error,
    result,
    retryStatus: loadingStatus, // Re-use retryStatus for general loading messages
  };
};