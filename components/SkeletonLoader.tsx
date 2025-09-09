import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow w-full animate-pulse">
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-4/6"></div>
      </div>
      <div className="mt-6 space-y-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
    </div>
  );
};

export default SkeletonLoader;