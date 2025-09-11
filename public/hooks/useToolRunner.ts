import { useState, useCallback } from 'react';
import { type Tool, type GeneratedContentData } from '../types.ts';
import { db, auth } from '../lib/firebaseClient.ts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

  const setInputValue = useCallback((name: string, value: string | File) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const imageInput = tool.inputs.find((i) => i.type === 'image');
    if (imageInput) {
      setInputValue(imageInput.name, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [tool.inputs, setInputValue]);

  const handleClearImage = useCallback(() => {
    const imageInput = tool.inputs.find((i) => i.type === 'image');
    if (imageInput) {
      setInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[imageInput.name];
        return newInputs;
      });
    }
    setImagePreview(null);
  }, [tool.inputs]);

  const saveToHistory = async (generationResult: GeneratedContentData | string) => {
    const user = auth.currentUser;
    if (!user) return;

    // For video generation, we save the prompt instead of the temporary blob URL.
    const outputToStore = tool.id === 'video_generator' ? (inputs.prompt as string) : generationResult;

    // Remove file objects from inputs before saving to Firestore, as it only accepts strings.
    const storableInputs = Object.entries(inputs).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    try {
      await addDoc(collection(db, 'generations'), {
        userId: user.uid,
        tool_id: tool.id,
        inputs: storableInputs,
        output: outputToStore,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to save generation to history:', e);
      // This is a non-critical error, so we don't show a toast to the user.
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
        if (!prompt) throw new Error("Video prompt cannot be empty.");
        const videoUrl = await generateVideoApi(prompt);
        setResult(videoUrl);
        await saveToHistory(videoUrl);
      } else {
        const data = await callGenerateContentApi(tool.id, inputs);
        
        if (!data || !data.text) {
            throw new Error("Received an empty response from the AI.");
        }

        let processedResult: GeneratedContentData;
        if (data.sources && data.sources.length > 0) {
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
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
      setLoadingStatus(null);
    }
  };

  return {
    inputs, setInputValue, imagePreview,
    handleFileSelect, handleClearImage,
    handleSubmit, isLoading, error, result,
    loadingStatus,
  };
};