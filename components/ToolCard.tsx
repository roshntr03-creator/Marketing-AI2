import React from 'react';
import { type Tool } from '../types.ts';
import { useLocalization } from '../hooks/useLocalization.ts';
import { useTheme } from '../hooks/useTheme.ts';

interface ToolCardProps {
  tool: Tool;
  onSelect: (tool: Tool) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const { t } = useLocalization();
  const { theme } = useTheme();

  const cardClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
    : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm';
  const iconBgClasses = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const titleClasses = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const descriptionClasses = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const chevronClasses = theme === 'dark' ? 'text-gray-500' : 'text-gray-400';

  return (
    <button
      onClick={() => onSelect(tool)}
      className={`w-full text-left p-4 rounded-lg transition-colors duration-200 border flex items-center space-x-4 rtl:space-x-reverse ${cardClasses}`}
    >
      <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${iconBgClasses}`}>
        <i className={`${tool.icon} text-cyan-400 text-2xl`}></i>
      </div>
      <div className="flex-grow">
        <h3 className={`font-bold text-lg ${titleClasses}`}>{t(tool.nameKey)}</h3>
        <p className={`text-sm ${descriptionClasses}`}>{t(tool.descriptionKey)}</p>
      </div>
      <div>
        <i className={`fa-solid fa-chevron-right text-gray-500 rtl:fa-chevron-left ${chevronClasses}`}></i>
      </div>
    </button>
  );
};

export default ToolCard;