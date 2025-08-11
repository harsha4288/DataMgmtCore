// Theme Provider Component

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ThemeContextValue, ThemeMode, ColorScheme, DesignTokens } from '../../types/theme';
import { designTokens, platformTokens } from './tokens';
import { usePlatform } from '../hooks/usePlatform';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  attribute?: string;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'theme',
  attribute = 'class'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Try to get theme from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as ThemeMode;
      }
    }
    return defaultTheme;
  });

  const platform = usePlatform();
  const [resolvedTheme, setResolvedTheme] = useState<ColorScheme>('light');

  // Resolve system theme
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme as ColorScheme);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme attributes/classes
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-theme');
    
    // Set theme using data-theme attribute (matching DarkTheme.html)
    root.setAttribute('data-theme', resolvedTheme);
    
    // Set platform attribute
    root.setAttribute('data-platform', platform);
    
    // Theme switching is now handled purely by CSS via [data-theme="dark"] selectors
    // No JavaScript property application needed
  }, [resolvedTheme, platform, attribute]);

  // Save theme to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  // Merge design tokens with platform overrides
  const tokens = useMemo((): DesignTokens => {
    const platformOverrides = platformTokens[platform] || {};
    
    return {
      colors: { ...designTokens.colors, ...platformOverrides.colors },
      spacing: { ...designTokens.spacing, ...platformOverrides.spacing },
      typography: { 
        ...designTokens.typography, 
        ...platformOverrides.typography 
      },
      borderRadius: { 
        ...designTokens.borderRadius, 
        ...platformOverrides.borderRadius 
      },
      shadows: { ...designTokens.shadows, ...platformOverrides.shadows },
      animation: { ...designTokens.animation, ...platformOverrides.animation },
      breakpoints: { ...designTokens.breakpoints, ...platformOverrides.breakpoints },
      zIndex: { ...designTokens.zIndex, ...platformOverrides.zIndex },
    };
  }, [platform]);

  const value: ThemeContextValue = {
    theme,
    platform,
    setTheme,
    resolvedTheme,
    tokens,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}