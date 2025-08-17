import { ThemeConfiguration } from '../types';

export const gitaTheme: ThemeConfiguration = {
  name: 'gita',
  displayName: 'Gita',
  description: 'Spiritual theme inspired by meditation and ancient wisdom',
  colors: {
    // Background colors - warm, spiritual tones
    bgPrimary: '#fefefe',
    bgSecondary: '#f8f6f1',
    bgTertiary: '#f0ede6',
    bgHeader: '#f8f6f1',
    bgHeaderGroup: '#f0ede6',
    
    // Text colors - warm, readable tones
    textPrimary: '#2d1b0e',
    textSecondary: '#6b4f3a',
    textHeader: '#1a0f05',
    
    // Border colors - warm, subtle tones
    borderColor: '#e8dcc8',
    borderHeader: '#d4c4a8',
    
    // Accent colors - spiritual gold/amber
    accentColor: '#d97706',
    hoverBg: 'rgba(217, 119, 6, 0.08)',
    
    // Shadow colors - warm shadows
    shadow: '0 1px 3px 0 rgba(45, 27, 14, 0.1)',
    frozenShadow: '2px 0 4px rgba(45, 27, 14, 0.08)',

    // Enhanced table selection colors
    selectionBg: 'rgba(217, 119, 6, 0.08)',
    selectionBorder: 'rgba(217, 119, 6, 0.2)',

    // Grade-specific colors (semantic approach)
    gradeABg: 'rgba(34, 197, 94, 0.1)',
    gradeAText: '#166534',
    gradeFBg: 'rgba(239, 68, 68, 0.1)',
    gradeFText: '#991b1b',
  },
  typography: {
    fontFamily: {
      primary: '"Crimson Text", "Times New Roman", serif',
      secondary: '"Crimson Text", serif',
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
      tight: '1.4',
      normal: '1.6',
      relaxed: '1.8',
    },
  },
  spacing: {
    xs: '0.375rem',
    sm: '0.75rem',
    md: '1.25rem',
    lg: '2rem',
    xl: '2.5rem',
    '2xl': '3.5rem',
    '3xl': '5rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px 0 rgba(45, 27, 14, 0.1)',
    md: '0 4px 6px -1px rgba(45, 27, 14, 0.15), 0 2px 4px -1px rgba(45, 27, 14, 0.1)',
    lg: '0 10px 15px -3px rgba(45, 27, 14, 0.15), 0 4px 6px -2px rgba(45, 27, 14, 0.1)',
    xl: '0 20px 25px -5px rgba(45, 27, 14, 0.15), 0 10px 10px -5px rgba(45, 27, 14, 0.1)',
  },
  componentOverrides: {
    table: {
      borderRadius: '1rem',
      headerBg: '#f8f6f1',
      rowHoverBg: 'rgba(217, 119, 6, 0.08)',
      borderColor: '#e8dcc8',
      groupHeaderBg: '#f5f2e8',
    },
  },
};
