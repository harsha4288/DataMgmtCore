import { ThemeConfiguration } from '../types';

export const professionalTheme: ThemeConfiguration = {
  name: 'professional',
  displayName: 'Professional',
  description: 'Corporate theme with clean, enterprise-focused styling',
  colors: {
    // Background colors - clean, corporate tones
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    bgHeader: '#ffffff',
    bgHeaderGroup: '#f8fafc',
    
    // Text colors - professional, readable tones
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textHeader: '#0f172a',
    
    // Border colors - subtle, professional tones
    borderColor: '#e2e8f0',
    borderHeader: '#cbd5e1',
    
    // Accent colors - professional blue
    accentColor: '#2563eb',
    hoverBg: 'rgba(37, 99, 235, 0.05)',
    
    // Shadow colors - subtle shadows
    shadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08)',
    frozenShadow: '2px 0 4px rgba(15, 23, 42, 0.06)',
    
    // Badge colors - professional color palette
    badgeGradeA: '#f0fdf4',
    badgeGradeAForeground: '#166534',
    badgeGradeABorder: '#bbf7d0',
    
    badgeGradeB: '#eff6ff',
    badgeGradeBForeground: '#1d4ed8',
    badgeGradeBBorder: '#bfdbfe',
    
    badgeGradeC: '#fffbeb',
    badgeGradeCForeground: '#d97706',
    badgeGradeCBorder: '#fed7aa',
    
    badgeGradeD: '#fef3c7',
    badgeGradeDForeground: '#b45309',
    badgeGradeDBorder: '#fde68a',
    
    badgeGradeF: '#fef2f2',
    badgeGradeFForeground: '#dc2626',
    badgeGradeFBorder: '#fecaca',
    
    badgeNeutral: '#f8fafc',
    badgeNeutralForeground: '#475569',
    badgeNeutralBorder: '#e2e8f0',
  },
  typography: {
    fontFamily: {
      primary: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: '"SF Pro Display", sans-serif',
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
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.6',
    },
  },
  spacing: {
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.375rem',
    xl: '0.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
  },
  componentOverrides: {
    table: {
      borderRadius: '0.5rem',
      headerBg: '#ffffff',
      rowHoverBg: 'rgba(37, 99, 235, 0.05)',
      borderColor: '#e2e8f0',
      groupHeaderBg: '#f8fafc',
    },
  },
};
