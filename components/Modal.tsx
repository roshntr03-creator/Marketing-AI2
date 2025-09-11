import React, { useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const { t } = useLocalization();
  
  // Effect to handle closing the modal with the 'Escape' key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" aria-label={t('close')}>
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-grow">
          {children}
        </main>
        <footer className="p-4 border-t dark:border-gray-700 text-right flex-shrink-0">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
                {t('close')}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default Modal;
