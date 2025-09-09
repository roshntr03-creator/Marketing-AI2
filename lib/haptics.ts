
export const triggerHapticFeedback = () => {
  // التحقق من دعم الاهتزاز والتأكد من أنه متاح
  if (typeof window !== 'undefined' && 
      window.navigator && 
      typeof window.navigator.vibrate === 'function') {
    // A light vibration pattern
    try {
      window.navigator.vibrate(50);
    } catch (error) {
      // تجاهل الأخطاء إذا فشل الاهتزاز
      console.warn('Haptic feedback not supported:', error);
    }
  }
};
