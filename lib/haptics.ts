
export const triggerHapticFeedback = () => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    // A light vibration pattern
    window.navigator.vibrate(50);
  }
};
