import { createContext, useContext } from 'react';
import { type Language } from '../types.ts';

/**
 * Defines the shape of the context for localization.
 * This provides the current language, a function to set it,
 * and the translation function `t`.
 */
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

/**
 * Creates a React Context for the localization state.
 * This allows any component in the tree to access localization features.
 */
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * A custom hook to easily access the localization context.
 * It provides a clean API for components to get the current language and
 * the translation function.
 * @throws {Error} If used outside of a LanguageProvider.
 * @returns The language context.
 */
export const useLocalization = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LanguageProvider. Make sure your component is wrapped in it.');
  }
  return context;
};