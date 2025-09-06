
import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

const AnalyticsView: React.FC = () => {
    const { t } = useLocalization();
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">{t('analytics')}</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <i className="fa-solid fa-chart-pie text-4xl text-cyan-400 mb-4"></i>
                <h2 className="text-xl font-semibold">Analytics Coming Soon!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Track your content performance and audience growth here.
                </p>
            </div>
        </div>
    );
};

export default AnalyticsView;
