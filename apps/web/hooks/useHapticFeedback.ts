import { useCallback } from 'react';

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification';

interface HapticFeedbackOptions {
  enabled?: boolean;
  fallback?: boolean;
}

export function useHapticFeedback(options: HapticFeedbackOptions = {}) {
  const { enabled = true, fallback = false } = options;

  const triggerHaptic = useCallback((pattern: HapticPattern = 'light') => {
    if (!enabled) return;

    if ('vibrate' in navigator && navigator.vibrate) {
      switch (pattern) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'selection':
          navigator.vibrate(5);
          break;
        case 'impact':
          navigator.vibrate([30, 10, 30]);
          break;
        case 'notification':
          navigator.vibrate([50, 25, 50]);
          break;
        default:
          navigator.vibrate(10);
      }
    } else if (fallback && 'AudioContext' in window) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, [enabled, fallback]);

  const triggerSuccess = useCallback(() => {
    triggerHaptic('notification');
  }, [triggerHaptic]);

  const triggerError = useCallback(() => {
    triggerHaptic('heavy');
  }, [triggerHaptic]);

  const triggerSelection = useCallback(() => {
    triggerHaptic('selection');
  }, [triggerHaptic]);

  const triggerImpact = useCallback(() => {
    triggerHaptic('impact');
  }, [triggerHaptic]);

  const isSupported = 'vibrate' in navigator;

  return {
    triggerHaptic,
    triggerSuccess,
    triggerError,
    triggerSelection,
    triggerImpact,
    isSupported
  };
}