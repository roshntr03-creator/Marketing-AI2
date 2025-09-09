import React from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { TOOLS } from '../constants.ts';
import ToolCard from '../components/ToolCard.tsx';
import { type Tool } from '../types.ts';
import { triggerHapticFeedback } from '../lib/haptics.ts';

interface DashboardViewProps {
  setCurrentView: (view: 'dashboard' | 'tools' | 'analytics' | 'settings') => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ setCurrentView }) => {
    const { t } = useLocalization();
    const { user } = useAuth();

    const featuredTools = TOOLS.filter(tool => 
        ['seo_assistant', 'video_script_assistant', 'ads_ai_assistant'].includes(tool.id)
    );

    const handleToolSelect = (_tool: Tool) => {
        triggerHapticFeedback();
        setCurrentView('tools');
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Personalized Greeting */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('welcome_back')},
                </h1>
                <p className="text-gray-600 dark:text-gray-400 truncate">
                    {user?.email}
                </p>
            </div>

            {/* Featured Tools Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('featured_tools')}</h2>
                <div className="grid grid-cols-1 gap-4">
                    {featuredTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onSelect={handleToolSelect} />
                    ))}
                </div>
            </div>

            {/* Marketing Tip Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('marketing_tip')}</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-start space-x-4 rtl:space-x-reverse">
                    <div className="flex-shrink-0 pt-1">
                        <i className="fa-solid fa-lightbulb text-3xl text-yellow-400"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('tip_title')}</h3>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            {t('tip_content')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;