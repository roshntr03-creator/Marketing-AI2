

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
        <ul className="list-disc list-inside space-y-1">
          {content.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-cyan-500 dark:text-cyan-400">{data.title}</h2>
      
      <div className="space-y-6">
        {data.sections.map((section, index) => (
          <div key={index}>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{section.heading}</h3>
            <div className="text-gray-700 dark:text-gray-300 prose prose-cyan dark:prose-invert">
                {renderContent(section.content)}
            </div>
          </div>
        ))}
      </div>

      {data.sources && data.sources.length > 0 && (
          <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 text-cyan-500 hover:underline"
            >
                {t('view_sources')}
            </button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('sources')}>
                <ul className="space-y-2">
                    {data.sources.map((source, index) => (
                        <li key={index} className="truncate">
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline block">
                                <span className="font-semibold">{source.title}</span>
                                <span className="text-sm text-gray-500 block">{source.uri}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </Modal>
          </>
      )}
    </div>
  );
};

export default GeneratedContent;