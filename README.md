# Marketing AI Assistant

An AI-powered marketing assistant for MENA businesses, offering tools for SEO, content creation, social media planning, and more, with full Arabic and English support.

## Features

- **SEO Content Assistant**: Generate SEO-optimized content briefs and keywords
- **Video Script Assistant**: Turn ideas into engaging video scripts
- **Social Media Optimizer**: Get growth strategies based on current trends
- **Influencer Discovery**: Find the best local influencers for your niche
- **AI Video Generator**: Generate high-quality videos from text prompts
- **Email Marketing Pro**: Write effective email campaigns
- **Customer Persona Generator**: Create detailed personas for your target audience
- **Short-form Factory**: Repurpose content into short-form video ideas
- **SMM Content Plan**: Create weekly content calendars
- **Ads AI Assistant**: Generate compelling ad copy

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase Functions, Google Gemini AI
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Deployment**: Firebase Hosting
- **PWA**: Service Worker support

## Prerequisites

- Node.js 18 or higher
- Firebase CLI
- Google AI API key

## Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd marketing-ai
npm install
```

### 2. Firebase Configuration
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Functions
3. Update `lib/firebaseClient.ts` with your Firebase config
4. Deploy Firestore rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Google AI API Setup
1. Get your API key from [Google AI Studio](https://aistudio.google.com)
2. Set it as a Firebase Functions secret:
```bash
firebase functions:secrets:set API_KEY
```

### 4. Deploy Firebase Functions
```bash
cd firebase/functions
npm install
cd ../..
firebase deploy --only functions
```

### 5. Run Development Server
```bash
npm run dev
```

## Project Structure

```
├── components/          # Reusable UI components
├── views/              # Main application views
├── hooks/              # Custom React hooks
├── services/           # API services and utilities
├── lib/                # Core utilities and configurations
├── i18n/               # Internationalization files
├── assets/             # Static assets
├── firebase/           # Firebase Functions
│   └── functions/      # Cloud Functions source code
├── firestore.rules     # Firestore security rules
└── firestore.indexes.json # Firestore indexes
```

## Features Overview

### Multi-language Support
- Full Arabic and English support
- RTL layout for Arabic
- Localized content and UI

### AI-Powered Tools
- Integration with Google Gemini AI
- Streaming responses for real-time feedback
- Video generation capabilities
- Grounded search for up-to-date information

### User Experience
- Progressive Web App (PWA)
- Dark/Light theme support
- Responsive design
- Haptic feedback on mobile
- Offline caching

### Security & Privacy
- Firebase Authentication
- Firestore security rules
- User data isolation
- Secure API key management

## Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Environment Variables
The app uses Firebase configuration and Google AI API key. Make sure to:
1. Configure Firebase project settings
2. Set API_KEY as a Functions secret
3. Deploy security rules and indexes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.