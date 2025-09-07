import React, { useEffect, useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../lib/supabaseClient';
import { type Generation, type Tool } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { TOOLS } from '../constants';
import HistoryItem from '../components/HistoryItem';
import Modal from '../components/Modal';
import GeneratedContent from '../components/GeneratedContent';
import AnalyticsChart from '../components/AnalyticsChart';

const AnalyticsView: React.FC = () => {
    const { t } = useLocalization();
    const [history, setHistory] = useState<Generation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<Generation | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('generations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching history:', error);
                setError(error.message);
            } else {
                setHistory(data as Generation[]);
            }
            setLoading(false);
        };

        fetchHistory();
    }, []);
    
    const findToolById = (toolId: string): Tool | undefined => {
        return TOOLS.find(tool => tool.id === toolId);
    }

    const renderHistory = () => {
        if (loading) {
            return <LoadingSpinner />;
        }
        if (error) {
            return <p className="text-center text-red-500">{error}</p>;
        }
        if (history.length === 0) {
            return (
                <div className="text-center py-10">
                    <i className="fa-solid fa-clock-rotate-left text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-xl font-semibold">{t('no_history_title')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('no_history_desc')}</p>
                </div>
            );
        }
        return (
            <div className="space-y-3">
                {history.map(item => (
                    <HistoryItem 
                        key={item.id} 
                        generation={item} 
                        tool={findToolById(item.tool_id)}
                        onSelect={() => setSelectedHistoryItem(item)}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('analytics')}</h1>
            
            {/* Analytics Preview Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('analytics_preview')}</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-4">{t('analytics_preview_desc')}</p>
                    <AnalyticsChart />
                </div>
            </div>

            {/* Generation History Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('generation_history')}</h2>
                {renderHistory()}
            </div>
            
            {selectedHistoryItem && (
                 <Modal 
                    isOpen={!!selectedHistoryItem} 
                    onClose={() => setSelectedHistoryItem(null)} 
                    title={findToolById(selectedHistoryItem.tool_id)?.nameKey ? t(findToolById(selectedHistoryItem.tool_id)!.nameKey) : 'Result'}
                >
                   {selectedHistoryItem.tool_id === 'video_generator' ? (
                       <div>
                           <h3 className="text-lg font-semibold mb-2">Video Prompt</h3>
                           <p className="whitespace-pre-wrap p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                               {selectedHistoryItem.output as any as string}
                           </p>
                       </div>
                   ) : (
                       <GeneratedContent data={selectedHistoryItem.output} />
                   )}
                </Modal>
            )}
        </div>
    );
};

export default AnalyticsView;