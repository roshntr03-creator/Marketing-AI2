import type { User, Session } from '@supabase/supabase-js';

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

// Re-exporting Supabase types for consistent imports
export type { User };

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}
