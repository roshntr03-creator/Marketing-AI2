
import React, { useState, useMemo } from 'react';
import { type Tool } from '../types';
import { TOOLS } from '../constants';
import { useLocalization } from '../hooks/useLocalization';
import ToolCard from '../components/ToolCard';
import ToolRunnerView from './ToolRunnerView';
import { isGeminiAvailable } from '../services/geminiService';

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

  if (!isGeminiAvailable) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">{t('tools')}</h1>
        <div className="bg-orange-100 dark:bg-orange-900/50 border-l-4 border-orange-500 text-orange-800 dark:text-orange-200 p-4 rounded-md" role="alert">
          <div className="flex">
            <div className="py-1"><i className="fa-solid fa-triangle-exclamation text-xl mr-3 text-orange-500"></i></div>
            <div>
              <p className="font-bold">AI Service Unavailable / خدمة الذكاء الاصطناعي غير متاحة</p>
              <p className="text-sm mt-1">
                The AI features are disabled because the API key is not configured. The administrator must set the `API_KEY` environment variable in the deployment settings.
                <br />
                ميزات الذكاء الاصطناعي معطلة لعدم وجود مفتاح API. يجب على المسؤول إعداد متغير البيئة `API_KEY` في إعدادات النشر.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
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