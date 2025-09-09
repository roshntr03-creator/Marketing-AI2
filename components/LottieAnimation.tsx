import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../assets/generatingAnimation.ts';
import { useLocalization } from '../hooks/useLocalization.ts';

const LottieAnimation: React.FC = () => {
    const { t } = useLocalization();

    return (
        <div className="flex justify-center items-center" aria-label={t('generating_animation_label')}>
            <div className="w-64 h-48">
                 <Lottie 
                    animationData={animationData} 
                    loop={true} 
                    autoplay={true}
                />
            </div>
        </div>
    );
};

export default LottieAnimation;