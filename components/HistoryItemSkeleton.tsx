import React from 'react';

const HistoryItemSkeleton: React.FC = () => {
    return (
        <div className="w-full text-left p-4 rounded-xl border flex items-center space-x-4 rtl:space-x-reverse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 animate-pulse" aria-hidden="true">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex-grow space-y-2">
                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>
    );
};

export default HistoryItemSkeleton;
