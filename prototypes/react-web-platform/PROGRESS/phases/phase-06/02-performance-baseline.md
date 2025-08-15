# Phase 1.2: Performance Baseline Measurement

## Objective
Establish quantifiable performance metrics before token optimization to prove improvement.

## Metrics to Capture

### 1. Bundle Metrics
```javascript
// Measure these programmatically
const metrics = {
  cssFileSize: 0,        // Total KB of CSS files
  jsFileSize: 0,         // Total KB of JS with styles
  variableCount: 0,      // Number of CSS variables
  duplicateValues: 0,    // Repeated values
  unusedVariables: 0     // Defined but not used
}
```

### 2. Runtime Performance
| Metric | How to Measure | Target |
|--------|---------------|--------|
| Theme Switch | Time to apply dark/light | <50ms |
| First Paint | Performance API | <1s mobile |
| CSS Parse Time | Chrome DevTools | <30ms |
| Variable Lookup | Performance test | <0.01ms |

### 3. Mobile-Specific Metrics
- Touch response time
- Scroll frame rate
- Memory usage
- Battery impact (Chrome DevTools)

## Performance Monitor Component

```tsx
// src/design-system/validation/PerformanceMonitor.tsx
export function PerformanceMonitor() {
  // Essential measurements only
  // Full implementation by dev team
  
  const measurements = {
    bundleSize: measureBundleSize(),
    themeSwitch: measureThemeSwitch(),
    paintMetrics: measurePaintTimes(),
    mobile: detectMobileMetrics()
  }
  
  return <Dashboard metrics={measurements} />
}
```

## Baseline Report Template

### Current State (Date: _____)
```yaml
Bundle:
  CSS: ___KB
  Variables: ___
  Duplicates: ___%

Performance:
  FCP: ___ms
  LCP: ___ms  
  Theme Switch: ___ms
  
Mobile:
  Lighthouse Score: ___
  Touch Delay: ___ms
```

## Critical Issues to Document

1. **Largest Performance Bottlenecks**
   - [ ] Identify top 3 issues
   - [ ] Measure impact of each

2. **Mobile-Specific Problems**
   - [ ] Slow interactions
   - [ ] Large bundle on 3G

3. **Theme Switching Cost**
   - [ ] Variables that cause reflow
   - [ ] Unnecessary recalculations

## Dev Team Actions

1. Run performance measurements
2. Create baseline report
3. Identify critical paths
4. Set improvement targets
5. Document in team wiki

## Success Criteria

Baseline is complete when:
- [ ] All metrics measured
- [ ] Report generated
- [ ] Team agrees on targets
- [ ] Mobile issues identified

## Next: `03-token-structure.md`