import React, { useState, useEffect, useMemo } from 'react';
import { type Theme, type Language } from './types.ts';
import { LanguageContext } from './hooks/useLocalization.ts';
import { ThemeContext } from './hooks/useTheme.ts';
import translations from './i18n/translations.ts';
import LoginView from './views/LoginView.tsx';
import DashboardView from './views/DashboardView.tsx';
import ToolsView from './views/ToolsView.tsx';
import AnalyticsView from './views/AnalyticsView.tsx';
import SettingsView from './views/SettingsView.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import LoadingSpinner from './components/LoadingSpinner.tsx';
import { useAuth } from './hooks/useAuth.ts';
import { auth } from './lib/firebaseClient.ts';
import { signOut } from 'firebase/auth';
import { ToastProvider } from './components/ToastProvider.tsx';

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
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
  };

  const t = useMemo(() => (key: string): string => {
    const langKey = language as keyof typeof translations;
    if (translations[langKey] && (translations[langKey] as any)[key]) {
      return (translations[langKey] as any)[key];
    }
    return key;
  }, [language]);

  const languageContextValue = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  const themeContextValue = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  
  const handleLogout = async () => {
    await signOut(auth);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
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
          {user ? (
            <div className={`flex flex-col h-screen font-sans ${theme === 'dark' ? 'dark' : ''}`}>
              <main className="flex-grow overflow-y-auto bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 pb-20">
                {renderView()}
              </main>
              <BottomNavBar currentView={currentView} setCurrentView={setCurrentView} />
            </div>
          ) : (
            <LoginView />
          )}
        </ToastProvider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;