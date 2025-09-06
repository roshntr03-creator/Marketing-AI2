
import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { triggerHapticFeedback } from '../lib/haptics';

type View = 'dashboard' | 'tools' | 'analytics' | 'settings';

interface BottomNavBarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const navItems: { view: View; icon: string; labelKey: string }[] = [
  { view: 'dashboard', icon: 'fa-solid fa-house', labelKey: 'dashboard' },
  { view: 'tools', icon: 'fa-solid fa-wand-magic-sparkles', labelKey: 'tools' },
  { view: 'analytics', icon: 'fa-solid fa-chart-line', labelKey: 'analytics' },
  { view: 'settings', icon: 'fa-solid fa-gear', labelKey: 'settings' },
];

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, setCurrentView }) => {
  const { t } = useLocalization();

  const handlePress = (view: View) => {
    triggerHapticFeedback();
    setCurrentView(view);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => handlePress(item.view)}
            className={`flex flex-col items-center justify-center w-full h-full text-sm transition-colors duration-200 
              ${currentView === item.view ? 'text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:text-cyan-400 dark:hover:text-cyan-300'}`}
          >
            <i className={`${item.icon} text-xl mb-1`}></i>
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavBar;
