import React, { useState, useCallback, useMemo } from 'react';
import { ToastContext } from '../hooks/useToasts';
import { type Toast, type ToastType } from '../types';

interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastComponent: React.FC<{ toast: Toast, onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 5000); // 5 seconds
        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    const iconClasses: Record<ToastType, string> = {
        success: 'fa-solid fa-check-circle text-green-500',
        error: 'fa-solid fa-times-circle text-red-500',
        info: 'fa-solid fa-info-circle text-blue-500',
    };
    
    const bgClasses: Record<ToastType, string> = {
        success: 'bg-green-50 dark:bg-green-900/50 border-green-400',
        error: 'bg-red-50 dark:bg-red-900/50 border-red-400',
        info: 'bg-blue-50 dark:bg-blue-900/50 border-blue-400',
    }

    return (
        <div className={`flex items-start w-full max-w-sm p-4 my-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${bgClasses[toast.type]} animate-fade-in-up`}>
            <div className="flex-shrink-0 text-xl">
                <i className={iconClasses[toast.type]}></i>
            </div>
            <div className="mx-3 text-sm font-normal">
                {toast.message}
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <i className="fa-solid fa-times"></i>
            </button>
        </div>
    );
};


export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-50">
        {toasts.map(toast => (
          <ToastComponent key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};