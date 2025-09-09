import { useState, useCallback, useEffect } from 'react';
import { type Tool, type GeneratedContentData, type Generation } from '../types.ts';
import { useLocalization } from './useLocalization.ts';
import { generateContentForTool, generateVideo } from '../services/geminiService.ts';
import { triggerHapticFeedback } from '../lib/haptics.ts';
import { useToasts } from './useToasts.ts';
import { useAuth } from './useAuth.ts';
import { db } from '../lib/firebaseClient.ts';
// FIX: Import firebase compat to use FieldValue.serverTimestamp() for the v8/compat API.
import firebase from 'firebase/compat/app';

const CACHE_KEY = 'generationHistory';
const groundedTools = ['seo_assistant', 'influencer_discovery', 'social_media_optimizer'];


export const useToolRunner = (tool: Tool) => {
  const { t, language } = useLocalization();
  const { addToast } = useToasts();
  const { user } = useAuth();
  const [inputs, setInputs] = useState<Record<string, string | File>>({});
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Cleanup function to revoke the object URL
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const saveGeneration = async (output: GeneratedContentData | string) => {
    if (!user) return;

    const textInputs = Object.fromEntries(
      Object.entries(inputs).filter(([, value]) => typeof value === 'string')
    );
    
    try {
      // FIX: Refactor to use v8 compat API (db.collection().add()) to resolve module errors.
      const docRef = await db.collection('generations').add({
        userId: user.uid,
        tool_id: tool.id,
        inputs: textInputs,
        output: output,
        // FIX: Use compat serverTimestamp.
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Update local cache for instant UI feedback
      const newGeneration: Generation = {
        id: docRef.id,
        created_at: new Date().toISOString(), // Approximate for immediate UI
        tool_id: tool.id,
        inputs: textInputs,
        output: output as GeneratedContentData, // Assuming correct type for cache
      };
      
      const cachedHistoryRaw = localStorage.getItem(CACHE_KEY);
      const cachedHistory: Generation[] = cachedHistoryRaw ? JSON.parse(cachedHistoryRaw) : [];
      const updatedHistory = [newGeneration, ...cachedHistory];
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedHistory));

    } catch (error) {
      console.error('Failed to save generation:', error);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setInputs(prev => ({ ...prev, [name]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => ({ ...prev, [name]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[name];
        return newInputs;
      });
      setImagePreview(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[name];
        return newPreviews;
      });
    }
  };

  const onRetry = useCallback((delaySeconds: number) => {
    setStatus(t('retry_in').replace('{seconds}', delaySeconds.toString()));
  }, [t]);

  const onVideoStatusUpdate = useCallback((statusKey: string) => {
    setStatus(t(statusKey));
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback();

    if (tool.id === 'short_form_factory') {
      const hasText = inputs.source_text && typeof inputs.source_text === 'string' && inputs.source_text.trim() !== '';
      const hasImage = inputs.image && inputs.image instanceof File;
      if (!hasText && !hasImage) {
        setError(t('short_form_factory_error'));
        return;
      }
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    setLoading(true);
    setError(null);
    setGeneratedContent(null);
    setVideoUrl(null);
    setStatus(t('generating_content'));

    const isStreamable = groundedTools.includes(tool.id);

    try {
      if (tool.id === 'video_generator') {
        const prompt = inputs.prompt as string;
        if (!prompt) throw new Error("Prompt is required for video generation.");
        const resultUrl = await generateVideo(prompt, language, onVideoStatusUpdate, onRetry);
        setVideoUrl(resultUrl);
        addToast(t('video_gen_complete_toast'), 'success');
        saveGeneration(prompt);
      } else if (isStreamable) {
        // Handle streaming for grounded tools
        setGeneratedContent({
          title: t(tool.nameKey),
          sections: [{ heading: 'AI-Generated Analysis', content: '' }],
        });

        const onStreamUpdate = (chunk: string) => {
          setGeneratedContent(prev => {
            if (!prev) return null; // Should not happen
            const newContent = (prev.sections[0].content || '') + chunk;
            return {
              ...prev,
              sections: [{ ...prev.sections[0], content: newContent }],
            };
          });
        };
        
        const finalResult = await generateContentForTool(tool.id, inputs, language, onRetry, onStreamUpdate);
        setGeneratedContent(finalResult); // Set final, polished content
        saveGeneration(finalResult);
      } else {
        // Handle non-streaming tools
        const result = await generateContentForTool(tool.id, inputs, language, onRetry);
        setGeneratedContent(result);
        saveGeneration(result);
      }
    } catch (err: any) {
      console.error("Tool Runner Error:", err);
      
      const functionError = err.context?.error;
      const functionHint = err.context?.hint;
      
      let detailedError = functionError || err.message || t('error_generating');
      if(functionHint) {
        detailedError = `${detailedError} (Hint: ${functionHint})`;
      }

      setError(detailedError);
      setGeneratedContent(null); // Clear partial content on error
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return {
    inputs,
    imagePreview,
    loading,
    error,
    generatedContent,
    videoUrl,
    status,
    handleInputChange,
    handleFileChange,
    handleSubmit,
  };
};
