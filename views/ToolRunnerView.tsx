import React, { useState, useCallback, useEffect } from 'react';
import { type Tool, type GeneratedContentData, type InputField } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { generateContentForTool, generateVideo } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';
import GeneratedContent from '../components/GeneratedContent';
import { triggerHapticFeedback } from '../lib/haptics';

interface ToolRunnerViewProps {
  tool: Tool;
  onBack: () => void;
}

const ToolRunnerView: React.FC<ToolRunnerViewProps> = ({ tool, onBack }) => {
  const { t, language } = useLocalization();
  const [inputs, setInputs] = useState<Record<string, string | File>>({});
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Cleanup function: This runs when the component unmounts or when videoUrl changes.
    // It revokes the object URL to free up browser memory.
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

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
    
    // Revoke previous blob URL before starting a new request
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
      } else {
        const result = await generateContentForTool(tool.id, inputs, language, onRetry);
        setGeneratedContent(result);
      }
    } catch (err: any) {
      setError(err.message || t('error_generating'));
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const renderInputField = (field: InputField) => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            rows={5}
            placeholder={t(field.placeholderKey)}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
          />
        );
      case 'image':
        return (
            <div>
                 <input
                    type="file"
                    id={field.name}
                    name={field.name}
                    accept="image/*"
                    onChange={(e) => handleFileChange(field.name, e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
                {imagePreview[field.name] && <img src={imagePreview[field.name]} alt="Preview" className="mt-2 rounded-lg max-h-40" />}
            </div>
        );
      case 'text':
      default:
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            placeholder={t(field.placeholderKey)}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
          />
        );
    }
  };

  const isResultView = generatedContent || videoUrl;

  return (
    <div>
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:text-cyan-500 p-2 rounded-full mr-2 rtl:mr-0 rtl:ml-2">
            <i className="fa-solid fa-arrow-left rtl:fa-arrow-right text-xl"></i>
        </button>
        <div>
            <h1 className="text-2xl font-bold">{t(tool.nameKey)}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t(tool.descriptionKey)}</p>
        </div>
      </div>
      
      {!isResultView && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {tool.inputs.map(field => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium mb-1">{t(field.labelKey)}</label>
              {renderInputField(field)}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 disabled:bg-cyan-300 transition-colors"
          >
            {loading ? <LoadingSpinner /> : <><i className="fa-solid fa-wand-magic-sparkles mr-2"></i> {t('generate')}</>}
          </button>
        </form>
      )}

      {loading && !isResultView && (
        <div className="mt-6 text-center">
            <p className="mb-4">{status || t('generating_content')}</p>
            {tool.id !== 'video_generator' && <SkeletonLoader />}
            {tool.id === 'video_generator' && <LoadingSpinner />}
        </div>
      )}
      
      {error && <p className="mt-4 text-center text-red-500">{error}</p>}
      
      {generatedContent && (
        <div className="mt-6">
            <GeneratedContent data={generatedContent} />
        </div>
      )}

      {videoUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">{t('video_ready')}</h2>
          <video controls src={videoUrl} className="w-full rounded-lg shadow-lg">
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default ToolRunnerView;