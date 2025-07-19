import { useState, useEffect } from 'react';

export interface BrowserCompatibility {
  isSupported: boolean;
  browser: string;
  version: string;
  warnings: string[];
  unsupportedFeatures: string[];
  recommendations: string[];
}

export function useBrowserCompatibility(): BrowserCompatibility {
  const [compatibility, setCompatibility] = useState<BrowserCompatibility>({
    isSupported: true,
    browser: 'Unknown',
    version: 'Unknown',
    warnings: [],
    unsupportedFeatures: [],
    recommendations: [],
  });

  useEffect(() => {
    const checkCompatibility = () => {
      const userAgent = navigator.userAgent;
      const warnings: string[] = [];
      const unsupportedFeatures: string[] = [];
      const recommendations: string[] = [];

      // Detect browser
      let browser = 'Unknown';
      let version = 'Unknown';
      let isSupported = true;

      if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
        const match = userAgent.match(/Chrome\/(\d+)/);
        version = match?.[1] ?? 'Unknown';
        if (parseInt(version) < 80) {
          isSupported = false;
          recommendations.push('Please update Chrome to version 80 or later');
        }
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
        const match = userAgent.match(/Firefox\/(\d+)/);
        version = match?.[1] ?? 'Unknown';
        if (parseInt(version) < 75) {
          isSupported = false;
          recommendations.push('Please update Firefox to version 75 or later');
        }
      } else if (userAgent.includes('Safari')) {
        browser = 'Safari';
        const match = userAgent.match(/Version\/(\d+)/);
        version = match?.[1] ?? 'Unknown';
        if (parseInt(version) < 13) {
          isSupported = false;
          recommendations.push('Please update Safari to version 13 or later');
        }
      } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
        const match = userAgent.match(/Edg\/(\d+)/);
        version = match?.[1] ?? 'Unknown';
        if (parseInt(version) < 80) {
          isSupported = false;
          recommendations.push('Please update Edge to version 80 or later');
        }
      } else {
        isSupported = false;
        recommendations.push('Please use Chrome, Firefox, Safari, or Edge for the best experience');
      }

      // Check for Web Audio API support
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        unsupportedFeatures.push('Web Audio API');
        warnings.push('Audio playback and generation features may not work properly');
      }

      // Check for File API support
      if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        unsupportedFeatures.push('File API');
        warnings.push('File upload features may not work properly');
      }

      // Check for WebSocket support
      if (!window.WebSocket) {
        unsupportedFeatures.push('WebSocket');
        warnings.push('Real-time features may not work properly');
      }

      // Check for localStorage support
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
      } catch (e) {
        unsupportedFeatures.push('Local Storage');
        warnings.push('Settings and drafts may not be saved locally');
      }

      // Check for Intersection Observer support
      if (!window.IntersectionObserver) {
        unsupportedFeatures.push('Intersection Observer');
        warnings.push('Some performance optimizations may not work');
      }

      // Check for CSS Grid support
      if (!CSS.supports('display', 'grid')) {
        unsupportedFeatures.push('CSS Grid');
        warnings.push('Layout may not display correctly');
      }

      // Check for ES6+ features
      try {
        eval('const test = () => {}; class Test {}');
      } catch (e) {
        unsupportedFeatures.push('Modern JavaScript');
        isSupported = false;
        recommendations.push('Please update your browser to support modern JavaScript');
      }

      // Mobile-specific checks
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        if (browser === 'Safari' && parseInt(version) < 14) {
          warnings.push('Some audio features may be limited on older iOS versions');
        }
        
        if (browser === 'Chrome' && parseInt(version) < 85) {
          warnings.push('Some features may be limited on older Android Chrome versions');
        }
      }

      // Internet Explorer check
      if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
        isSupported = false;
        browser = 'Internet Explorer';
        recommendations.push('Internet Explorer is not supported. Please use a modern browser like Chrome, Firefox, Safari, or Edge');
      }

      setCompatibility({
        isSupported,
        browser,
        version,
        warnings,
        unsupportedFeatures,
        recommendations,
      });
    };

    checkCompatibility();
  }, []);

  return compatibility;
}