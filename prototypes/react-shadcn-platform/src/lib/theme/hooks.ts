import { useContext } from 'react';
import { ThemeContextType } from './types';
import { ThemeContext } from './provider';

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Performance measurement hook for theme switching
export function useThemePerformance() {
  const { setTheme } = useTheme();
  
  const switchThemeWithPerformance = (themeName: string) => {
    const startTime = performance.now();
    
    setTheme(themeName as any);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log performance if it exceeds 200ms threshold
    if (duration > 200) {
      console.warn(`Theme switch took ${duration.toFixed(2)}ms, exceeding 200ms threshold`);
    }
    
    return duration;
  };
  
  return { switchThemeWithPerformance };
}
