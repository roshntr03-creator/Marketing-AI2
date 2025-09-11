import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div role="status" aria-label="Loading" className="flex justify-center items-center p-4">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent dark:border-cyan-400 dark:border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
