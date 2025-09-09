import { createContext, useContext } from 'react';
import { type ToastContextType } from '../types.ts';

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToasts = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
};