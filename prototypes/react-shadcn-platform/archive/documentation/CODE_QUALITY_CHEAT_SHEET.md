# Quick Reference - Anti-Pattern Prevention

> **Quick commands to find and fix common coding issues**

## 🚀 **Quick Commands**

### **Check Everything**
```bash
npm run check:all              # Full check (lint + type + anti-patterns)
npm run check:anti-patterns    # Complete anti-pattern scan
```

### **Specific Checks**
```bash
npm run validate:theme         # Theme system violations
npm run check:large-components # Components >500 lines
npm run check:performance      # Performance issues  
npm run check:accessibility    # A11y violations
```

### **Manual Searches**
```bash
# Find hardcoded colors
grep -r "backgroundColor.*#" src/
grep -r "hsl(210" src/

# Find large files
find src/ -name "*.tsx" -exec wc -l {} + | awk '$1 > 500'

# Find performance issues
grep -r "onClick={() =>" src/
grep -r "style={{" src/ | grep -v useMemo
```

## ❌ **Most Common Anti-Patterns**

### **1. Theme Violations**
```typescript
// ❌ WRONG
backgroundColor: 'hsl(210 25% 11%)'
backgroundColor: '#1f2937'

// ✅ CORRECT  
backgroundColor: 'hsl(var(--muted))'
backgroundColor: 'hsl(var(--background))'
```

### **2. Large Components**
```typescript
// ❌ WRONG - 800+ line component
export function MassiveComponent() {
  // Too much code in one place
}

// ✅ CORRECT - Split into smaller pieces
export function ComponentContainer() {
  return (
    <>
      <ComponentHeader />
      <ComponentBody />  
      <ComponentFooter />
    </>
  )
}
```

### **3. Performance Issues**
```typescript
// ❌ WRONG - Creates new function every render
<Button onClick={() => handleClick()}>

// ✅ CORRECT - Stable reference
const handleClick = useCallback(() => {}, [])
<Button onClick={handleClick}>
```

### **4. Accessibility Issues**
```typescript
// ❌ WRONG
<div onClick={handleClick}>Click me</div>

// ✅ CORRECT
<button onClick={handleClick} aria-label="Submit">Click me</button>
```

## 🔧 **Quick Fixes**

### **Fix Theme Issues**
```bash
# Find and replace common patterns
sed -i 's/backgroundColor: "[#][0-9a-fA-F]*"/backgroundColor: "hsl(var(--background))"/g' src/**/*.tsx
```

### **Check Component Sizes**
```bash
# Find components approaching limit
find src/components -name "*.tsx" -exec wc -l {} + | awk '$1 > 400 {print "⚠️ " $2 ": " $1 " lines"}'
```

### **Remove Console Logs**
```bash
# Find console statements
grep -rn "console\." src/
```

## 📋 **Pre-Commit Checklist**

- [ ] `npm run validate:theme` - No hardcoded colors
- [ ] `npm run check:large-components` - All components <500 lines
- [ ] `npm run check:performance` - No obvious performance issues
- [ ] `npm run check:accessibility` - Basic a11y compliance
- [ ] `npm run lint` - No ESLint errors
- [ ] `npm run type-check` - No TypeScript errors

## 🎯 **Quality Targets**

| Metric | Target | Command |
|--------|--------|---------|
| Theme violations | 0 | `npm run validate:theme` |
| Large components | 0 | `npm run check:large-components` |
| Console logs | 0 | `grep -r "console\." src/` |
| Inline functions | <5 | `grep -r "onClick={() =>" src/` |
| Missing keys | 0 | `grep -r "\.map(" src/ \| grep -v "key="` |

## 🚨 **Emergency Fixes**

### **Before Demo/Production**
```bash
# Quick cleanup
npm run format                    # Fix formatting
npm run lint --fix               # Auto-fix lint issues  
npm run validate:theme           # Check theme compliance
grep -r "console\." src/ && echo "Remove console logs!"
```

### **Before Code Review**
```bash
npm run check:all               # Full verification
npm run build                   # Ensure it builds
```

## 💡 **Pro Tips**

1. **Run checks frequently** - Don't wait for CI
2. **Fix issues immediately** - Don't let them accumulate  
3. **Use the validation scripts** - They catch 90% of issues
4. **Follow the guidelines** - They exist for good reasons
5. **Ask for help** - Better to ask than guess

## 📚 **Full Documentation**

- `ANTI_PATTERN_DETECTION_GUIDE.md` - Complete guide
- `GUIDELINES_THEME_COMPONENT_ENHANCEMENT.md` - Theme rules
- `CLAUDE.md` - AI assistant instructions
- `validate-theme-usage.js` - Smart validation script

---

**Remember: Good code is not just working code - it's maintainable, accessible, and performant code.**