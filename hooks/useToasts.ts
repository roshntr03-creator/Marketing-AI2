import { createContext, useContext } from 'react';
import { type ToastContextType } from '../types.ts';

/**
 * Creates a React Context for the toast notification system.
 * This will be used by the ToastProvider to make the `addToast` function
 * available to any component in the application.
 */
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * A custom hook for easy access to the toast notification context.
 * This simplifies the process of showing toasts from any component.
 * @throws {Error} If used outside of a ToastProvider.
 * @returns {ToastContextType} The context with the `addToast` function.
 */
export const useToasts = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider. Make sure your component is wrapped in it.');
  }
  return context;
};
