import React, { useState } from 'react';
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

  const handleSelectGeneration = (generation: Generation) => {
    setSelectedGeneration(generation);
  };

  const renderHistoryContent = () => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, index) => <HistoryItemSkeleton key={index} />);
    }

    if (error) {
        return <p className="text-red-500">{error}</p>
    }

    if (history.length === 0) {
      return (
        <div className="text-center py-8">
          <i className="fa-solid fa-clock-rotate-left text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-xl font-semibold">{t('no_history_title')}</h3>
          <p className="text-gray-500">{t('no_history_desc')}</p>
        </div>
      );
    }

    return history.map(gen => {
      const tool = TOOLS.find(t => t.id === gen.tool_id);
      return <HistoryItem key={gen.id} generation={gen} tool={tool} onSelect={handleSelectGeneration} />;
    });
  };
  
  const getSelectedTool = () => {
      if (!selectedGeneration) return undefined;
      return TOOLS.find(t => t.id === selectedGeneration.tool_id);
  }
  
  const renderModalContent = () => {
      if (!selectedGeneration) return null;
      
      const tool = getSelectedTool();
      
      if (tool?.id === 'video_generator' && typeof selectedGeneration.output === 'string') {
          return (
              <div>
                  <h3 className="text-lg font-semibold mb-2">Video Generation Prompt</h3>
                  <p className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-3 rounded-md font-mono text-sm">
                    {selectedGeneration.output}
                  </p>
              </div>
          );
      }
      
      if (typeof selectedGeneration.output === 'string') {
          // Fallback for any old string data that isn't a video prompt
          return <p>{selectedGeneration.output}</p>
      }

      return <GeneratedContent data={selectedGeneration.output as GeneratedContentData} />;
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">{t('analytics_preview')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('analytics_preview_desc')}</p>
      </div>
      <AnalyticsChart />

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('generation_history')}</h2>
        <div className="space-y-4">
          {renderHistoryContent()}
        </div>
      </div>
      
      {selectedGeneration && (
         <Modal 
            isOpen={!!selectedGeneration} 
            onClose={() => setSelectedGeneration(null)}
            title={getSelectedTool() ? t(getSelectedTool()!.nameKey) : 'Generation Result'}
         >
            {renderModalContent()}
         </Modal>
      )}
    </div>
  );
};

export default AnalyticsView;