import { useState, useCallback, useEffect } from 'react';
import { type Tool, type GeneratedContentData, type Generation } from '../types';
import { useLocalization } from './useLocalization';
import { generateContentForTool, generateVideo } from '../services/geminiService';
import { triggerHapticFeedback } from '../lib/haptics';
import { supabase } from '../lib/supabaseClient';
import { useToasts } from './useToasts';
import { useAuth } from './useAuth';

const CACHE_KEY = 'generationHistory';

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

    const { data: newGeneration, error } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        tool_id: tool.id,
        inputs: textInputs,
        output: output,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to save generation:', error);
    } else if (newGeneration) {
      // Update local cache for instant UI feedback
      try {
        const cachedHistoryRaw = localStorage.getItem(CACHE_KEY);
        const cachedHistory: Generation[] = cachedHistoryRaw ? JSON.parse(cachedHistoryRaw) : [];
        const updatedHistory = [newGeneration, ...cachedHistory];
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.error('Failed to update history cache:', e);
      }
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
      // Fix: Corrected typo from readDataURL to readAsDataURL.
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

    try {
      if (tool.id === 'video_generator') {
        const prompt = inputs.prompt as string;
        if (!prompt) throw new Error("Prompt is required for video generation.");
        const resultUrl = await generateVideo(prompt, language, onVideoStatusUpdate, onRetry);
        setVideoUrl(resultUrl);
        addToast(t('video_gen_complete_toast'), 'success');
        saveGeneration(prompt);
      } else {
        const result = await generateContentForTool(tool.id, inputs, language, onRetry);
        setGeneratedContent(result);
        saveGeneration(result);
      }
    } catch (err: any) {
      setError(err.message || t('error_generating'));
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
