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
    inputs,
    setInputValue,
    imagePreview,
    handleFileSelect,
    handleClearImage,
    handleSubmit,
    isLoading,
    error,
    result,
    retryStatus, // This now holds general loading status messages
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
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-32 focus:ring-cyan-500 focus:border-cyan-500"
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
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
          />
        );
    }
  };

  const renderResult = () => {
    if (typeof result === 'string') {
      // Handle video URL result (now a blob URL)
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in text-center">
          <h2 className="text-2xl font-bold mb-4 text-cyan-500 dark:text-cyan-400">{t('video_ready')}</h2>
          <video controls autoPlay src={result} className="w-full max-w-md mx-auto rounded-lg shadow-lg"></video>
        </div>
      );
    }
    if (result) {
      return <GeneratedContent data={result as GeneratedContentData} />;
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 p-2 rounded-full mr-2 rtl:mr-0 rtl:ml-2"
        >
          <i className="fa-solid fa-arrow-left rtl:fa-arrow-right text-xl"></i>
        </button>
        <div>
          <h1 className="text-2xl font-bold">{t(tool.nameKey)}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t(tool.descriptionKey)}</p>
        </div>
      </div>

      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full px-4 py-3 bg-cyan-500 text-white font-semibold rounded-md hover:bg-cyan-600 disabled:bg-cyan-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : t('generate')}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="mt-8 text-center">
          <LottieAnimation />
          <p className="text-lg font-semibold">{retryStatus || t('generating_content')}</p>
          <SkeletonLoader />
        </div>
      )}

      {error && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}

      <div className="mt-8">{renderResult()}</div>
    </div>
  );
};

export default ToolRunnerView;