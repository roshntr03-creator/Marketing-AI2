import React from 'react';
import { type Generation, type Tool } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { triggerHapticFeedback } from '../lib/haptics';

interface HistoryItemProps {
    generation: Generation;
    tool: Tool | undefined;
    onSelect: (generation: Generation) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ generation, tool, onSelect }) => {
    const { t, language } = useLocalization();

    const handlePress = () => {
        triggerHapticFeedback();
        onSelect(generation);
    };

    const formattedDate = new Date(generation.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <button 
            onClick={handlePress}
            className="w-full text-left p-4 rounded-lg transition-colors duration-200 border flex items-center space-x-4 rtl:space-x-reverse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900">
                <i className={`${tool?.icon || 'fa-solid fa-question'} text-cyan-400 text-2xl`}></i>
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{tool ? t(tool.nameKey) : 'Unknown Tool'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('generated_on')} {formattedDate}</p>
            </div>
            <div>
                <i className="fa-solid fa-chevron-right text-gray-400 dark:text-gray-500 rtl:fa-chevron-left"></i>
            </div>
        </button>
    );
};

export default HistoryItem;