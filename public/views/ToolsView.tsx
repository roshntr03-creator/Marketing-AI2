import React, { useState, useMemo, useCallback } from 'react';
import { type Tool } from '../types.ts';
import { TOOLS } from '../constants.ts';
import { useLocalization } from '../hooks/useLocalization.ts';
import ToolCard from '../components/ToolCard.tsx';
import ToolRunnerView from './ToolRunnerView.tsx';

const ToolsView: React.FC = () => {
  const { t } = useLocalization();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  // Memoize categories to prevent re-computation on every render
  const categories = useMemo(() => {
    const categoryMap: { [key: string]: Tool[] } = {};
    TOOLS.forEach(tool => {
      const category = tool.categoryKey;
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(tool);
    });
    // Sort tools alphabetically within each category
    for (const category in categoryMap) {
        categoryMap[category].sort((a, b) => t(a.nameKey).localeCompare(t(b.nameKey)));
    }
    return Object.entries(categoryMap);
  }, [t]);
  
  const handleSelectTool = useCallback((tool: Tool) => {
    setSelectedTool(tool);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTool(null);
  }, []);
  
  if (selectedTool) {
    return <ToolRunnerView tool={selectedTool} onBack={handleBack} />;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">{t('tools')}</h1>
      <div className="space-y-8">
        {categories.map(([categoryKey, tools]) => (
          <section key={categoryKey} aria-labelledby={categoryKey}>
            <h2 id={categoryKey} className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">{t(categoryKey)}</h2>
            <div className="grid grid-cols-1 gap-4">
              {tools.map(tool => (
                <ToolCard key={tool.id} tool={tool} onSelect={handleSelectTool} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ToolsView;