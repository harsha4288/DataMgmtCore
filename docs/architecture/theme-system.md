# Theme System Architecture

## Overview

The Theme System provides a comprehensive design token architecture that enables consistent styling across all platforms while supporting light/dark modes, platform-specific adaptations, and user customization preferences.

## Core Architecture

### Design Token Hierarchy
```
┌─────────────────────────────────────────────────┐
│                Global Tokens                    │
│         Base design system values               │
│  ┌─────────────────────────────────────────┐    │
│  │  Colors, Typography, Spacing, etc.     │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│               Theme Variants                    │
│           Light/Dark/System modes               │
│  ┌─────────────┬─────────────┬─────────────┐    │
│  │    Light    │    Dark     │   System    │    │
│  │   Tokens    │   Tokens    │   Tokens    │    │
│  └─────────────┴─────────────┴─────────────┘    │
├─────────────────────────────────────────────────┤
│              Platform Overrides                 │
│         Device-specific adaptations             │
│  ┌─────────────┬─────────────┬─────────────┐    │
│  │   Mobile    │   Tablet    │  Desktop    │    │
│  │ Overrides   │ Overrides   │ Overrides   │    │
│  └─────────────┴─────────────┴─────────────┘    │
└─────────────────────────────────────────────────┘
```

## Design Token Structure

### Base Design Tokens
```typescript
export const designTokens = {
  // Color system with semantic naming
  colors: {
    // Primary brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',   // Base primary
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    
    // Semantic colors (CSS custom properties)
    surface: {
      primary: 'hsl(var(--surface-primary))',
      secondary: 'hsl(var(--surface-secondary))',
      tertiary: 'hsl(var(--surface-tertiary))',
      inverse: 'hsl(var(--surface-inverse))',
      accent: 'hsl(var(--surface-accent))',
      success: 'hsl(var(--surface-success))',
      warning: 'hsl(var(--surface-warning))',
      error: 'hsl(var(--surface-error))',
      info: 'hsl(var(--surface-info))'
    },
    
    content: {
      primary: 'hsl(var(--content-primary))',
      secondary: 'hsl(var(--content-secondary))',
      tertiary: 'hsl(var(--content-tertiary))',
      inverse: 'hsl(var(--content-inverse))',
      accent: 'hsl(var(--content-accent))',
      success: 'hsl(var(--content-success))',
      warning: 'hsl(var(--content-warning))',
      error: 'hsl(var(--content-error))',
      info: 'hsl(var(--content-info))'
    },
    
    border: {
      primary: 'hsl(var(--border-primary))',
      secondary: 'hsl(var(--border-secondary))',
      accent: 'hsl(var(--border-accent))',
      focus: 'hsl(var(--border-focus))',
      error: 'hsl(var(--border-error))',
      success: 'hsl(var(--border-success))'
    }
  },
  
  // Typography system
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif']
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.05em' }],
      '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }]
    },
    
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    }
  },
  
  // Spacing system (8px base unit)
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem'       // 384px
  },
  
  // Border radius system
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },
  
  // Shadow system
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },
  
  // Animation system
  animation: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms'
    },
    
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  },
  
  // Z-index system
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};
```

### Theme Variants (Light/Dark)
```typescript
// Light theme CSS custom properties
export const lightTheme = {
  '--surface-primary': '0 0% 100%',        // White
  '--surface-secondary': '0 0% 98%',       // Gray 50
  '--surface-tertiary': '0 0% 95%',        // Gray 100
  '--surface-inverse': '0 0% 9%',          // Gray 900
  '--surface-accent': '217 91% 60%',       // Blue 400
  '--surface-success': '142 71% 45%',      // Green 500
  '--surface-warning': '38 92% 50%',       // Orange 400
  '--surface-error': '0 84% 60%',          // Red 400
  '--surface-info': '199 89% 48%',         // Sky 400
  
  '--content-primary': '0 0% 9%',          // Gray 900
  '--content-secondary': '0 0% 45%',       // Gray 600
  '--content-tertiary': '0 0% 64%',        // Gray 400
  '--content-inverse': '0 0% 98%',         // Gray 50
  '--content-accent': '217 91% 60%',       // Blue 400
  '--content-success': '142 71% 45%',      // Green 500
  '--content-warning': '38 92% 50%',       // Orange 400
  '--content-error': '0 84% 60%',          // Red 400
  '--content-info': '199 89% 48%',         // Sky 400
  
  '--border-primary': '0 0% 89%',          // Gray 200
  '--border-secondary': '0 0% 93%',        // Gray 100
  '--border-accent': '217 91% 60%',        // Blue 400
  '--border-focus': '217 91% 60%',         // Blue 400
  '--border-error': '0 84% 60%',           // Red 400
  '--border-success': '142 71% 45%'        // Green 500
};

// Dark theme CSS custom properties
export const darkTheme = {
  '--surface-primary': '0 0% 9%',          // Gray 900
  '--surface-secondary': '0 0% 11%',       // Gray 800
  '--surface-tertiary': '0 0% 14%',        // Gray 700
  '--surface-inverse': '0 0% 98%',         // Gray 50
  '--surface-accent': '217 91% 60%',       // Blue 400
  '--surface-success': '142 71% 45%',      // Green 500
  '--surface-warning': '38 92% 50%',       // Orange 400
  '--surface-error': '0 84% 60%',          // Red 400
  '--surface-info': '199 89% 48%',         // Sky 400
  
  '--content-primary': '0 0% 98%',         // Gray 50
  '--content-secondary': '0 0% 64%',       // Gray 400
  '--content-tertiary': '0 0% 45%',        // Gray 600
  '--content-inverse': '0 0% 9%',          // Gray 900
  '--content-accent': '217 91% 60%',       // Blue 400
  '--content-success': '142 71% 45%',      // Green 500
  '--content-warning': '38 92% 50%',       // Orange 400
  '--content-error': '0 84% 60%',          // Red 400
  '--content-info': '199 89% 48%',         // Sky 400
  
  '--border-primary': '0 0% 18%',          // Gray 800
  '--border-secondary': '0 0% 14%',        // Gray 700
  '--border-accent': '217 91% 60%',        // Blue 400
  '--border-focus': '217 91% 60%',         // Blue 400
  '--border-error': '0 84% 60%',           // Red 400
  '--border-success': '142 71% 45%'        // Green 500
};
```

### Platform-Specific Overrides
```typescript
// Mobile-specific token overrides
export const mobileTokens = {
  spacing: {
    // Tighter spacing on mobile
    1: '0.125rem',    // 2px
    2: '0.25rem',     // 4px
    3: '0.5rem',      // 8px
    4: '0.75rem',     // 12px
    5: '1rem',        // 16px
    6: '1.25rem',     // 20px
    8: '1.5rem',      // 24px
    10: '2rem',       // 32px
    12: '2.5rem'      // 40px
  },
  
  borderRadius: {
    // More rounded corners for better touch targets
    sm: '0.25rem',    // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem'        // 16px
  },
  
  fontSize: {
    // Slightly larger text for readability
    xs: ['0.8125rem', { lineHeight: '1.125rem' }],
    sm: ['0.9375rem', { lineHeight: '1.375rem' }],
    base: ['1.0625rem', { lineHeight: '1.625rem' }]
  },
  
  // Touch target minimum size
  minTouchTarget: '44px',
  
  // Mobile-specific shadows (less prominent)
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.08)',
    base: '0 2px 4px 0 rgb(0 0 0 / 0.08)',
    md: '0 4px 8px 0 rgb(0 0 0 / 0.08)'
  }
};

// Tablet-specific token overrides
export const tabletTokens = {
  spacing: {
    // Medium spacing for tablet
    1: '0.1875rem',   // 3px
    2: '0.375rem',    // 6px
    3: '0.625rem',    // 10px
    4: '0.875rem',    // 14px
    5: '1.125rem',    // 18px
    6: '1.375rem',    // 22px
    8: '1.75rem',     // 28px
    10: '2.25rem',    // 36px
    12: '2.75rem'     // 44px
  }
};

// Desktop-specific token overrides
export const desktopTokens = {
  spacing: {
    // Generous spacing for desktop
    8: '2rem',        // 32px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem'        // 96px
  },
  
  // Desktop-specific shadows (more prominent)
  shadows: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    base: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  }
};
```

## Theme Provider Implementation

### React Theme Provider
```typescript
interface ThemeContextValue {
  // Theme state
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  platform: 'mobile' | 'tablet' | 'desktop';
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Computed tokens
  tokens: ComputedTokens;
  
  // Theme utilities
  isDark: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

interface ComputedTokens {
  colors: typeof designTokens.colors;
  typography: typeof designTokens.typography;
  spacing: typeof designTokens.spacing;
  borderRadius: typeof designTokens.borderRadius;
  shadows: typeof designTokens.shadows;
  animation: typeof designTokens.animation;
  zIndex: typeof designTokens.zIndex;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Theme state management
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    // Load from localStorage or default to system
    const stored = localStorage.getItem('theme');
    return (stored as 'light' | 'dark' | 'system') || 'system';
  });
  
  // Platform detection
  const platform = usePlatformDetection();
  
  // Resolve system theme
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
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
      setResolvedTheme(theme);
    }
  }, [theme]);
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.classList.toggle('light', resolvedTheme === 'light');
    
    // Apply platform attribute
    root.setAttribute('data-platform', platform);
    
    // Apply CSS custom properties
    const themeProperties = resolvedTheme === 'dark' ? darkTheme : lightTheme;
    Object.entries(themeProperties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Store theme preference
    localStorage.setItem('theme', theme);
  }, [resolvedTheme, platform, theme]);
  
  // Compute tokens with platform overrides
  const tokens = useMemo((): ComputedTokens => {
    let platformOverrides = {};
    
    switch (platform) {
      case 'mobile':
        platformOverrides = mobileTokens;
        break;
      case 'tablet':
        platformOverrides = tabletTokens;
        break;
      case 'desktop':
        platformOverrides = desktopTokens;
        break;
    }
    
    return {
      ...designTokens,
      ...platformOverrides
    } as ComputedTokens;
  }, [platform]);
  
  // Derived values
  const isDark = resolvedTheme === 'dark';
  const isMobile = platform === 'mobile';
  const isTablet = platform === 'tablet';
  const isDesktop = platform === 'desktop';
  
  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      platform,
      setTheme,
      tokens,
      isDark,
      isMobile,
      isTablet,
      isDesktop
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### Platform Detection Hook
```typescript
function usePlatformDetection(): 'mobile' | 'tablet' | 'desktop' {
  const [platform, setPlatform] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const checkPlatform = () => {
      const width = window.innerWidth;
      const hasTouch = 'ontouchstart' in window;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Check for mobile devices
      const isMobileDevice = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Check for tablet devices
      const isTabletDevice = /tablet|ipad|playbook|silk/i.test(userAgent) ||
        (hasTouch && width >= 768 && width <= 1024);
      
      if (width < 768 || (isMobileDevice && width < 1024)) {
        setPlatform('mobile');
      } else if (width <= 1024 || isTabletDevice) {
        setPlatform('tablet');
      } else {
        setPlatform('desktop');
      }
    };
    
    checkPlatform();
    
    // Listen for resize events
    window.addEventListener('resize', checkPlatform);
    
    // Listen for orientation changes (mobile/tablet)
    window.addEventListener('orientationchange', checkPlatform);
    
    return () => {
      window.removeEventListener('resize', checkPlatform);
      window.removeEventListener('orientationchange', checkPlatform);
    };
  }, []);
  
  return platform;
}
```

## Theme-Aware Component System

### Component Variants with CVA
```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button component with theme-aware variants
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-surface-accent text-content-inverse hover:bg-surface-accent/90',
        destructive: 'bg-surface-error text-content-inverse hover:bg-surface-error/90',
        outline: 'border border-border-primary hover:bg-surface-secondary',
        secondary: 'bg-surface-secondary text-content-primary hover:bg-surface-secondary/80',
        ghost: 'hover:bg-surface-secondary',
        link: 'underline-offset-4 hover:underline text-content-accent'
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10'
      },
      platform: {
        mobile: 'min-h-[44px] px-6 text-base',  // Larger touch targets
        tablet: 'h-10 px-4 text-sm',
        desktop: 'h-9 px-3 text-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

interface ButtonProps extends 
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, platform, asChild = false, ...props }, ref) => {
    const { platform: detectedPlatform } = useTheme();
    const actualPlatform = platform || detectedPlatform;
    
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, platform: actualPlatform, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### Theme-Aware Utility Classes
```typescript
// Tailwind CSS configuration with design tokens
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic color system
        surface: {
          primary: 'hsl(var(--surface-primary))',
          secondary: 'hsl(var(--surface-secondary))',
          tertiary: 'hsl(var(--surface-tertiary))',
          inverse: 'hsl(var(--surface-inverse))',
          accent: 'hsl(var(--surface-accent))',
          success: 'hsl(var(--surface-success))',
          warning: 'hsl(var(--surface-warning))',
          error: 'hsl(var(--surface-error))',
          info: 'hsl(var(--surface-info))'
        },
        content: {
          primary: 'hsl(var(--content-primary))',
          secondary: 'hsl(var(--content-secondary))',
          tertiary: 'hsl(var(--content-tertiary))',
          inverse: 'hsl(var(--content-inverse))',
          accent: 'hsl(var(--content-accent))',
          success: 'hsl(var(--content-success))',
          warning: 'hsl(var(--content-warning))',
          error: 'hsl(var(--content-error))',
          info: 'hsl(var(--content-info))'
        },
        border: {
          primary: 'hsl(var(--border-primary))',
          secondary: 'hsl(var(--border-secondary))',
          accent: 'hsl(var(--border-accent))',
          focus: 'hsl(var(--border-focus))',
          error: 'hsl(var(--border-error))',
          success: 'hsl(var(--border-success))'
        }
      },
      
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        mono: designTokens.typography.fontFamily.mono,
        display: designTokens.typography.fontFamily.display
      },
      
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      zIndex: designTokens.zIndex,
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out'
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: [
    // Platform-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.touch-target-mobile': {
          minHeight: '44px',
          minWidth: '44px'
        },
        '.touch-target-tablet': {
          minHeight: '40px',
          minWidth: '40px'
        },
        '.safe-area-inset': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)'
        }
      };
      
      addUtilities(newUtilities);
    }
  ]
};
```

## Theme Customization System

### User Theme Preferences
```typescript
interface ThemePreferences {
  // Color preferences
  primaryColor?: string;
  accentColor?: string;
  
  // Typography preferences
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: 'sans' | 'serif' | 'mono';
  
  // Layout preferences
  density?: 'compact' | 'comfortable' | 'spacious';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  
  // Animation preferences
  reducedMotion?: boolean;
  
  // Accessibility preferences
  highContrast?: boolean;
  focusVisible?: boolean;
}

export function useThemePreferences() {
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    const stored = localStorage.getItem('theme-preferences');
    return stored ? JSON.parse(stored) : {};
  });
  
  const updatePreferences = useCallback((updates: Partial<ThemePreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      localStorage.setItem('theme-preferences', JSON.stringify(newPreferences));
      return newPreferences;
    });
  }, []);
  
  // Apply preferences to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    if (preferences.primaryColor) {
      root.style.setProperty('--color-primary', preferences.primaryColor);
    }
    
    if (preferences.accentColor) {
      root.style.setProperty('--color-accent', preferences.accentColor);
    }
    
    if (preferences.fontSize) {
      root.setAttribute('data-font-size', preferences.fontSize);
    }
    
    if (preferences.density) {
      root.setAttribute('data-density', preferences.density);
    }
    
    if (preferences.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    }
    
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [preferences]);
  
  return { preferences, updatePreferences };
}
```

### Theme Customization Panel
```typescript
function ThemeCustomizationPanel() {
  const { theme, setTheme, platform } = useTheme();
  const { preferences, updatePreferences } = useThemePreferences();
  
  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold text-content-primary mb-3">
          Theme Mode
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={cn(
                'p-3 rounded-lg border text-sm font-medium transition-colors',
                theme === mode
                  ? 'bg-surface-accent text-content-inverse border-border-accent'
                  : 'bg-surface-secondary text-content-primary border-border-primary hover:bg-surface-tertiary'
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-content-primary mb-3">
          Font Size
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => updatePreferences({ fontSize: size })}
              className={cn(
                'p-3 rounded-lg border text-sm font-medium transition-colors',
                preferences.fontSize === size
                  ? 'bg-surface-accent text-content-inverse border-border-accent'
                  : 'bg-surface-secondary text-content-primary border-border-primary hover:bg-surface-tertiary'
              )}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-content-primary mb-3">
          Layout Density
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
            <button
              key={density}
              onClick={() => updatePreferences({ density })}
              className={cn(
                'p-3 rounded-lg border text-sm font-medium transition-colors',
                preferences.density === density
                  ? 'bg-surface-accent text-content-inverse border-border-accent'
                  : 'bg-surface-secondary text-content-primary border-border-primary hover:bg-surface-tertiary'
              )}
            >
              {density.charAt(0).toUpperCase() + density.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-content-primary">
          Accessibility
        </h3>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences.reducedMotion || false}
            onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
            className="rounded border-border-primary"
          />
          <span className="text-content-primary">Reduce motion</span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences.highContrast || false}
            onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
            className="rounded border-border-primary"
          />
          <span className="text-content-primary">High contrast</span>
        </label>
      </div>
    </div>
  );
}
```

## Performance Considerations

### CSS Custom Properties Strategy
- Use CSS custom properties for dynamic theming
- Minimize JavaScript style updates
- Leverage browser's native CSS cascade
- Avoid layout thrashing during theme changes

### Bundle Optimization
- Tree-shake unused design tokens
- Generate minimal CSS for each theme
- Use CSS-in-JS only when necessary
- Implement theme code splitting

### Runtime Performance
- Cache computed theme values
- Debounce theme preference changes
- Use efficient platform detection
- Minimize re-renders during theme changes

## Testing Strategy

### Theme Testing Framework
```typescript
describe('Theme System', () => {
  it('applies light theme correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(document.documentElement).toHaveClass('light');
    expect(document.documentElement.style.getPropertyValue('--surface-primary')).toBe('0 0% 100%');
  });
  
  it('applies dark theme correctly', () => {
    // Mock dark theme preference
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }))
    });
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(document.documentElement).toHaveClass('dark');
  });
  
  it('adapts to platform changes', () => {
    const { rerender } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    window.dispatchEvent(new Event('resize'));
    
    expect(document.documentElement).toHaveAttribute('data-platform', 'mobile');
  });
});
```

---

*The Theme System provides a comprehensive, performant, and accessible foundation for creating consistent user experiences across all platforms and user preferences.*