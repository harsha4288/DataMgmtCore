// Theme System Types

export type ThemeMode = 'light' | 'dark' | 'system';
export type Platform = 'mobile' | 'tablet' | 'desktop';
export type ColorScheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  platform: Platform;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: ColorScheme;
  tokens: DesignTokens;
}

export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  animation: AnimationTokens;
  breakpoints: BreakpointTokens;
  zIndex: ZIndexTokens;
}

export interface ColorTokens {
  primary: ColorScale;
  secondary: ColorScale;
  surface: ColorScale;
  content: ContentColorTokens;
  border: string;
  input: string;
  ring: string;
  background: string;
  foreground: string;
  destructive: ColorVariant;
  muted: ColorVariant;
  accent: ColorVariant;
  popover: ColorVariant;
  card: ColorVariant;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ColorVariant {
  DEFAULT: string;
  foreground: string;
}

export interface ContentColorTokens {
  primary: string;
  secondary: string;
  tertiary: string;
  inverse: string;
  disabled: string;
}

export interface SpacingTokens {
  0: string;
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
  // Semantic spacing
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
}

export interface TypographyTokens {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  fontSize: {
    xs: [string, { lineHeight: string; letterSpacing?: string }];
    sm: [string, { lineHeight: string; letterSpacing?: string }];
    base: [string, { lineHeight: string; letterSpacing?: string }];
    lg: [string, { lineHeight: string; letterSpacing?: string }];
    xl: [string, { lineHeight: string; letterSpacing?: string }];
    '2xl': [string, { lineHeight: string; letterSpacing?: string }];
    '3xl': [string, { lineHeight: string; letterSpacing?: string }];
    '4xl': [string, { lineHeight: string; letterSpacing?: string }];
    '5xl': [string, { lineHeight: string; letterSpacing?: string }];
    '6xl': [string, { lineHeight: string; letterSpacing?: string }];
    '7xl': [string, { lineHeight: string; letterSpacing?: string }];
    '8xl': [string, { lineHeight: string; letterSpacing?: string }];
    '9xl': [string, { lineHeight: string; letterSpacing?: string }];
  };
  fontWeight: {
    thin: string;
    extralight: string;
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
    black: string;
  };
  lineHeight: {
    none: string;
    tight: string;
    snug: string;
    normal: string;
    relaxed: string;
    loose: string;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

export interface BorderRadiusTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

export interface AnimationTokens {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    out: string;
    in: string;
    inOut: string;
    bounce: string;
  };
  keyframes: Record<string, Record<string, any>>;
}

export interface BreakpointTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ZIndexTokens {
  0: string;
  10: string;
  20: string;
  30: string;
  40: string;
  50: string;
  auto: string;
  tooltip: string;
  popover: string;
  modal: string;
  drawer: string;
  overlay: string;
}

// Platform-specific token overrides
export interface PlatformTokens {
  mobile: Partial<DesignTokens>;
  tablet: Partial<DesignTokens>;
  desktop: Partial<DesignTokens>;
}

// Component variant types
export interface ComponentVariant {
  base: string;
  variants: Record<string, Record<string, string>>;
  compoundVariants?: Array<{
    conditions: Record<string, string>;
    class: string;
  }>;
  defaultVariants?: Record<string, string>;
}

// Theme configuration
export interface ThemeConfig {
  defaultTheme: ThemeMode;
  enableSystemTheme: boolean;
  storageKey: string;
  attribute: string;
  themes: string[];
  customProperties: boolean;
}

// CSS custom properties
export interface CSSCustomProperties {
  [key: string]: string | number;
}

// Export all theme types
export * from './theme';