import { useState, useEffect } from 'react';

export type OrientationType = 'portrait' | 'landscape';

interface OrientationData {
  orientation: OrientationType;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

export function useOrientation(): OrientationData {
  const [orientation, setOrientation] = useState<OrientationType>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  const [angle, setAngle] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return (screen as any).orientation?.angle || window.orientation || 0;
  });

  useEffect(() => {
    const updateOrientation = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      const newAngle = (screen as any).orientation?.angle || window.orientation || 0;
      
      setOrientation(newOrientation);
      setAngle(newAngle);
    };

    const handleOrientationChange = () => {
      setTimeout(updateOrientation, 100);
    };

    const handleResize = () => {
      updateOrientation();
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    if ('screen' in window && 'orientation' in screen) {
      (screen as any).orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      
      if ('screen' in window && 'orientation' in screen) {
        (screen as any).orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  return {
    orientation,
    angle,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
}