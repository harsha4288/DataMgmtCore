# Phase 2.2: Build Pipeline Configuration

## Objective
Configure webpack/vite to compile tokens into optimized CSS with platform detection and static/dynamic separation.

## Performance Impact
- Bundle: 121KB → 27KB (-77%)
- Build time: ~2s added for token processing
- Mobile: Separate 8KB mobile-only bundle

## Key Decisions
1. **PostCSS for token compilation** - Transforms at build time, not runtime
2. **Platform detection via user-agent** - Server-side bundle selection
3. **Static tokens as utilities** - Spacing/typography become classes (.p-4)
4. **Dynamic tokens stay as CSS vars** - Colors/shadows for theme switching

## Implementation Approach
High-level pipeline: JSON tokens → PostCSS → Platform bundles → CDN

### Example:
```javascript
/* Before - Runtime resolution */
.card {
  padding: var(--spacing-4);  // Runtime lookup
  color: var(--color-text);   // Runtime lookup
}

/* After - Build-time optimization */
.card {
  padding: 16px;              // Static, compiled
  color: var(--color-text);   // Dynamic, preserved
}
```

## Migration Path
- [ ] Install PostCSS + Style Dictionary
- [ ] Configure token transformation rules
- [ ] Setup platform detection middleware
- [ ] Create separate build outputs
- [ ] Update CDN deployment

## Validation Checklist
- [ ] Bundle under 30KB achieved
- [ ] Build time under 5s
- [ ] Mobile bundle loads correctly
- [ ] Theme switching still works
- [ ] No visual regressions

## Blocking Issues
- Need to decide: PostCSS vs custom Node script
- CDN cache invalidation strategy required
- Platform detection accuracy on tablets

## Next: [05-component-patterns.md]