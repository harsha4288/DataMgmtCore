// Platform Detection Hook

import { useState, useEffect } from 'react';
import type { Platform } from '../../types/theme';

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('desktop');

  useEffect(() => {
    const detectPlatform = (): Platform => {
      const width = window.innerWidth;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Check for mobile devices
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Check for tablet specific indicators
      const isTablet = /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook/i.test(userAgent);
      
      // Width-based detection with touch capability consideration
      if (width < 768 || (isMobile && !isTablet)) {
        return 'mobile';
      } else if (width >= 768 && width < 1024 || (isTablet && hasTouch)) {
        return 'tablet';
      } else {
        return 'desktop';
      }
    };

    const updatePlatform = () => {
      setPlatform(detectPlatform());
    };

    // Initial detection
    updatePlatform();

    // Listen for resize events
    window.addEventListener('resize', updatePlatform);
    
    // Listen for orientation changes (mobile/tablet)
    window.addEventListener('orientationchange', updatePlatform);

    return () => {
      window.removeEventListener('resize', updatePlatform);
      window.removeEventListener('orientationchange', updatePlatform);
    };
  }, []);

  return platform;
}