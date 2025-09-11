import React from 'react';

const AnalyticsChart: React.FC = () => {
    const barData = [
        { height: 40, delay: 0 },
        { height: 60, delay: 100 },
        { height: 50, delay: 200 },
        { height: 75, delay: 300 },
        { height: 65, delay: 400 },
        { height: 85, delay: 500 },
        { height: 95, delay: 600 },
    ];

    return (
        <div className="w-full h-48 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl flex items-end justify-around space-x-2 rtl:space-x-reverse shadow-lg">
            {barData.map(({ height, delay }, index) => (
                <div 
                    key={index} 
                    className="w-full bg-cyan-400/30 dark:bg-cyan-500/30 rounded-t-md" 
                    style={{ height: `${height}%` }}
                >
                    <div 
                        className="w-full bg-cyan-400 dark:bg-cyan-500 rounded-t-md animate-pulse"
                        style={{ height: '100%', animationDelay: `${delay}ms`, animationDuration: '2s' }}
                    ></div>
                </div>
            ))}
        </div>
    );
};

export default React.memo(AnalyticsChart);
