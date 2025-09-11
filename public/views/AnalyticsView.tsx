import React, { useState, useCallback } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import AnalyticsChart from '../components/AnalyticsChart.tsx';
import { useHistory } from '../hooks/useHistory.ts';
import { TOOLS } from '../constants.ts';
import HistoryItem from '../components/HistoryItem.tsx';
import HistoryItemSkeleton from '../components/HistoryItemSkeleton.tsx';
import { type Generation, type GeneratedContentData } from '../types.ts';
import Modal from '../components/Modal.tsx';
import GeneratedContent from '../components/GeneratedContent.tsx';

const AnalyticsView: React.FC = () => {
  const { t } = useLocalization();
  const { history, loading, error } = useHistory();
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);

  const handleSelectGeneration = useCallback((generation: Generation) => {
    setSelectedGeneration(generation);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setSelectedGeneration(null);
  }, []);

  const renderHistoryContent = () => {
    if (loading) {
      return Array.from({ length: 4 }).map((_, index) => <HistoryItemSkeleton key={index} />);
    }

    if (error) {
        return <p className="text-red-500 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">{error}</p>
    }

    if (history.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <i className="fa-solid fa-clock-rotate-left text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('no_history_title')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('no_history_desc')}</p>
        </div>
      );
    }

    return history.map(gen => {
      const tool = TOOLS.find(t => t.id === gen.tool_id);
      return <HistoryItem key={gen.id} generation={gen} tool={tool} onSelect={handleSelectGeneration} />;
    });
  };
  
  const selectedTool = React.useMemo(() => {
    if (!selectedGeneration) return undefined;
    return TOOLS.find(t => t.id === selectedGeneration.tool_id);
  }, [selectedGeneration]);
  
  const renderModalContent = () => {
      if (!selectedGeneration) return null;
      
      if (selectedTool?.id === 'video_generator' && typeof selectedGeneration.output === 'string') {
          return (
              <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Video Generation Prompt</h3>
                  <p className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-3 rounded-md font-mono text-sm">
                    {selectedGeneration.output}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Note: The actual video file is not stored in your history.</p>
              </div>
          );
      }
      
      if (typeof selectedGeneration.output === 'string') {
          return <p className="whitespace-pre-wrap">{selectedGeneration.output}</p>
      }

      return <GeneratedContent data={selectedGeneration.output as GeneratedContentData} />;
  }

  return (
    <div className="animate-fade-in space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{t('analytics_preview')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('analytics_preview_desc')}</p>
      </section>
      
      <AnalyticsChart />

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">{t('generation_history')}</h2>
        <div className="space-y-4">
          {renderHistoryContent()}
        </div>
      </section>
      
      {selectedGeneration && (
         <Modal 
            isOpen={!!selectedGeneration} 
            onClose={handleCloseModal}
            title={selectedTool ? t(selectedTool.nameKey) : 'Generation Result'}
         >
            {renderModalContent()}
         </Modal>
      )}
    </div>
  );
};

export default React.memo(AnalyticsView);