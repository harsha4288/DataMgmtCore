import { ThemeConfiguration } from '../types';

export const defaultTheme: ThemeConfiguration = {
  name: 'default',
  displayName: 'Default',
  description: 'Professional light theme with clean, modern styling',
  colors: {
    // Background colors - based on screenshot
    bgPrimary: '#ffffff',
    bgSecondary: '#f9fafb',
    bgTertiary: '#f3f4f6',
    bgHeader: '#ffffff',
    bgHeaderGroup: '#f9fafb',
    
    // Text colors - based on screenshot
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textHeader: '#111827',
    
    // Border colors - based on screenshot
    borderColor: '#e5e7eb',
    borderHeader: '#d1d5db',
    
    // Accent colors - based on screenshot
    accentColor: '#f59e0b',
    hoverBg: 'rgba(245, 158, 11, 0.05)',
    
    // Shadow colors - based on screenshot
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    frozenShadow: '2px 0 4px rgba(0,0,0,0.05)',

    // Enhanced table selection colors
    selectionBg: 'rgba(245, 158, 11, 0.05)',
    selectionBorder: 'rgba(245, 158, 11, 0.2)',

    // Grade-specific colors (semantic approach)
    gradeABg: 'rgba(34, 197, 94, 0.1)',
    gradeAText: '#166534',
    gradeFBg: 'rgba(239, 68, 68, 0.1)',
    gradeFText: '#991b1b',
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
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  componentOverrides: {
    table: {
      borderRadius: '0.75rem',
      headerBg: '#ffffff',
      rowHoverBg: 'rgba(245, 158, 11, 0.05)',
      borderColor: '#e5e7eb',
      groupHeaderBg: '#f9fafb',
    },
  },
};
