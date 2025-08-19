# Claude AI Assistant Instructions

> **Project:** react-shadcn-platform  
> **Purpose:** Prevent theme system violations while allowing legitimate exceptions  
> **Critical:** Review EVERY time before making style-related changes

## 🚨 CRITICAL THEME RULES

### ❌ **NEVER DO (Zero Tolerance)**
```typescript
// NEVER hardcode colors in style props
backgroundColor: 'hsl(210 25% 11%)'  // ❌ WRONG - breaks theme switching
backgroundColor: '#1f2937'           // ❌ WRONG - hardcoded hex
color: 'rgb(31, 41, 55)'            // ❌ WRONG - hardcoded rgb

// NEVER override theme variables in CSS
:root {
  --muted: 210 40% 96%;      // ❌ WRONG - breaks theme system
  --background: 0 0% 100%;   // ❌ WRONG - prevents dark mode
}
```

### ✅ **ALWAYS DO (Required)**
```typescript
// ✅ USE theme variables in style props
backgroundColor: 'hsl(var(--muted))'      // Muted backgrounds
backgroundColor: 'hsl(var(--background))' // Main backgrounds
color: 'hsl(var(--foreground))'          // Text colors
```

## ✅ **LEGITIMATE EXCEPTIONS (Allowed)**

### 1. **Shadows and Effects**
```typescript
// ✅ ALLOWED - rgba for shadows
boxShadow: '2px 0 4px rgba(0,0,0,0.2)'
boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
```

### 2. **Layout Constants (Non-Color)**
```css
/* ✅ ALLOWED - layout constants in CSS */
:root {
  --radius: 0.5rem;             /* Border radius */
  --table-row-height: 48px;     /* Component sizing */
  --table-selection-width: 48px; /* Component sizing */
}
```

### 3. **Tailwind Classes**
```typescript
// ✅ ALLOWED - Tailwind utility classes
<Badge className="bg-green-500">Success</Badge>
<div className="text-red-500">Error</div>
```

### 4. **Theme Configuration Files**
```typescript
// ✅ ALLOWED - in theme config files only
// src/lib/theme/configs/dark.ts
export const darkTheme = {
  table: {
    container: 'hsl(222.2 84% 4.9%)',  // OK in theme config
    header: 'hsl(217.2 32.6% 17.5%)',  // OK in theme config
  }
}
```

## 🎯 **COMPONENT-SPECIFIC RULES**

### Table Components
```typescript
// ✅ CORRECT for table styling
style={{
  backgroundColor: 'hsl(var(--muted))',     // Headers
  backgroundColor: 'hsl(var(--background))', // Cells
  boxShadow: '2px 0 4px rgba(0,0,0,0.2)',  // Shadows OK
}}
```

### Badge Components
```typescript
// ✅ PREFERRED - use semantic variants
<Badge variant="destructive">Error</Badge>
<Badge variant="secondary">Info</Badge>

// ✅ ALLOWED - Tailwind classes
<Badge className="bg-green-500">Success</Badge>

// ❌ WRONG - hardcoded style props
<Badge style={{ backgroundColor: 'hsl(210 25% 11%)' }}>Wrong</Badge>
```

## 📋 **PRE-EDIT CHECKLIST**

Before making ANY style changes, ask:

1. ✅ Am I using `hsl(var(--variable))` format?
2. ✅ Is this a legitimate exception (shadow, constant, Tailwind)?
3. ✅ Will this work in both light AND dark themes?
4. ✅ Am I following the GUIDELINES_THEME_COMPONENT_ENHANCEMENT.md?

## 🔧 **VALIDATION TOOLS**

Run validation before committing:
```bash
# Check for violations
node validate-theme-usage.js

# Verbose output
node validate-theme-usage.js --verbose

# Auto-fix where possible
node validate-theme-usage.js --fix
```

## 📚 **KEY REFERENCE FILES**

1. **GUIDELINES_THEME_COMPONENT_ENHANCEMENT.md** - Complete rules
2. **TANSTACK_TABLE_ISSUES_ANALYSIS.md** - Known issues and fixes
3. **validate-theme-usage.js** - Automated checking

## 🚨 **COMMON MISTAKES TO AVOID**

1. **Converting colors from screenshots** - Use theme variables instead
2. **"Fixing" styling with hardcoded values** - Find the right theme variable
3. **Conditional hardcoding** - `isPinned ? 'hsl(210...)' : 'hsl(220...)'` is wrong
4. **Overriding in CSS** - Theme variables are managed by theme system

## 💡 **WHY THESE RULES EXIST**

- **Theme switching** must work seamlessly (< 200ms)
- **Dark/light modes** must both work perfectly
- **Maintenance** is easier with centralized theme management
- **Consistency** across all components and themes

## 🎯 **SUCCESS CRITERIA**

- All colors use `var(--variable)` format in components
- No hardcoded HSL/RGB/HEX values in style props
- Theme switching works instantly
- Both light and dark themes look correct

---

**Remember: The user has excellent guidelines. My job is to follow them precisely, understanding both the rules AND the legitimate exceptions.**