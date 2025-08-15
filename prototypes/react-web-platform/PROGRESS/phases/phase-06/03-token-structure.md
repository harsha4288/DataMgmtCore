# Phase 2.1: Performance-Optimized Token Structure

## Objective
Design a token hierarchy that minimizes bundle size, improves runtime performance, and enables platform-specific optimizations.

## ✅ TASK 6.2 IMPLEMENTATION STATUS (2025-08-15)

### Token Structure Implementation
- [x] 4-Level hierarchy implemented ✅
- [x] HSL format for all color tokens ✅ 
- [x] Semantic token mappings created ✅
- [x] Component-specific tokens validated ✅
- [x] Badge system fully restored with proper token references ✅

### Architecture Results
- **Bundle Size**: 14KB token CSS (52% better than target)
- **Token Count**: 200+ design tokens across all levels
- **Component Coverage**: Badge, table, interactive, typography systems
- **Theme Support**: Full light/dark theme switching via token system

## Token Architecture

### Layer 1: Core Tokens (Static)
```javascript
// These compile to CSS classes, not variables
const coreTokens = {
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px'
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
}
```

### Layer 2: Dynamic Tokens (CSS Variables)
```css
/* Only values that change with themes */
:root {
  /* Base colors - minimal set */
  --color-primary-h: 221.2;
  --color-primary-s: 83.2%;
  --color-primary-l: 53.3%;
  
  /* Computed values */
  --color-primary: hsl(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l));
  
  /* Shadows - theme-aware */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

### Layer 3: Semantic Aliases
```css
/* Component-intent mapping */
:root {
  --background: var(--color-white);
  --foreground: var(--color-gray-900);
  --card-bg: var(--background);
  --input-border: var(--color-gray-300);
}
```

## Platform Optimizations

### Mobile Token Subset
```javascript
// tokens.mobile.js - 70% smaller
export const mobileTokens = {
  // Reduced color palette
  colors: {
    primary: '#3B82F6',
    background: '#ffffff',
    text: '#1a1a1a',
    border: '#e5e7eb'
  },
  // Simplified shadows (better performance)
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.1)',
    md: null // No medium shadow on mobile
  },
  // Reduced spacing scale
  spacing: {
    sm: 8,
    md: 16,
    lg: 24
  }
}
```

### Desktop Full Set
```javascript
// tokens.desktop.js - Full experience
export const desktopTokens = {
  ...mobileTokens,
  // Additional desktop-only tokens
  animations: {
    duration: '200ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  // Extended shadows
  shadows: {
    ...mobileTokens.shadows,
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    xl: '0 20px 25px rgba(0,0,0,0.1)'
  }
}
```

## Build Pipeline Configuration

### Static vs Dynamic Separation
```javascript
// build-tokens.config.js
module.exports = {
  static: {
    // These become utility classes (.p-4, .text-sm)
    spacing: true,
    typography: true,
    sizing: true
  },
  dynamic: {
    // These remain CSS variables
    colors: true,
    shadows: true,
    borders: true
  },
  platforms: {
    mobile: {
      breakpoint: 768,
      tokenFile: 'tokens.mobile.json'
    },
    desktop: {
      breakpoint: 1024,
      tokenFile: 'tokens.desktop.json'
    }
  }
}
```

## Consolidation Map

### From Current → To Optimized
```javascript
const consolidationMap = {
  // Colors (reduce from 47 to 12)
  '--background': '--color-surface-base',
  '--card': '--color-surface-base',
  '--popover': '--color-surface-base',
  '--table-container': '--color-surface-base',
  
  // Borders (reduce from 12 to 3)
  '--border': '--border-default',
  '--input': '--border-default',
  '--table-border': '--border-default',
  
  // Shadows (reduce from 8 to 4)
  '--table-shadow': '--shadow-sm',
  '--card-elevation': '--shadow-sm'
}
```

## Performance Gains

### Expected Improvements
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| CSS Variables | 100+ | 40 | -60% |
| CSS Bundle | 121KB | 27KB | -77% |
| Theme Switch | 200ms | 50ms | -75% |
| Mobile FCP | 1.2s | 0.8s | -33% |

## Migration Strategy

### Phase 1: Non-Breaking Aliases
```css
/* Keep old names as aliases initially */
:root {
  --color-surface-base: #ffffff;
  
  /* Temporary aliases for backward compatibility */
  --background: var(--color-surface-base);
  --card: var(--color-surface-base);
  --popover: var(--color-surface-base);
}
```

### Phase 2: Component Updates
```css
/* Update components one by one */
.card {
  /* Old: background: hsl(var(--card)); */
  background: hsl(var(--color-surface-base));
}
```

### Phase 3: Remove Aliases
```css
/* After all components updated */
:root {
  --color-surface-base: #ffffff;
  /* Aliases removed */
}
```

## Validation Requirements

- [ ] Token count reduced by 60%
- [ ] No visual regressions
- [ ] Performance metrics improved
- [ ] Mobile bundle under 30KB
- [ ] Theme switch under 50ms

## Dev Team Next Steps

1. **Create `04-build-pipeline.md`**
   - Document webpack/vite configuration
   - Token compilation process
   - Platform detection logic

2. **Create `05-component-patterns.md`**
   - Card pattern tokens
   - Form pattern tokens
   - Modal pattern tokens

3. **Test consolidation map**
   - Apply to one component
   - Measure performance
   - Document issues

## Questions for Team Review

1. Naming convention preference?
   - `--color-surface-base` (descriptive)
   - `--c-surface-1` (abbreviated)
   - `--surf-100` (shorter)

2. Browser support requirements?
   - CSS variables (IE11 incompatible)
   - CSS logical properties
   - CSS container queries

3. Build tool preference?
   - Style Dictionary
   - PostCSS plugins
   - Custom Node scripts

---

**Critical Decision Points:**
- Confirm consolidation map before proceeding
- Agree on naming conventions
- Set browser support boundaries