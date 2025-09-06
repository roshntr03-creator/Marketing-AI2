import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { useLocalization } from '../hooks/useLocalization';
import { type User } from '../types';

interface SettingsViewProps {
  user: User | null;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLocalization();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>

      {user && (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400">Logged in as:</p>
          <p className="font-semibold text-lg">{user.email}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('theme')}</h2>
          <div className="flex space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded-md transition-colors ${theme === 'light' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <i className="fa-solid fa-sun mr-2"></i>{t('light')}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded-md transition-colors ${theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <i className="fa-solid fa-moon mr-2"></i>{t('dark')}
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('language')}</h2>
          <div className="flex space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-md transition-colors ${language === 'en' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              {t('english')}
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`px-4 py-2 rounded-md transition-colors ${language === 'ar' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              {t('arabic')}
            </button>
          </div>
        </div>
        
        {/* Troubleshooting Section */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('troubleshooting')}</h2>
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="flex-shrink-0 pt-1">
                <i className="fa-solid fa-circle-question text-cyan-400 text-xl"></i>
              </div>
              <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('api_key_help_title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('api_key_help_content')}
                  </p>
              </div>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-8">
            <button
                onClick={onLogout}
                className="w-full text-left p-4 rounded-lg bg-white dark:bg-gray-800 shadow hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <span className="text-red-500 font-semibold"><i className="fa-solid fa-arrow-right-from-bracket mr-3"></i>{t('logout')}</span>
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;