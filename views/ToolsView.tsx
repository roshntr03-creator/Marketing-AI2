
import React, { useState, useMemo } from 'react';
import { type Tool } from '../types';
import { TOOLS } from '../constants';
import { useLocalization } from '../hooks/useLocalization';
import ToolCard from '../components/ToolCard';
import ToolRunnerView from './ToolRunnerView';
import { isGeminiAvailable } from '../services/geminiService';
import Modal from '../components/Modal';

const ToolsView: React.FC = () => {
  const { t } = useLocalization();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showApiErrorModal, setShowApiErrorModal] = useState(false);

  const categories = useMemo(() => {
    const categoryMap: { [key: string]: Tool[] } = {};
    TOOLS.forEach(tool => {
      if (!categoryMap[tool.categoryKey]) {
        categoryMap[tool.categoryKey] = [];
      }
      categoryMap[tool.categoryKey].push(tool);
    });
    return Object.entries(categoryMap);
  }, []);
  
  const handleSelectTool = (tool: Tool) => {
    if (!isGeminiAvailable) {
        setShowApiErrorModal(true);
    } else {
        setSelectedTool(tool);
    }
  };

  const handleBack = () => {
    setSelectedTool(null);
  };
  
  if (selectedTool) {
    return <ToolRunnerView tool={selectedTool} onBack={handleBack} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('tools')}</h1>
      <div className="space-y-8">
        {categories.map(([categoryKey, tools]) => (
          <div key={categoryKey}>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">{t(categoryKey)}</h2>
            <div className="grid grid-cols-1 gap-4">
              {tools.map(tool => (
                <ToolCard key={tool.id} tool={tool} onSelect={handleSelectTool} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Modal
        isOpen={showApiErrorModal}
        onClose={() => setShowApiErrorModal(false)}
        title={t('api_unavailable_title')}
      >
        <div className="text-center p-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/50 mb-4">
                <i className="fa-solid fa-triangle-exclamation text-2xl text-orange-500"></i>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
                {t('api_unavailable_body')}
            </p>
        </div>
      </Modal>
    </div>
  );
};

export default ToolsView;