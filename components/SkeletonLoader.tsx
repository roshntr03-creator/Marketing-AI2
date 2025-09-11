import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow w-full animate-pulse" aria-hidden="true">
      {/* Title Skeleton */}
      <div className="h-7 bg-gray-300 dark:bg-gray-700 rounded-md w-3/4 mb-6"></div>
      
      {/* Section 1 Skeleton */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-md w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-md w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-md w-4/6"></div>
      </div>
      
      {/* Section 2 Skeleton */}
      <div className="mt-8 space-y-3">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-md w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-md w-5/6"></div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
