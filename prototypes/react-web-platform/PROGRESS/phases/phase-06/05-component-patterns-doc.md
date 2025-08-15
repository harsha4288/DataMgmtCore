# Phase 3.1: Component Token Patterns

## Objective
Define reusable token patterns for common UI components to ensure consistency and reduce duplication.

## Performance Impact
- Bundle: Component styles 45KB → 12KB (-73%)
- Runtime: 50% fewer variable lookups
- Mobile: Touch targets optimized to 44px minimum

## Key Decisions
1. **Pattern inheritance model** - Base pattern → variant extensions
2. **Mobile-first sizing** - 44px touch targets, scale down for desktop
3. **Elevation system** - 4 levels only (none, sm, md, lg)
4. **State tokens consolidated** - hover/focus/active share values

## Implementation Approach
Create composable patterns that components inherit rather than defining unique tokens per component.

### Example:
```css
/* Before - Component-specific tokens */
.card { 
  padding: var(--card-padding);
  shadow: var(--card-shadow);
}
.modal {
  padding: var(--modal-padding);
  shadow: var(--modal-shadow);
}

/* After - Shared pattern */
.surface-pattern {
  padding: var(--spacing-4);
  shadow: var(--elevation-md);
}
```

## Pattern Definitions

### Card Pattern
- Padding: spacing-4 (16px)
- Radius: radius-md (8px)
- Shadow: elevation-sm (default), elevation-md (hover)
- Background: color-surface-base

### Form Pattern
- Input height: 40px (mobile: 44px)
- Border: 1px border-default
- Focus ring: 2px color-primary
- Disabled opacity: 0.5

### Modal Pattern
- Overlay: color-overlay (rgba(0,0,0,0.5))
- Shadow: elevation-lg
- Animation: 200ms ease-out
- Max-width: 90vw mobile, 600px desktop

### Button Pattern
- Min height: 36px (mobile: 44px)
- Padding-x: spacing-3
- States: -5% lightness (hover), -10% (active)
- Disabled: 0.5 opacity

## Migration Path
- [ ] Audit existing component styles
- [ ] Map to pattern system
- [ ] Update high-traffic components first
- [ ] Deprecate component-specific tokens
- [ ] Remove unused tokens

## Validation Checklist
- [ ] All patterns tested on mobile
- [ ] Touch targets meet 44px minimum
- [ ] Contrast ratios pass WCAG AA
- [ ] Pattern reuse > 3 components each
- [ ] Bundle size reduction achieved

## Blocking Issues
- Legacy browser support for CSS logical properties
- Design team approval on consolidated shadows

## Next: [06-migration-strategy.md]