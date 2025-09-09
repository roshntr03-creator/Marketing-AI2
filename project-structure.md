# Marketing AI - Project Structure

This document outlines the complete project structure with English filenames only.

## Root Files
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `index.html` - Main HTML entry point
- `README.md` - Project documentation
- `manifest.json` - PWA manifest
- `metadata.json` - Project metadata
- `firebase.json` - Firebase configuration
- `.firebaserc` - Firebase project settings
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore database indexes
- `.gitignore` - Git ignore patterns

## Source Code Structure
```
src/
├── App.tsx                 # Main application component
├── index.tsx              # Application entry point
├── index.css              # Global styles
├── types.ts               # TypeScript type definitions
├── constants.ts           # Application constants
├── components/            # Reusable UI components
│   ├── AnalyticsChart.tsx
│   ├── BottomNavBar.tsx
│   ├── GeneratedContent.tsx
│   ├── HistoryItem.tsx
│   ├── HistoryItemSkeleton.tsx
│   ├── ImageUpload.tsx
│   ├── LoadingSpinner.tsx
│   ├── Logo.tsx
│   ├── LottieAnimation.tsx
│   ├── Modal.tsx
│   ├── SkeletonLoader.tsx
│   ├── ToastProvider.tsx
│   └── ToolCard.tsx
├── views/                 # Main application views
│   ├── AnalyticsView.tsx
│   ├── DashboardView.tsx
│   ├── LoginView.tsx
│   ├── SettingsView.tsx
│   ├── ToolRunnerView.tsx
│   └── ToolsView.tsx
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   ├── useHistory.ts
│   ├── useLocalization.ts
│   ├── useSettings.ts
│   ├── useTheme.ts
│   ├── useToasts.ts
│   └── useToolRunner.ts
├── lib/                   # Core utilities
│   ├── firebaseClient.ts
│   ├── haptics.ts
│   └── supabaseClient.ts
├── services/              # API services
│   ├── geminiService.ts
│   └── gemini/
│       ├── api.ts
│       ├── parser.ts
│       └── prompts.ts
├── i18n/                  # Internationalization
│   └── translations.ts
└── assets/                # Static assets
    └── generatingAnimation.ts
```

## Firebase Structure
```
firebase/
└── functions/             # Cloud Functions
    ├── package.json
    ├── tsconfig.json
    └── index.ts
```

## Key Features
- All filenames are in English
- Proper TypeScript structure
- Modular component architecture
- Internationalization support (Arabic/English)
- Firebase integration
- PWA capabilities

## File Naming Conventions
- Components: PascalCase (e.g., `ToolCard.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useAuth.ts`)
- Services: camelCase (e.g., `geminiService.ts`)
- Views: PascalCase with 'View' suffix (e.g., `LoginView.tsx`)
- Utilities: camelCase (e.g., `firebaseClient.ts`)
- Constants: camelCase (e.g., `constants.ts`)

All files follow English naming conventions to ensure compatibility with Git, GitHub, and international development teams.