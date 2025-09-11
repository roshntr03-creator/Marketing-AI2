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

    // Memoize featured tools to prevent recalculation on re-renders
    const featuredTools = React.useMemo(() => 
        TOOLS.filter(tool => 
            ['seo_assistant', 'video_script_assistant', 'ads_ai_assistant'].includes(tool.id)
        ), 
    []);

    const handleToolSelect = React.useCallback((_tool: Tool) => {
        triggerHapticFeedback();
        // Navigate to the tools view, a real implementation might pass the tool ID
        // to pre-select it.
        setCurrentView('tools');
    }, [setCurrentView]);

    return (
        <div className="animate-fade-in space-y-8">
            {/* Personalized Greeting */}
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('welcome_back')},
                </h1>
                <p className="text-gray-600 dark:text-gray-400 truncate text-lg">
                    {user?.displayName || user?.email}
                </p>
            </header>

            {/* Featured Tools Section */}
            <section aria-labelledby="featured-tools-heading">
                <h2 id="featured-tools-heading" className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">{t('featured_tools')}</h2>
                <div className="grid grid-cols-1 gap-4">
                    {featuredTools.map((tool, index) => (
                        <div key={tool.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <ToolCard tool={tool} onSelect={handleToolSelect} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Marketing Tip Section */}
            <section aria-labelledby="marketing-tip-heading">
                <h2 id="marketing-tip-heading" className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">{t('marketing_tip')}</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-start space-x-4 rtl:space-x-reverse animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex-shrink-0 pt-1">
                        <i className="fa-solid fa-lightbulb text-4xl text-yellow-400"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('tip_title')}</h3>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            {t('tip_content')}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default React.memo(DashboardView);
