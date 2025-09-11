import { createContext, useContext } from 'react';
import { type Theme } from '../types.ts';

/**
 * Defines the shape of the context for theme management.
 * This provides the current theme ('light' or 'dark') and a function
 * to update it.
 */
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Creates a React Context for the theme state.
 * This allows any component in the tree to access and modify the theme.
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * A custom hook to easily access the theme context.
 * It provides a clean API for components to get the current theme and
 * the function to set a new theme.
 * @throws {Error} If used outside of a ThemeProvider.
 * @returns The theme context.
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider. Make sure your component is wrapped in it.');
  }
  return context;
};
