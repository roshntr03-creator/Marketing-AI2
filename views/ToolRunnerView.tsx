import React from 'react';
import { type Tool, type GeneratedContentData, type InputField } from '../types.ts';
import { useLocalization } from '../hooks/useLocalization.ts';
import { useToolRunner } from '../hooks/useToolRunner.ts';
import ImageUpload from '../components/ImageUpload.tsx';
import GeneratedContent from '../components/GeneratedContent.tsx';
import SkeletonLoader from '../components/SkeletonLoader.tsx';
import LottieAnimation from '../components/LottieAnimation.tsx';

interface ToolRunnerViewProps {
  tool: Tool;
  onBack: () => void;
}

const ToolRunnerView: React.FC<ToolRunnerViewProps> = ({ tool, onBack }) => {
  const { t } = useLocalization();
  const {
    inputs, setInputValue, imagePreview, handleFileSelect,
    handleClearImage, handleSubmit, isLoading, error, result,
    loadingStatus,
  } = useToolRunner(tool);

  const renderInput = (inputField: InputField) => {
    switch (inputField.type) {
      case 'textarea':
        return (
          <textarea
            id={inputField.name}
            name={inputField.name}
            value={(inputs[inputField.name] as string) || ''}
            onChange={(e) => setInputValue(inputField.name, e.target.value)}
            placeholder={t(inputField.placeholderKey)}
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-32 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            rows={5}
          />
        );
      case 'image':
        return (
          <ImageUpload
            previewSrc={imagePreview}
            onFileSelect={handleFileSelect}
            onClear={handleClearImage}
            label={t(inputField.labelKey)}
          />
        );
      case 'text':
      default:
        return (
          <input
            id={inputField.name}
            name={inputField.name}
            type="text"
            value={(inputs[inputField.name] as string) || ''}
            onChange={(e) => setInputValue(inputField.name, e.target.value)}
            placeholder={t(inputField.placeholderKey)}
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          />
        );
    }
  };

  const renderResult = () => {
    const handleDownload = (dataUrl: string, filename: string) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (tool.id === 'video_generator' && typeof result === 'string' && result.startsWith('blob:')) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in text-center">
          <h2 className="text-2xl font-bold mb-4 text-cyan-500 dark:text-cyan-400">{t('video_ready')}</h2>
          <video controls autoPlay src={result} className="w-full max-w-md mx-auto rounded-lg shadow-lg"></video>
        </div>
      );
    }

    if (tool.id === 'ai_image_generator' && typeof result === 'string') {
        const imageUrl = `data:image/png;base64,${result}`;
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in text-center">
                <h2 className="text-2xl font-bold mb-4 text-cyan-500 dark:text-cyan-400">{t('image_ready')}</h2>
                <img src={imageUrl} alt={t('ai_image_generator_name')} className="w-full max-w-md mx-auto rounded-lg shadow-lg" />
                <button
                    onClick={() => handleDownload(imageUrl, 'ai-generated-image.png')}
                    className="mt-6 px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 disabled:bg-green-300 transition-colors flex items-center justify-center mx-auto"
                >
                    <i className="fa-solid fa-download mr-2"></i>
                    {t('download_image')}
                </button>
            </div>
        );
    }

    if (result && typeof result !== 'string') {
      return <GeneratedContent data={result as GeneratedContentData} />;
    }
    
    return null;
  };

  return (
    <div className="animate-fade-in">
      <header className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 p-2 rounded-full mr-2 rtl:mr-0 rtl:ml-2 transition-colors"
          aria-label="Back to tools list"
        >
          <i className="fa-solid fa-arrow-left rtl:fa-arrow-right text-xl"></i>
        </button>
        <div>
          <h1 className="text-2xl font-bold">{t(tool.nameKey)}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t(tool.descriptionKey)}</p>
        </div>
      </header>

      {!result && !isLoading && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          {tool.inputs.map((inputField) => (
            <div key={inputField.name}>
              <label htmlFor={inputField.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t(inputField.labelKey)}
              </label>
              {renderInput(inputField)}
            </div>
          ))}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-cyan-500 text-white font-semibold rounded-md hover:bg-cyan-600 disabled:bg-cyan-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {t('generate')}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="mt-8 text-center animate-fade-in">
          <LottieAnimation />
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{loadingStatus || t('generating_content')}</p>
          <SkeletonLoader />
        </div>
      )}

      {error && <p className="mt-4 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md animate-fade-in">{error}</p>}

      <div className="mt-8">{renderResult()}</div>
    </div>
  );
};

export default ToolRunnerView;