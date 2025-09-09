import React from 'react';
import { useTheme } from '../hooks/useTheme.ts';

const AnalyticsChart: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const barHeights = [40, 60, 50, 75, 65, 85, 95];

    return (
        <div className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-end justify-around space-x-2 rtl:space-x-reverse">
            {barHeights.map((height, index) => (
                <div key={index} className="w-full bg-cyan-400/50 rounded-t-md animate-pulse" style={{ 
                    height: `${height}%`,
                    animationDelay: `${index * 100}ms`
                }}>
                    <div 
                        className="w-full bg-cyan-400 rounded-t-md transition-all duration-500"
                        style={{ height: '100%' }}
                    ></div>
                </div>
            ))}
        </div>
    );
};

export default AnalyticsChart;