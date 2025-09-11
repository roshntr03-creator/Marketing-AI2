import React, { useState } from 'react';
import { type GeneratedContentData } from '../types.ts';
import { useLocalization } from '../hooks/useLocalization.ts';
import Modal from './Modal.tsx';

interface GeneratedContentProps {
  data: GeneratedContentData;
}

const GeneratedContent: React.FC<GeneratedContentProps> = ({ data }) => {
  const { t } = useLocalization();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderContent = (content: string | string[]) => {
    if (Array.isArray(content)) {
      return (
        <ul className="list-disc list-outside space-y-2 pl-5">
          {content.map((item, index) => (
            <li key={index} className="text-gray-700 dark:text-gray-300">{item}</li>
          ))}
        </ul>
      );
    }
    // Use whitespace-pre-wrap to respect newlines from the API response
    return <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{content}</p>;
  };
  
  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-fade-in-up w-full">
      <header>
        <h2 className="text-2xl font-bold mb-4 text-cyan-500 dark:text-cyan-400">{data.title}</h2>
      </header>
      
      <div className="space-y-6">
        {data.sections.map((section, index) => (
          <section key={index}>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{section.heading}</h3>
            <div className="prose prose-cyan dark:prose-invert max-w-none">
                {renderContent(section.content)}
            </div>
          </section>
        ))}
      </div>

      {data.sources && data.sources.length > 0 && (
          <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
            >
                <i className="fa-solid fa-link mr-2"></i>
                {t('view_sources')}
            </button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('sources')}>
                <ul className="space-y-3">
                    {data.sources.map((source, index) => (
                        <li key={index}>
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <span className="font-semibold text-cyan-600 dark:text-cyan-400 block truncate">{source.title}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 block truncate">{source.uri}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </Modal>
          </>
      )}
    </article>
  );
};

export default React.memo(GeneratedContent);
