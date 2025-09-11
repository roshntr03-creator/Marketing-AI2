/**
 * Triggers haptic feedback (vibration) on supported devices.
 * This enhances the user experience by providing physical feedback for
 * actions like button presses, making the app feel more responsive.
 * It checks for browser support before attempting to vibrate.
 */
export const triggerHapticFeedback = () => {
  if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
    // A short and light vibration pattern for a subtle feedback
    window.navigator.vibrate(50);
  }
};
