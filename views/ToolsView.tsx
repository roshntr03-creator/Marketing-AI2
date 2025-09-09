import React, { useState, useMemo } from 'react';
import { type Tool } from '../types.ts';
import { TOOLS } from '../constants.ts';
import { useLocalization } from '../hooks/useLocalization.ts';
import ToolCard from '../components/ToolCard.tsx';
import ToolRunnerView from './ToolRunnerView.tsx';

const ToolsView: React.FC = () => {
  const { t } = useLocalization();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

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
    setSelectedTool(tool);
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
    </div>
  );
};

export default ToolsView;