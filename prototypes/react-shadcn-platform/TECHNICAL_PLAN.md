# Technical Plan: React + shadcn/ui Platform

> **Document Type:** Architecture & Technical Decisions  
> **Audience:** Developers, Architects, AI Assistants  
> **Update Frequency:** When technical approach changes

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Component Architecture](#component-architecture)
- [Theme System](#theme-system)
- [Data Management](#data-management)
- [Performance Strategy](#performance-strategy)
- [Security Considerations](#security-considerations)
- [Testing Strategy](#testing-strategy)
- [Deployment Strategy](#deployment-strategy)

## Architecture Overview

### Three-Layer Architecture (Enhanced)

Prototype 2 builds upon the established three-layer architecture from Prototype 1, with enhancements for shadcn/ui integration and theme customization.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  shadcn/ui components + Theme Configuration System         │
├─────────────────────────────────────────────────────────────┤
│                     BEHAVIOR LAYER                         │
│    Business Logic + Data Adapters + State Management      │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                            │
│      Entity System + API Adapters + Configuration         │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
2. **Component Reusability**: 90%+ component reuse across different business domains
3. **Theme Customization**: Zero-code theme changes through configuration
4. **Performance First**: Optimized for speed and user experience
5. **Accessibility**: WCAG 2.1 AA compliance throughout
6. **Type Safety**: Full TypeScript coverage for maintainability

## Technology Stack

### Core Technologies

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **React** | 18.x | UI Framework | Latest concurrent features, stable ecosystem |
| **TypeScript** | 5.x | Type Safety | Enhanced developer experience, fewer runtime errors |
| **Vite** | 5.x | Build Tool | Fast development, optimized production builds |
| **shadcn/ui** | Latest | Component Library | Production-ready, customizable, accessible |
| **Tailwind CSS** | 4.x | Styling | Utility-first, design system integration |
| **Zustand** | Latest | State Management | Lightweight, simple, performant |
| **TanStack Query** | 5.x | Server State | Caching, synchronization, background updates |
| **React Hook Form** | Latest | Form Handling | Performance, validation, accessibility |

### Development Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **ESLint** | Code linting | Strict TypeScript rules, React best practices |
| **Prettier** | Code formatting | Consistent code style across team |
| **Husky** | Git hooks | Pre-commit validation, quality gates |
| **Lint-staged** | Staged files | Only lint changed files for speed |
| **Jest** | Unit testing | Component testing, integration testing |
| **Testing Library** | Testing utilities | User-centric testing approach |
| **Playwright** | E2E testing | Cross-browser testing, visual regression |

### Performance Tools

| Tool | Purpose | Integration |
|------|---------|-------------|
| **Lighthouse CI** | Performance monitoring | Automated performance audits |
| **Bundle Analyzer** | Bundle size analysis | Optimize bundle size |
| **Core Web Vitals** | User experience metrics | Real user performance data |
| **Web Vitals** | Performance measurement | In-app performance tracking |

## Component Architecture

### shadcn/ui Integration Strategy

#### Component Wrapper Pattern

```typescript
// components/themed/themed-button.tsx
interface ThemedButtonProps extends ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  themeOverride?: Partial<ComponentThemeConfig>;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({ 
  variant = 'default', 
  themeOverride,
  className,
  ...props 
}) => {
  const { currentTheme } = useTheme();
  const componentConfig = currentTheme?.components?.Button;
  
  const themedClassName = cn(
    // shadcn/ui base styles
    buttonVariants({ variant }),
    // Theme-specific overrides
    componentConfig?.className,
    themeOverride?.className,
    className
  );
  
  return (
    <Button 
      className={themedClassName}
      style={{
        ...componentConfig?.style,
        ...themeOverride?.style
      }}
      {...props}
    />
  );
};
```

#### Component Hierarchy

```
components/
├── ui/                    # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── themed/                # Theme-aware wrappers
│   ├── themed-button.tsx
│   ├── themed-card.tsx
│   ├── themed-input.tsx
│   └── ...
├── business/              # Domain-specific components
│   ├── alumni/
│   ├── volunteer/
│   ├── student/
│   └── events/
└── shared/                # Cross-domain components
    ├── data-table.tsx
    ├── form-builder.tsx
    ├── navigation.tsx
    └── ...
```

### Component Design Patterns

#### 1. Composition Pattern

```typescript
// components/business/alumni/alumni-card.tsx
export const AlumniCard: React.FC<AlumniCardProps> = ({ member }) => {
  return (
    <ThemedCard>
      <CardHeader>
        <AlumniAvatar member={member} />
        <AlumniName member={member} />
      </CardHeader>
      <CardContent>
        <AlumniInfo member={member} />
        <AlumniActions member={member} />
      </CardContent>
    </ThemedCard>
  );
};
```

#### 2. Render Props Pattern

```typescript
// components/shared/data-table.tsx
export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  columns, 
  renderRow 
}) => {
  return (
    <Table>
      <TableHeader>
        {columns.map(column => (
          <TableHead key={column.key}>{column.label}</TableHead>
        ))}
      </TableHeader>
      <TableBody>
        {data.map((item, index) => renderRow(item, index))}
      </TableBody>
    </Table>
  );
};
```

#### 3. Custom Hooks Pattern

```typescript
// hooks/use-alumni-data.ts
export const useAlumniData = (filters: AlumniFilters) => {
  return useQuery({
    queryKey: ['alumni', filters],
    queryFn: () => alumniAdapter.getAlumniDirectory(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## Theme System

### Theme Configuration Architecture

#### Theme Configuration Interface

```typescript
// types/theme.ts
interface ThemeConfiguration {
  // Brand Identity
  brand: {
    name: string;
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    tagline?: string;
  };
  
  // Color Palette (CSS Variables)
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    // Extended color palette
    [key: string]: string;
  };
  
  // Typography System
  typography: {
    fontFamily: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    fontSize: Record<string, [string, string]>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  
  // Component Styling Overrides
  components: {
    [componentName: string]: ComponentThemeConfig;
  };
  
  // Layout & Spacing
  layout: {
    container: {
      center: boolean;
      padding: string;
      screens: Record<string, string>;
    };
    borderRadius: Record<string, string>;
    boxShadow: Record<string, string>;
    spacing: Record<string, string>;
  };
  
  // Animation & Transitions
  animation: {
    duration: Record<string, string>;
    easing: Record<string, string>;
    keyframes: Record<string, Keyframe[]>;
  };
}
```

#### Theme Loading System

```typescript
// hooks/use-theme.ts
export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfiguration>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const loadTheme = async (themeName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load theme configuration from API or static files
      const theme = await import(`../themes/${themeName}.theme.ts`);
      
      // Apply CSS variables to document root
      applyThemeVariables(theme.default);
      
      // Update component configurations
      updateComponentConfigs(theme.default);
      
      // Persist theme selection
      localStorage.setItem('selected-theme', themeName);
      
      setCurrentTheme(theme.default);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load theme:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyThemeVariables = (theme: ThemeConfiguration) => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Apply typography variables
    root.style.setProperty('--font-sans', theme.typography.fontFamily.sans.join(', '));
    root.style.setProperty('--font-serif', theme.typography.fontFamily.serif.join(', '));
    root.style.setProperty('--font-mono', theme.typography.fontFamily.mono.join(', '));
    
    // Apply layout variables
    Object.entries(theme.layout.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    
    Object.entries(theme.layout.boxShadow).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  };
  
  return {
    currentTheme,
    isLoading,
    error,
    loadTheme,
  };
};
```

### Theme Examples

#### Gita Alumni Theme

```typescript
// themes/gita-alumni.theme.ts
export const gitaAlumniTheme: ThemeConfiguration = {
  brand: {
    name: "Gita Alumni Network",
    logo: "/logos/gita-crest.svg",
    primaryColor: "hsl(142, 76%, 36%)", // Traditional academic green
    secondaryColor: "hsl(217, 91%, 60%)", // Knowledge blue
    tagline: "Connecting Gita Graduates Worldwide"
  },
  
  colors: {
    primary: "hsl(142, 76%, 36%)",
    secondary: "hsl(217, 91%, 60%)",
    accent: "hsl(45, 100%, 51%)", // Achievement gold
    neutral: "hsl(220, 13%, 91%)",
    success: "hsl(142, 76%, 36%)",
    warning: "hsl(45, 100%, 51%)",
    error: "hsl(0, 84%, 60%)",
    background: "hsl(0, 0%, 100%)",
    foreground: "hsl(222, 84%, 4.9%)",
    muted: "hsl(210, 40%, 96.1%)",
    border: "hsl(214.3, 31.8%, 91.4%)",
  },
  
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      serif: ["Crimson Text", "Georgia", "serif"],
      mono: ["JetBrains Mono", "monospace"],
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }],
      sm: ["0.875rem", { lineHeight: "1.25rem" }],
      base: ["1rem", { lineHeight: "1.5rem" }],
      lg: ["1.125rem", { lineHeight: "1.75rem" }],
      xl: ["1.25rem", { lineHeight: "1.75rem" }],
      "2xl": ["1.5rem", { lineHeight: "2rem" }],
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
  
  components: {
    Button: {
      className: "font-semibold tracking-wide",
      variants: {
        primary: "bg-primary hover:bg-primary/90 text-white",
        secondary: "bg-secondary hover:bg-secondary/90 text-white",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      }
    },
    Card: {
      className: "border-border/50 shadow-sm hover:shadow-md transition-shadow",
      style: {
        borderRadius: "var(--radius-lg)"
      }
    },
    Input: {
      className: "border-border focus:border-primary",
    },
  },
  
  layout: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    borderRadius: {
      none: "0px",
      sm: "0.125rem",
      default: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
      "2xl": "1rem",
      full: "9999px",
    },
    boxShadow: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      default: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    },
  },
  
  animation: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
    easing: {
      ease: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
};
```

## Data Management

### State Management Strategy

#### Zustand Store Architecture

```typescript
// stores/theme-store.ts
interface ThemeStore {
  currentTheme: ThemeConfiguration | null;
  availableThemes: string[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTheme: (themeName: string) => Promise<void>;
  setTheme: (theme: ThemeConfiguration) => void;
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  currentTheme: null,
  availableThemes: ['gita-alumni', 'volunteer', 'educational', 'events'],
  isLoading: false,
  error: null,
  
  loadTheme: async (themeName: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const theme = await import(`../themes/${themeName}.theme.ts`);
      set({ currentTheme: theme.default, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  setTheme: (theme) => set({ currentTheme: theme }),
  
  resetTheme: () => set({ currentTheme: null }),
}));
```

#### TanStack Query Integration

```typescript
// hooks/use-query-client.ts
export const useQueryClient = () => {
  const queryClient = useQueryClient();
  
  // Configure default options
  queryClient.setDefaultOptions({
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  });
  
  return queryClient;
};
```

### Data Adapter Pattern

#### Base Adapter Interface

```typescript
// core/data-adapters/base-adapter.ts
export abstract class BaseAdapter<T> {
  protected baseUrl: string;
  protected apiKey?: string;
  
  constructor(config: AdapterConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }
  
  abstract getList(filters?: any): Promise<T[]>;
  abstract getById(id: string): Promise<T>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
  
  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...options?.headers,
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}
```

#### Domain-Specific Adapters

```typescript
// adapters/alumni-adapter.ts
export class AlumniDataAdapter extends BaseAdapter<AlumniMember> {
  async getAlumniDirectory(filters: AlumniFilters): Promise<AlumniMember[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.searchTerm) {
      queryParams.append('search', filters.searchTerm);
    }
    
    if (filters.graduationYear) {
      queryParams.append('graduationYear', filters.graduationYear.toString());
    }
    
    if (filters.industry) {
      queryParams.append('industry', filters.industry);
    }
    
    return this.request<AlumniMember[]>(`/alumni?${queryParams.toString()}`);
  }
  
  async getMentorshipMatches(memberId: string): Promise<AlumniMember[]> {
    return this.request<AlumniMember[]>(`/alumni/${memberId}/mentorship-matches`);
  }
  
  async createNetworkingEvent(event: NetworkingEvent): Promise<string> {
    const response = await this.request<{ id: string }>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    
    return response.id;
  }
}
```

## Performance Strategy

### Bundle Optimization

#### Code Splitting Strategy

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

// Lazy load domain-specific components
const AlumniDashboard = lazy(() => import('./domains/alumni/AlumniDashboard'));
const VolunteerDashboard = lazy(() => import('./domains/volunteer/VolunteerDashboard'));
const StudentDashboard = lazy(() => import('./domains/student/StudentDashboard'));
const EventDashboard = lazy(() => import('./domains/events/EventDashboard'));

// Lazy load themes
const loadTheme = async (themeName: string) => {
  const theme = await import(`./themes/${themeName}.theme.ts`);
  return theme.default;
};
```

#### Dynamic Imports

```typescript
// utils/theme-loader.ts
export const loadThemeDynamically = async (themeName: string) => {
  try {
    const module = await import(`../themes/${themeName}.theme.ts`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load theme: ${themeName}`, error);
    // Fallback to default theme
    const defaultTheme = await import('../themes/default.theme.ts');
    return defaultTheme.default;
  }
};
```

### Rendering Optimization

#### Virtual Scrolling

```typescript
// components/shared/virtualized-table.tsx
import { FixedSizeList as List } from 'react-window';

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({ 
  data, 
  rowHeight = 50,
  height = 400 
}) => {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <TableRow>
        {/* Row content */}
      </TableRow>
    </div>
  );
  
  return (
    <List
      height={height}
      itemCount={data.length}
      itemSize={rowHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

#### Memoization Strategy

```typescript
// hooks/use-memoized-data.ts
export const useMemoizedData = <T>(
  data: T[],
  dependencies: any[]
): T[] => {
  return useMemo(() => {
    // Expensive data processing
    return data.map(item => ({
      ...item,
      processed: expensiveProcessing(item),
    }));
  }, dependencies);
};
```

### Asset Optimization

#### Image Optimization

```typescript
// components/shared/optimized-image.tsx
export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  width, 
  height 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div className="relative">
      {!isLoaded && !error && (
        <div className="animate-pulse bg-gray-200" style={{ width, height }} />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};
```

## Security Considerations

### Input Validation

```typescript
// utils/validation.ts
import { z } from 'zod';

export const AlumniMemberSchema = z.object({
  id: z.string().uuid(),
  personalInfo: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    graduationYear: z.number().min(1950).max(new Date().getFullYear()),
  }),
  professionalInfo: z.object({
    currentPosition: z.string().max(200),
    company: z.string().max(200),
    industry: z.string().max(100),
  }),
});

export const validateAlumniMember = (data: unknown): AlumniMember => {
  return AlumniMemberSchema.parse(data);
};
```

### XSS Prevention

```typescript
// utils/sanitization.ts
import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};
```

### CSRF Protection

```typescript
// utils/csrf.ts
export const getCsrfToken = (): string => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

export const addCsrfHeader = (headers: HeadersInit): HeadersInit => {
  return {
    ...headers,
    'X-CSRF-Token': getCsrfToken(),
  };
};
```

## Testing Strategy

### Unit Testing

```typescript
// __tests__/components/themed-button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemedButton } from '../../components/themed/themed-button';

describe('ThemedButton', () => {
  it('renders with default theme', () => {
    render(<ThemedButton>Click me</ThemedButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('applies custom theme overrides', () => {
    const themeOverride = {
      className: 'custom-class',
      style: { backgroundColor: 'red' },
    };
    
    render(
      <ThemedButton themeOverride={themeOverride}>
        Click me
      </ThemedButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveStyle({ backgroundColor: 'red' });
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<ThemedButton onClick={handleClick}>Click me</ThemedButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/theme-switching.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../components/theme-provider';
import { ThemeSwitcher } from '../../components/theme-switcher';

describe('Theme Switching', () => {
  it('switches themes correctly', async () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );
    
    const themeSelect = screen.getByRole('combobox');
    fireEvent.change(themeSelect, { target: { value: 'volunteer' } });
    
    await waitFor(() => {
      expect(document.documentElement).toHaveStyle({
        '--color-primary': 'hsl(25, 95%, 53%)',
      });
    });
  });
});
```

### E2E Testing

```typescript
// e2e/alumni-directory.spec.ts
import { test, expect } from '@playwright/test';

test('alumni directory functionality', async ({ page }) => {
  await page.goto('/alumni');
  
  // Test search functionality
  await page.fill('[data-testid="search-input"]', 'John Doe');
  await page.click('[data-testid="search-button"]');
  
  await expect(page.locator('[data-testid="alumni-card"]')).toHaveCount(1);
  
  // Test filtering
  await page.selectOption('[data-testid="industry-filter"]', 'Technology');
  await expect(page.locator('[data-testid="alumni-card"]')).toHaveCount(3);
  
  // Test theme switching
  await page.selectOption('[data-testid="theme-selector"]', 'volunteer');
  await expect(page.locator('body')).toHaveCSS('--color-primary', 'hsl(25, 95%, 53%)');
});
```

## Deployment Strategy

### Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['zustand', '@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
```

### Environment Configuration

```typescript
// config/environment.ts
interface EnvironmentConfig {
  apiUrl: string;
  themeApiUrl: string;
  enableAnalytics: boolean;
  enableDebug: boolean;
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env;
  
  return {
    apiUrl: env.VITE_API_URL || 'http://localhost:8000/api',
    themeApiUrl: env.VITE_THEME_API_URL || 'http://localhost:8000/themes',
    enableAnalytics: env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebug: env.VITE_ENABLE_DEBUG === 'true',
  };
};
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to production
        run: |
          # Deployment steps
```

---

*This technical plan provides comprehensive guidance for implementing Prototype 2 with a focus on performance, maintainability, and scalability.*
