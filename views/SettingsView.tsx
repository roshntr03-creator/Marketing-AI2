import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme.ts';
import { useLocalization } from '../hooks/useLocalization.ts';
import { type User } from '../types.ts';
import { useSettings } from '../hooks/useSettings.ts';
import Modal from '../components/Modal.tsx';

interface SettingsViewProps {
  user: User | null;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLocalization();
  const {
    fullName,
    setFullName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loadingProfile,
    loadingPassword,
    handleProfileUpdate,
    handlePasswordUpdate,
  } = useSettings(user);
  
  const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('profile')}</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-500 dark:text-gray-400">{t('email_address')}</label>
                <input id="email" type="email" value={user?.email || ''} disabled className="mt-1 w-full p-2 bg-gray-200 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md" />
            </div>
            <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-500 dark:text-gray-400">{t('full_name')}</label>
                <input id="full_name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('full_name')} className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
            <button type="submit" disabled={loadingProfile} className="px-4 py-2 bg-cyan-500 text-white font-semibold rounded-md hover:bg-cyan-600 disabled:bg-cyan-300">
                {loadingProfile ? '...' : t('save_profile')}
            </button>
          </form>
        </div>
        
        {/* Security Settings */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('security')}</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-500 dark:text-gray-400">{t('new_password')}</label>
                <input id="new_password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
             <div>
                <label htmlFor="confirm_new_password" className="block text-sm font-medium text-gray-500 dark:text-gray-400">{t('confirm_new_password')}</label>
                <input id="confirm_new_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"/>
            </div>
            <button type="submit" disabled={loadingPassword} className="px-4 py-2 bg-cyan-500 text-white font-semibold rounded-md hover:bg-cyan-600 disabled:bg-cyan-300">
                {loadingPassword ? '...' : t('change_password')}
            </button>
          </form>
        </div>

        {/* Subscription Settings */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('subscription')}</h2>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-600 dark:text-gray-400">{t('current_plan')}: <span className="font-bold text-cyan-500">{t('free_plan')}</span></p>
            </div>
            <button onClick={() => setSubscriptionModalOpen(true)} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600">
                {t('upgrade_to_pro')}
            </button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('theme')}</h2>
          <div className="flex space-x-4 rtl:space-x-reverse">
            <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-md transition-colors ${theme === 'light' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <i className="fa-solid fa-sun mr-2"></i>{t('light')}
            </button>
            <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-md transition-colors ${theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <i className="fa-solid fa-moon mr-2"></i>{t('dark')}
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('language')}</h2>
          <div className="flex space-x-4 rtl:space-x-reverse">
            <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-md transition-colors ${language === 'en' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {t('english')}
            </button>
            <button onClick={() => setLanguage('ar')} className={`px-4 py-2 rounded-md transition-colors ${language === 'ar' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {t('arabic')}
            </button>
          </div>
        </div>
        
        {/* Troubleshooting Section */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">{t('troubleshooting')}</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className="flex-shrink-0 pt-1">
                  <i className="fa-solid fa-cogs text-cyan-400 text-xl"></i>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('firebase_config_help_title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t('firebase_config_help_content')}
                    </p>
                </div>
            </div>
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className="flex-shrink-0 pt-1">
                  <i className="fa-solid fa-server text-cyan-400 text-xl"></i>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('backend_functions_help_title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t('backend_functions_help_content')}
                    </p>
                </div>
            </div>
          </div>
        </div>


        {/* Logout */}
        <div className="mt-8">
            <button onClick={onLogout} className="w-full text-left p-4 rounded-lg bg-white dark:bg-gray-800 shadow hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <span className="text-red-500 font-semibold"><i className="fa-solid fa-arrow-right-from-bracket mr-3"></i>{t('logout')}</span>
            </button>
        </div>
      </div>
      
      <Modal isOpen={isSubscriptionModalOpen} onClose={() => setSubscriptionModalOpen(false)} title={t('upgrade_to_pro')}>
        <div className="text-center">
            <i className="fa-solid fa-rocket text-4xl text-green-500 mb-4"></i>
            <h3 className="text-2xl font-bold mb-2">{t('pro_features_coming_soon')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('pro_features_desc')}</p>
            <ul className="text-left space-y-2">
                <li className="flex items-center"><i className="fa-solid fa-check-circle text-green-500 mr-3"></i> {t('pro_feature_1')}</li>
                <li className="flex items-center"><i className="fa-solid fa-check-circle text-green-500 mr-3"></i> {t('pro_feature_2')}</li>
                <li className="flex items-center"><i className="fa-solid fa-check-circle text-green-500 mr-3"></i> {t('pro_feature_3')}</li>
            </ul>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsView;