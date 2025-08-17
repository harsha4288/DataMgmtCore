import { ThemeConfiguration } from '../types';

export const darkTheme: ThemeConfiguration = {
  name: 'dark',
  displayName: 'Dark',
  description: 'Professional dark theme with high contrast and modern styling',
  colors: {
    // Background colors - based on DarkTheme.html
    bgPrimary: '#0a0e1a',
    bgSecondary: '#111827',
    bgTertiary: '#1f2937',
    bgHeader: '#1f2937',
    bgHeaderGroup: '#111827',
    
    // Text colors - based on DarkTheme.html
    textPrimary: '#e4e8ee',
    textSecondary: '#9ca3af',
    textHeader: '#f9fafb',
    
    // Border colors - based on DarkTheme.html
    borderColor: '#374151',
    borderHeader: '#4b5563',
    
    // Accent colors - based on DarkTheme.html
    accentColor: '#fbbf24',
    hoverBg: 'rgba(251, 191, 36, 0.05)',
    
    // Shadow colors - based on DarkTheme.html
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
    frozenShadow: '2px 0 4px rgba(0,0,0,0.2)',
    
    // Badge colors - adapted for dark theme
    badgeGradeA: '#065f46',
    badgeGradeAForeground: '#d1fae5',
    badgeGradeABorder: '#047857',
    
    badgeGradeB: '#0369a1',
    badgeGradeBForeground: '#e0f2fe',
    badgeGradeBBorder: '#0284c7',
    
    badgeGradeC: '#b45309',
    badgeGradeCForeground: '#fef3c7',
    badgeGradeCBorder: '#d97706',
    
    badgeGradeD: '#c2410c',
    badgeGradeDForeground: '#fed7aa',
    badgeGradeDBorder: '#ea580c',
    
    badgeGradeF: '#dc2626',
    badgeGradeFForeground: '#fee2e2',
    badgeGradeFBorder: '#ef4444',
    
    badgeNeutral: '#374151',
    badgeNeutralForeground: '#f3f4f6',
    badgeNeutralBorder: '#4b5563',
  },
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      secondary: 'Inter, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  },
  componentOverrides: {
    table: {
      borderRadius: '0.75rem',
      headerBg: '#1f2937',
      rowHoverBg: 'rgba(251, 191, 36, 0.05)',
      borderColor: '#374151',
    },
  },
};
