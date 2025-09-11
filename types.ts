import type { User as FirebaseUser } from 'firebase/auth';

/** Represents the UI theme of the application. */
export type Theme = 'light' | 'dark';

/** Represents the supported languages for localization. */
export type Language = 'en' | 'ar';

/** Defines the structure for a dynamic input field in a tool's form. */
export interface InputField {
  name: string;
  type: 'text' | 'textarea' | 'image';
  labelKey: string;
  placeholderKey: string;
}

/** Defines the structure of a marketing tool available in the application. */
export interface Tool {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  categoryKey: string;
  inputs: InputField[];
}

/** Represents the structured data returned by the AI for generated content. */
export interface GeneratedContentData {
  title: string;
  sections: {
    heading: string;
    content: string | string[];
  }[];
  sources?: { uri: string; title: string }[];
}

/** Represents a single generation event stored in the user's history. */
export interface Generation {
  id: string;
  created_at: string; // Stored as ISO string for consistency
  tool_id: string;
  inputs: Record<string, string>; // Stored as strings only
  output: GeneratedContentData | string; // String for video prompts
}

/** Represents the type of a toast notification. */
export type ToastType = 'success' | 'error' | 'info';

/** Defines the structure of a single toast message. */
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

/** Defines the context type for showing toast notifications. */
export interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

/** Re-exporting Firebase user type for consistent imports across the app. */
export type User = FirebaseUser;

/** Defines the context type for authentication state. */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
}
