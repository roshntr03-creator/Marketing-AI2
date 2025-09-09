

import { createContext, useContext } from 'react';
import { type Language } from '../types.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLocalization = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LanguageProvider');
  }
  return context;
};