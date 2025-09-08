import type { User as FirebaseUser } from 'firebase/auth';

export type Theme = 'light' | 'dark';

export type Language = 'en' | 'ar';

export interface InputField {
  name: string;
  type: 'text' | 'textarea' | 'image';
  labelKey: string;
  placeholderKey: string;
}

export interface Tool {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  categoryKey: string;
  inputs: InputField[];
}

export interface GeneratedContentData {
  title: string;
  sections: {
    heading: string;
    content: string | string[];
  }[];
  sources?: { uri: string; title: string }[];
}

export interface Generation {
  id: string;
  created_at: string;
  tool_id: string;
  inputs: Record<string, string | File>;
  output: GeneratedContentData;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}


// Re-exporting Firebase user type for consistent imports
export type User = FirebaseUser;

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}