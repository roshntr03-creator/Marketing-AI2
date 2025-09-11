import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { type Theme, type Language } from './types.ts';
import { LanguageContext } from './hooks/useLocalization.ts';
import { ThemeContext } from './hooks/useTheme.ts';
import translations from './i18n/translations.ts';
import BottomNavBar from './components/BottomNavBar.tsx';
import LoadingSpinner from './components/LoadingSpinner.tsx';
import { useAuth } from './hooks/useAuth.ts';
import { auth } from './lib/firebaseClient.ts';
import { ToastProvider } from './components/ToastProvider.tsx';

// Lazy load views for better initial performance
const LoginView = lazy(() => import('./views/LoginView.tsx'));
const DashboardView = lazy(() => import('./views/DashboardView.tsx'));
const ToolsView = lazy(() => import('./views/ToolsView.tsx'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView.tsx'));
const SettingsView = lazy(() => import('./views/SettingsView.tsx'));

type View = 'dashboard' | 'tools' | 'analytics' | 'settings';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang === 'en' || storedLang === 'ar') {
      return storedLang;
    }
    return 'ar'; // Default to Arabic
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const setLanguage = (newLang: Language) => setLanguageState(newLang);

  const t = useMemo(() => (key: string, replacements?: Record<string, string | number>): string => {
    const langKey = language as keyof typeof translations;
    let translation = translations[langKey]?.[key as keyof typeof translations.en] || key;
    
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
      });
    }

    return translation;
  }, [language]);

  const languageContextValue = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  const themeContextValue = useMemo(() => ({ theme, setTheme }), [theme]);
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const FullScreenLoader: React.FC = () => (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner />
      </div>
  );

  if (authLoading) {
    return <FullScreenLoader />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView setCurrentView={setCurrentView} />;
      case 'tools':
        return <ToolsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView user={user} onLogout={handleLogout} />;
      default:
        return <DashboardView setCurrentView={setCurrentView} />;
    }
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <LanguageContext.Provider value={languageContextValue}>
        <ToastProvider>
          <Suspense fallback={<FullScreenLoader />}>
            {user ? (
              <div className="flex flex-col h-screen font-sans">
                <main className="flex-grow overflow-y-auto bg-gradient-animated text-gray-900 dark:text-gray-100 p-4 pb-20">
                  {renderView()}
                </main>
                <BottomNavBar currentView={currentView} setCurrentView={setCurrentView} />
              </div>
            ) : (
              <LoginView />
            )}
          </Suspense>
        </ToastProvider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;