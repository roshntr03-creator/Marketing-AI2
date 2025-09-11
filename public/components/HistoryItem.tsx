import React from 'react';
import { type Generation, type Tool } from '../types.ts';
import { useLocalization } from '../hooks/useLocalization.ts';
import { triggerHapticFeedback } from '../lib/haptics.ts';

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
            className="w-full text-left p-4 rounded-xl transition-all duration-300 border flex items-center space-x-4 rtl:space-x-reverse 
                       bg-white dark:bg-gray-800 
                       border-gray-200 dark:border-gray-700 
                       hover:shadow-lg hover:border-cyan-400 dark:hover:border-cyan-500 
                       hover:-translate-y-1"
            aria-label={`View generation from ${formattedDate} using ${tool ? t(tool.nameKey) : 'Unknown Tool'}`}
        >
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900/50">
                <i className={`${tool?.icon || 'fa-solid fa-question'} text-cyan-500 dark:text-cyan-400 text-2xl`}></i>
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{tool ? t(tool.nameKey) : 'Unknown Tool'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('generated_on')} {formattedDate}</p>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
                <i className="fa-solid fa-chevron-right rtl:fa-chevron-left"></i>
            </div>
        </button>
    );
};

export default React.memo(HistoryItem);