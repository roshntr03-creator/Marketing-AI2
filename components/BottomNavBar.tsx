import React from 'react';
import { useLocalization } from '../hooks/useLocalization.ts';
import { triggerHapticFeedback } from '../lib/haptics.ts';

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
    // Only switch and trigger feedback if the view is different
    if (view !== currentView) {
        triggerHapticFeedback();
        setCurrentView(view);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => handlePress(item.view)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md
                ${isActive 
                  ? 'text-cyan-500 dark:text-cyan-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-300'
                }`}
            >
              <i className={`${item.icon} text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}></i>
              <span className="mt-1 transition-opacity duration-300">{t(item.labelKey)}</span>
              {isActive && (
                <div className="absolute bottom-1 w-5 h-1 bg-cyan-500 dark:bg-cyan-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  );
};

export default React.memo(BottomNavBar);
